const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
require('dotenv').config();

// From docker main.sh
const PROJECT_ID = process.env.PROJECT_ID;

// From project env
const PROJECT_FOLDER_NAME = process.env.PROJECT_FOLDER_NAME;
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const AWS_S3_REGION = process.env.AWS_S3_REGION;

// User with S3 access
const AWS_S3_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;
const AWS_S3_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: AWS_S3_REGION,
  credentials: {
    accessKeyId: AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
  },
});

async function init() {
  console.log('Container started to process project...');
  const repositoryPath = path.join(__dirname, PROJECT_FOLDER_NAME);

  const build_command = spawn('sh', [
    '-c',
    `cd ${repositoryPath} && npm install && npm run build && npm -v`,
  ]);

  build_command.stdout.on('data', function (data) {
    console.log(data.toString());
  });

  build_command.stdout.on('error', function (err) {
    console.log(err.toString());
  });

  build_command.on('close', async function (code) {
    if (code === 0) {
      console.log('Build complete');
    } else {
      console.error(`Build failed with code: ${code}`);
      console.log('exiting');
      return;
    }

    const distFolderPath = path.join(repositoryPath, 'dist');

    const distFolderContent = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    console.log('Starting to upload...');
    for (const file of distFolderContent) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log('uploading', filePath);

      const putFileToS3Command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(putFileToS3Command);
      console.log('Done... ');
      process.exit(0);
    }
    console.log('Successfully Deployed :)');
  });
}

init();
