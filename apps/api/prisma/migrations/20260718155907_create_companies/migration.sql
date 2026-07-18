-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_workspaceId_idx" ON "Company"("workspaceId");

-- CreateIndex
CREATE INDEX "Company_workspaceId_name_idx" ON "Company"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
