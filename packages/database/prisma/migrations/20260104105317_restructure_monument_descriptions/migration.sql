-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('JOURNAL', 'BOOK', 'WEBSITE', 'REPORT', 'THESIS', 'CONFERENCE', 'ENCYCLOPEDIA');

-- CreateEnum
CREATE TYPE "PortalUserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "OAuthProviderType" AS ENUM ('GOOGLE', 'FACEBOOK', 'APPLE');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESPONDED', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetPasswordToken" VARCHAR(255),
    "resetPasswordExpires" TIMESTAMPTZ,
    "organizationId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "createdBy" UUID,
    "updatedBy" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" VARCHAR(50) NOT NULL DEFAULT 'FREE',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "createdBy" UUID,
    "updatedBy" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resourceId" UUID NOT NULL,
    "changesBefore" JSONB,
    "changesAfter" JSONB,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "correlationId" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eras" (
    "id" SERIAL NOT NULL,
    "name_ar" VARCHAR NOT NULL,
    "name_en" VARCHAR NOT NULL,
    "date_from" VARCHAR NOT NULL,
    "date_to" VARCHAR NOT NULL,
    "hijri_from" VARCHAR NOT NULL,
    "hijri_to" VARCHAR NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynasty" (
    "id" SERIAL NOT NULL,
    "name_ar" VARCHAR NOT NULL,
    "name_en" VARCHAR NOT NULL,
    "era_id" INTEGER NOT NULL,
    "date_from" VARCHAR NOT NULL,
    "date_to" VARCHAR NOT NULL,
    "hijri_from" VARCHAR NOT NULL,
    "hijri_to" VARCHAR NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dynasty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monuments_type" (
    "id" SERIAL NOT NULL,
    "name_ar" VARCHAR NOT NULL,
    "name_en" VARCHAR NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monuments_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monuments" (
    "id" SERIAL NOT NULL,
    "monument_name_ar" VARCHAR NOT NULL,
    "monument_name_en" VARCHAR NOT NULL,
    "monument_biography_ar" VARCHAR NOT NULL,
    "monument_biography_en" VARCHAR NOT NULL,
    "lat" VARCHAR NOT NULL,
    "lng" VARCHAR NOT NULL,
    "image" VARCHAR NOT NULL,
    "m_date" VARCHAR NOT NULL,
    "monuments_type_id" INTEGER NOT NULL,
    "era_id" INTEGER NOT NULL,
    "dynasty_id" INTEGER NOT NULL,
    "zoom" VARCHAR NOT NULL,
    "center" VARCHAR NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monuments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monuments_era" (
    "id" SERIAL NOT NULL,
    "monument_id" INTEGER,
    "era_id" INTEGER NOT NULL,
    "monuments_type_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monuments_era_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery" (
    "id" SERIAL NOT NULL,
    "gallery_path" VARCHAR NOT NULL,
    "dynasty_id" INTEGER NOT NULL,
    "era_id" INTEGER NOT NULL,
    "monuments_type_id" INTEGER NOT NULL,
    "monuments_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "description_monuments" (
    "id" SERIAL NOT NULL,
    "description_ar" VARCHAR NOT NULL,
    "description_en" VARCHAR NOT NULL,
    "monument_id" INTEGER NOT NULL,
    "era_id" INTEGER,
    "monuments_type_id" INTEGER,
    "dynasty_id" INTEGER,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "description_monuments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" SERIAL NOT NULL,
    "title_ar" VARCHAR(500) NOT NULL,
    "title_en" VARCHAR(500) NOT NULL,
    "author_ar" VARCHAR(255),
    "author_en" VARCHAR(255),
    "publication_year" INTEGER,
    "publisher" VARCHAR(255),
    "source_type" "SourceType",
    "url" VARCHAR(1000),
    "pages" VARCHAR(100),
    "volume" VARCHAR(50),
    "issue" VARCHAR(50),
    "isbn" VARCHAR(50),
    "doi" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" SERIAL NOT NULL,
    "title_ar" VARCHAR(500) NOT NULL,
    "title_en" VARCHAR(500) NOT NULL,
    "author_ar" VARCHAR(255) NOT NULL,
    "author_en" VARCHAR(255) NOT NULL,
    "cover_image" VARCHAR(500),
    "publication_year" INTEGER,
    "publisher" VARCHAR(255),
    "isbn" VARCHAR(50),
    "pages" INTEGER,
    "description" TEXT,
    "read_url" VARCHAR(1000),
    "purchase_url" VARCHAR(1000),
    "language" VARCHAR(10),
    "edition" VARCHAR(50),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monument_sources" (
    "id" SERIAL NOT NULL,
    "monument_id" INTEGER NOT NULL,
    "source_id" INTEGER NOT NULL,
    "page_numbers" VARCHAR(100),
    "notes" TEXT,
    "display_order" INTEGER,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monument_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monument_books" (
    "id" SERIAL NOT NULL,
    "monument_id" INTEGER NOT NULL,
    "book_id" INTEGER NOT NULL,
    "relevance" VARCHAR(255),
    "display_order" INTEGER,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monument_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255),
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50),
    "location" VARCHAR(255),
    "bio" TEXT,
    "avatar" VARCHAR(500),
    "status" "PortalUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "resetPasswordToken" VARCHAR(255),
    "resetPasswordExpires" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "lastLoginAt" TIMESTAMPTZ,

    CONSTRAINT "portal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_providers" (
    "id" UUID NOT NULL,
    "portalUserId" UUID NOT NULL,
    "provider" "OAuthProviderType" NOT NULL,
    "providerId" VARCHAR(255) NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMPTZ,
    "profileData" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "oauth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_refresh_tokens" (
    "id" UUID NOT NULL,
    "portalUserId" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ,

    CONSTRAINT "portal_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "portalUserId" UUID NOT NULL,
    "monumentId" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "browsing_history" (
    "id" UUID NOT NULL,
    "portalUserId" UUID NOT NULL,
    "monumentId" INTEGER NOT NULL,
    "visitedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER,

    CONSTRAINT "browsing_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL,
    "portalUserId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "keyword" VARCHAR(500),
    "eraIds" INTEGER[],
    "dynastyIds" INTEGER[],
    "monumentTypeIds" INTEGER[],
    "dateFrom" VARCHAR(100),
    "dateTo" VARCHAR(100),
    "filters" JSONB NOT NULL,
    "resultCount" INTEGER,
    "lastRunAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "portalUserId" UUID NOT NULL,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "newsletterEnabled" BOOLEAN NOT NULL DEFAULT true,
    "siteUpdates" BOOLEAN NOT NULL DEFAULT false,
    "showBrowsingHistory" BOOLEAN NOT NULL DEFAULT true,
    "autoSaveSearches" BOOLEAN NOT NULL DEFAULT true,
    "additionalSettings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL,
    "portalUserId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'PENDING',
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "respondedAt" TIMESTAMPTZ,
    "respondedBy" UUID,
    "response" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "id" UUID NOT NULL,
    "portalUserId" UUID,
    "email" VARCHAR(255) NOT NULL,
    "isSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "verificationToken" VARCHAR(255),
    "verifiedAt" TIMESTAMPTZ,
    "unsubscribeToken" VARCHAR(255) NOT NULL,
    "subscribedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMPTZ,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "roles_organizationId_idx" ON "roles"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organizationId_name_key" ON "roles"("organizationId", "name");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_idx" ON "audit_logs"("organizationId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "audit_logs"("resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_correlationId_idx" ON "audit_logs"("correlationId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "monuments_era_monument_id_idx" ON "monuments_era"("monument_id");

-- CreateIndex
CREATE INDEX "description_monuments_monument_id_idx" ON "description_monuments"("monument_id");

-- CreateIndex
CREATE INDEX "monument_sources_monument_id_idx" ON "monument_sources"("monument_id");

-- CreateIndex
CREATE INDEX "monument_sources_source_id_idx" ON "monument_sources"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "monument_sources_monument_id_source_id_key" ON "monument_sources"("monument_id", "source_id");

-- CreateIndex
CREATE INDEX "monument_books_monument_id_idx" ON "monument_books"("monument_id");

-- CreateIndex
CREATE INDEX "monument_books_book_id_idx" ON "monument_books"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "monument_books_monument_id_book_id_key" ON "monument_books"("monument_id", "book_id");

-- CreateIndex
CREATE UNIQUE INDEX "portal_users_email_key" ON "portal_users"("email");

-- CreateIndex
CREATE INDEX "portal_users_email_idx" ON "portal_users"("email");

-- CreateIndex
CREATE INDEX "portal_users_status_idx" ON "portal_users"("status");

-- CreateIndex
CREATE INDEX "oauth_providers_portalUserId_idx" ON "oauth_providers"("portalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_providers_provider_providerId_key" ON "oauth_providers"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_refresh_tokens_token_key" ON "portal_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "portal_refresh_tokens_portalUserId_idx" ON "portal_refresh_tokens"("portalUserId");

-- CreateIndex
CREATE INDEX "portal_refresh_tokens_token_idx" ON "portal_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "favorites_portalUserId_idx" ON "favorites"("portalUserId");

-- CreateIndex
CREATE INDEX "favorites_monumentId_idx" ON "favorites"("monumentId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_portalUserId_monumentId_key" ON "favorites"("portalUserId", "monumentId");

-- CreateIndex
CREATE INDEX "browsing_history_portalUserId_idx" ON "browsing_history"("portalUserId");

-- CreateIndex
CREATE INDEX "browsing_history_monumentId_idx" ON "browsing_history"("monumentId");

-- CreateIndex
CREATE INDEX "browsing_history_visitedAt_idx" ON "browsing_history"("visitedAt");

-- CreateIndex
CREATE INDEX "saved_searches_portalUserId_idx" ON "saved_searches"("portalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_portalUserId_key" ON "user_settings"("portalUserId");

-- CreateIndex
CREATE INDEX "contact_messages_portalUserId_idx" ON "contact_messages"("portalUserId");

-- CreateIndex
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");

-- CreateIndex
CREATE INDEX "contact_messages_email_idx" ON "contact_messages"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_portalUserId_key" ON "newsletter_subscriptions"("portalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_unsubscribeToken_key" ON "newsletter_subscriptions"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_email_idx" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_isSubscribed_idx" ON "newsletter_subscriptions"("isSubscribed");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dynasty" ADD CONSTRAINT "dynasty_era_id_fkey" FOREIGN KEY ("era_id") REFERENCES "eras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monuments" ADD CONSTRAINT "monuments_monuments_type_id_fkey" FOREIGN KEY ("monuments_type_id") REFERENCES "monuments_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monuments" ADD CONSTRAINT "monuments_era_id_fkey" FOREIGN KEY ("era_id") REFERENCES "eras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monuments" ADD CONSTRAINT "monuments_dynasty_id_fkey" FOREIGN KEY ("dynasty_id") REFERENCES "dynasty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monuments_era" ADD CONSTRAINT "monuments_era_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monuments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monuments_era" ADD CONSTRAINT "monuments_era_era_id_fkey" FOREIGN KEY ("era_id") REFERENCES "eras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monuments_era" ADD CONSTRAINT "monuments_era_monuments_type_id_fkey" FOREIGN KEY ("monuments_type_id") REFERENCES "monuments_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_dynasty_id_fkey" FOREIGN KEY ("dynasty_id") REFERENCES "dynasty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_era_id_fkey" FOREIGN KEY ("era_id") REFERENCES "eras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_monuments_type_id_fkey" FOREIGN KEY ("monuments_type_id") REFERENCES "monuments_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_monuments_id_fkey" FOREIGN KEY ("monuments_id") REFERENCES "monuments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "description_monuments" ADD CONSTRAINT "description_monuments_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monuments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "description_monuments" ADD CONSTRAINT "description_monuments_era_id_fkey" FOREIGN KEY ("era_id") REFERENCES "eras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "description_monuments" ADD CONSTRAINT "description_monuments_monuments_type_id_fkey" FOREIGN KEY ("monuments_type_id") REFERENCES "monuments_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "description_monuments" ADD CONSTRAINT "description_monuments_dynasty_id_fkey" FOREIGN KEY ("dynasty_id") REFERENCES "dynasty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monument_sources" ADD CONSTRAINT "monument_sources_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monuments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monument_sources" ADD CONSTRAINT "monument_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monument_books" ADD CONSTRAINT "monument_books_monument_id_fkey" FOREIGN KEY ("monument_id") REFERENCES "monuments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monument_books" ADD CONSTRAINT "monument_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_providers" ADD CONSTRAINT "oauth_providers_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_refresh_tokens" ADD CONSTRAINT "portal_refresh_tokens_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_monumentId_fkey" FOREIGN KEY ("monumentId") REFERENCES "monuments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browsing_history" ADD CONSTRAINT "browsing_history_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browsing_history" ADD CONSTRAINT "browsing_history_monumentId_fkey" FOREIGN KEY ("monumentId") REFERENCES "monuments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "portal_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter_subscriptions" ADD CONSTRAINT "newsletter_subscriptions_portalUserId_fkey" FOREIGN KEY ("portalUserId") REFERENCES "portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
