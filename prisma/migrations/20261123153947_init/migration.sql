-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'ADMIN');

-- CreateEnum
CREATE TYPE "ServiceLifecycleStatus" AS ENUM ('ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "ServiceVersionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StepKind" AS ENUM ('PREPARE', 'VISIT', 'HANDOFF', 'FOLLOWUP');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('IN_PROGRESS', 'USER_MARKED_DONE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StepProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'USER_MARKED_DONE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportIssueType" AS ENUM ('OUTDATED_INFO', 'BROKEN_LINK', 'WRONG_REQUIREMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "RevisionAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'PUBLISH', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "HandoffChannel" AS ENUM ('WEB', 'PHYSICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('SERVICE_CREATE', 'SERVICE_UPDATE', 'VERSION_CREATE', 'VERSION_UPDATE', 'VERSION_SUBMIT', 'VERSION_APPROVE', 'VERSION_REJECT', 'VERSION_PUBLISH', 'VERSION_ARCHIVE', 'REPORT_TRIAGE', 'ADMIN_PROMOTE', 'ACCOUNT_DELETE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CITIZEN',
    "email_verified_at" TIMESTAMPTZ(6),
    "image" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lifecycle_status" "ServiceLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAlias" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "phrase" TEXT NOT NULL,

    CONSTRAINT "ServiceAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceVersion" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "ServiceVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT NOT NULL,
    "eligibility_note" TEXT,
    "verified_at" TIMESTAMPTZ(6),
    "verified_by_id" UUID,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialSource" (
    "id" UUID NOT NULL,
    "agency_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "last_checked_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OfficialSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionSource" (
    "service_version_id" UUID NOT NULL,
    "official_source_id" UUID NOT NULL,
    "evidence_note" TEXT,

    CONSTRAINT "VersionSource_pkey" PRIMARY KEY ("service_version_id","official_source_id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" UUID NOT NULL,
    "service_version_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "guidance" TEXT NOT NULL,
    "condition_note" TEXT,
    "sort_order" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" UUID NOT NULL,
    "service_version_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "guidance" TEXT NOT NULL,
    "step_kind" "StepKind" NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialHandoff" (
    "id" UUID NOT NULL,
    "service_version_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "official_url" VARCHAR(2048) NOT NULL,
    "channel_type" "HandoffChannel" NOT NULL,
    "caveat" TEXT,

    CONSTRAINT "OfficialHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCase" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service_version_id" UUID NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "ServiceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementProgress" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,
    "is_ready" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RequirementProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepProgress" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "workflow_step_id" UUID NOT NULL,
    "status" "StepProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "StepProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "reporter_id" UUID,
    "issue_type" "ReportIssueType" NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" UUID NOT NULL,
    "service_version_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "reviewer_id" UUID,
    "action" "RevisionAction" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "detail" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_provider_account_id_key" ON "Account"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_session_token_key" ON "Session"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_category_id_lifecycle_status_idx" ON "Service"("category_id", "lifecycle_status");

-- CreateIndex
CREATE INDEX "ServiceAlias_service_id_idx" ON "ServiceAlias"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAlias_service_id_phrase_key" ON "ServiceAlias"("service_id", "phrase");

-- CreateIndex
CREATE INDEX "ServiceVersion_service_id_status_idx" ON "ServiceVersion"("service_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceVersion_service_id_version_number_key" ON "ServiceVersion"("service_id", "version_number");

-- CreateIndex
CREATE INDEX "Requirement_service_version_id_sort_order_idx" ON "Requirement"("service_version_id", "sort_order");

-- CreateIndex
CREATE INDEX "WorkflowStep_service_version_id_sort_order_idx" ON "WorkflowStep"("service_version_id", "sort_order");

-- CreateIndex
CREATE INDEX "OfficialHandoff_service_version_id_idx" ON "OfficialHandoff"("service_version_id");

-- CreateIndex
CREATE INDEX "ServiceCase_user_id_status_started_at_idx" ON "ServiceCase"("user_id", "status", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementProgress_case_id_requirement_id_key" ON "RequirementProgress"("case_id", "requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "StepProgress_case_id_workflow_step_id_key" ON "StepProgress"("case_id", "workflow_step_id");

-- CreateIndex
CREATE INDEX "ContentReport_status_created_at_idx" ON "ContentReport"("status", "created_at");

-- CreateIndex
CREATE INDEX "ContentRevision_service_version_id_created_at_idx" ON "ContentRevision"("service_version_id", "created_at");

-- CreateIndex
CREATE INDEX "AuditEvent_entity_type_entity_id_idx" ON "AuditEvent"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "AuditEvent_created_at_idx" ON "AuditEvent"("created_at");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAlias" ADD CONSTRAINT "ServiceAlias_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVersion" ADD CONSTRAINT "ServiceVersion_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVersion" ADD CONSTRAINT "ServiceVersion_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionSource" ADD CONSTRAINT "VersionSource_service_version_id_fkey" FOREIGN KEY ("service_version_id") REFERENCES "ServiceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionSource" ADD CONSTRAINT "VersionSource_official_source_id_fkey" FOREIGN KEY ("official_source_id") REFERENCES "OfficialSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_service_version_id_fkey" FOREIGN KEY ("service_version_id") REFERENCES "ServiceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_service_version_id_fkey" FOREIGN KEY ("service_version_id") REFERENCES "ServiceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialHandoff" ADD CONSTRAINT "OfficialHandoff_service_version_id_fkey" FOREIGN KEY ("service_version_id") REFERENCES "ServiceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCase" ADD CONSTRAINT "ServiceCase_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCase" ADD CONSTRAINT "ServiceCase_service_version_id_fkey" FOREIGN KEY ("service_version_id") REFERENCES "ServiceVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementProgress" ADD CONSTRAINT "RequirementProgress_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "ServiceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementProgress" ADD CONSTRAINT "RequirementProgress_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepProgress" ADD CONSTRAINT "StepProgress_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "ServiceCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepProgress" ADD CONSTRAINT "StepProgress_workflow_step_id_fkey" FOREIGN KEY ("workflow_step_id") REFERENCES "WorkflowStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_service_version_id_fkey" FOREIGN KEY ("service_version_id") REFERENCES "ServiceVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Custom constraints and search indexes (tidak dapat diekspresikan di Prisma schema)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE UNIQUE INDEX "User_email_lower_key" ON "User" (lower("email"));

CREATE UNIQUE INDEX "ServiceVersion_one_published_per_service"
  ON "ServiceVersion" ("service_id")
  WHERE "status" = 'PUBLISHED';

CREATE UNIQUE INDEX "ServiceAlias_service_id_phrase_lower_key"
  ON "ServiceAlias" ("service_id", lower("phrase"));

CREATE INDEX "Service_title_idx"
  ON "Service" USING GIN ("title" gin_trgm_ops);

CREATE INDEX "ServiceAlias_phrase_idx"
  ON "ServiceAlias" USING GIN ("phrase" gin_trgm_ops);

CREATE INDEX "Service_title_fts_idx"
  ON "Service" USING GIN (to_tsvector('indonesian', "title"));

CREATE INDEX "ServiceVersion_summary_fts_idx"
  ON "ServiceVersion" USING GIN (to_tsvector('indonesian', "summary"));
