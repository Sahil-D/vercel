const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const {
  CloudWatchLogsClient,
  GetLogEventsCommand,
} = require('@aws-sdk/client-cloudwatch-logs');
const cors = require('cors');
const { z } = require('zod');
const { PrismaClient, DeploymentStatus } = require('@prisma/client');

const app = express();

const PORT = process.env.PORT;
const PROXY_SERVER_PORT = process.env.PROXY_SERVER_PORT;

// User with ECS access only
const AWS_ECS_ACCESS_KEY_ID = process.env.AWS_ECS_ACCESS_KEY_ID; // isme ECS_Task_spin_user
const AWS_ECS_SECRET_ACCESS_KEY = process.env.AWS_ECS_SECRET_ACCESS_KEY;

// cluster config
const AWS_ECS_CLUSTER = process.env.AWS_ECS_CLUSTER;
const AWS_ECS_TASK = process.env.AWS_ECS_TASK;
const AWS_ECS_REGION = process.env.AWS_ECS_REGION;

const ecsClient = new ECSClient({
  region: AWS_ECS_REGION,
  credentials: {
    accessKeyId: AWS_ECS_ACCESS_KEY_ID,
    secretAccessKey: AWS_ECS_SECRET_ACCESS_KEY,
  },
});

const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: AWS_ECS_REGION,
});

const config = {
  CLUSTER: AWS_ECS_CLUSTER,
  TASK: AWS_ECS_TASK,
};

const prisma = new PrismaClient({});

app.use(express.json());
app.use(cors());

app.post('/project', async (req, res) => {
  const schema = z.object({
    name: z.string(),
    gitURL: z.string(),
  });

  const parsedBody = schema.safeParse(req.body);

  if (parsedBody.error)
    return res.status(400).json({ error: parsedBody.error });

  const { name, gitURL } = parsedBody.data;

  let projectSlug = generateSlug();

  let previousProject = await prisma.project.findFirst({
    where: { subDomain: projectSlug + '-' + name },
  });

  while (previousProject) {
    projectSlug = generateSlug();
    previousProject = await prisma.project.findFirst({
      where: { subDomain: projectSlug + '-' + name },
    });
  }

  const project = await prisma.project.create({
    data: {
      name,
      gitURL,
      subDomain: projectSlug + '-' + name,
    },
  });

  return res.json({ status: 'success', data: { project } });
});

app.post('/deploy', async (req, res) => {
  const { projectId } = req.body;

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) return res.status(404).json({ error: 'Project Not Found' });

  // check all deployments if any one has projectId same to it, it will mean that project is deployed
  const previousDeployment = await prisma.deployment.findFirst({
    where: {
      projectId: projectId,
    },
  });

  if (previousDeployment) {
    if (previousDeployment.status != DeploymentStatus.READY) {
      return res.status(409).json({
        error:
          'Previous Deployment exist with status : ' +
          previousDeployment.status,
      });
    } else {
      console.log('Detected previous failed deployment, Trying again...');
    }
  }

  const projectSlug = project.subDomain;

  // Spin the container
  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: 'FARGATE',
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: 'ENABLED',
        subnets: process.env.AWS_ECS_TASK_SUBNETS.split(','),
        securityGroups: process.env.AWS_ECS_TASK_SECURITY_GROUPS.split(','),
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: process.env.AWS_ECS_TASK_CONTAINER_OVERRIDE_NAME,
          environment: [
            { name: 'GIT_REPOSITORY_URL', value: project.gitURL },
            { name: 'PROJECT_ID', value: projectSlug },
          ],
        },
      ],
    },
  });

  const response = await ecsClient.send(command);
  const taskArn = response.tasks[0].taskArn;
  const taskId = taskArn.split('/').pop();
  console.log('Task created : ', taskId);

  const deployment = await prisma.deployment.create({
    data: {
      id: taskId,
      project: { connect: { id: projectId } },
      status: DeploymentStatus.QUEUED,
    },
  });

  return res.json({
    status: 'QUEUED',
    data: {
      deployment,
      projectSlug,
      url: `http://${projectSlug}.localhost:${PROXY_SERVER_PORT}`,
    },
  });
});

app.get('/logs', async (req, res) => {
  const { deploymentId } = req.body;

  const deployment = await prisma.deployment.findUnique({
    where: {
      id: deploymentId,
    },
  });

  if (!deployment) {
    return res.status(404).json({ error: 'No such deployment exists' });
  }

  try {
    const LOG_GROUP_NAME = process.env.AWS_ECS_LOG_GROUP_NAME;
    const LOG_STREAM_NAME = process.env.AWS_ECS_LOG_STREAM_NAME + deploymentId;

    const getLogEventsCommand = new GetLogEventsCommand({
      logGroupName: LOG_GROUP_NAME,
      logStreamName: LOG_STREAM_NAME,
      limit: parseInt(process.env.AWS_ECS_LOG_LIMIT, 10),
    });

    const response = await cloudWatchLogsClient.send(getLogEventsCommand);
    const logList = response.events.map((e) => e.message);
    // This is by default sorted

    return res.json({ logs: logList });
  } catch (e) {
    return res.status(500).json({ error: 'Error fetching logs: ' + e });
  }
});

app.listen(PORT, () => console.log(`API server running on PORT : ${PORT} `));
