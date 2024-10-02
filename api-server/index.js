const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const cors = require('cors');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const app = express();

const PORT = process.env.PORT;
const PROXY_SERVER_PORT = process.env.PROXY_SERVER_PORT;

// User with ECS access only
const AWS_ECS_ACCESS_KEY_ID = process.env.AWS_ECS_ACCESS_KEY_ID; // isme ECS_Task_spin_user
const AWS_ECS_SECRET_ACCESS_KEY = process.env.AWS_ECS_SECRET_ACCESS_KEY;

// cluster config
const AWS_ECS_CLUSTER = process.env.AWS_ECS_CLUSTER;
const AWS_ECS_TASK = process.env.AWS_ECS_TASK;

const ecsClient = new ECSClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: AWS_ECS_ACCESS_KEY_ID,
    secretAccessKey: AWS_ECS_SECRET_ACCESS_KEY,
  },
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

  const projectSlug = generateSlug();

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
  console.log('Task ID : ', taskId);

  const deployment = await prisma.deployment.create({
    data: {
      id: taskId,
      project: { connect: { id: projectId } },
      status: 'QUEUED',
    },
  });

  return res.json({
    status: 'queued',
    data: {
      deployment,
      projectSlug,
      url: `http://${projectSlug}.localhost:${PROXY_SERVER_PORT}`,
    },
  });
});

app.listen(PORT, () => console.log(`API server running on PORT : ${PORT} `));
