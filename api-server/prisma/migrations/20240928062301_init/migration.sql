-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('NOT_STARTED', 'QUEUED', 'IN_PROGRESS', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "git_url" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "custom_domain" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'NOT_STARTED',

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
