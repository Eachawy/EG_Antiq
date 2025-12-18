-- Seed database with default data

-- Create default organization
INSERT INTO organizations (id, name, slug, status, plan, settings, "createdAt", "updatedAt", version)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Default Organization',
  'default-org',
  'ACTIVE',
  'FREE',
  '{}',
  NOW(),
  NOW(),
  1
) ON CONFLICT (slug) DO NOTHING;

-- Create default permissions
INSERT INTO permissions (id, resource, action, description, "createdAt")
VALUES
  (gen_random_uuid(), 'users', 'create', 'Create users', NOW()),
  (gen_random_uuid(), 'users', 'read', 'Read users', NOW()),
  (gen_random_uuid(), 'users', 'update', 'Update users', NOW()),
  (gen_random_uuid(), 'users', 'delete', 'Delete users', NOW()),
  (gen_random_uuid(), 'organizations', 'read', 'Read organizations', NOW()),
  (gen_random_uuid(), 'organizations', 'update', 'Update organizations', NOW()),
  (gen_random_uuid(), 'organizations', 'delete', 'Delete organizations', NOW()),
  (gen_random_uuid(), 'settings', 'read', 'Read settings', NOW()),
  (gen_random_uuid(), 'settings', 'update', 'Update settings', NOW()),
  (gen_random_uuid(), 'audit', 'read', 'Read audit logs', NOW())
ON CONFLICT (resource, action) DO NOTHING;

-- Create admin role
INSERT INTO roles (id, name, description, "isSystem", "organizationId", "createdAt", "updatedAt", version)
VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'ADMIN',
  'Administrator with full access',
  true,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  NOW(),
  NOW(),
  1
) ON CONFLICT ("organizationId", name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions ("roleId", "permissionId", "assignedAt")
SELECT 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', id, NOW()
FROM permissions
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Create member role
INSERT INTO roles (id, name, description, "isSystem", "organizationId", "createdAt", "updatedAt", version)
VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'MEMBER',
  'Regular member with limited access',
  true,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  NOW(),
  NOW(),
  1
) ON CONFLICT ("organizationId", name) DO NOTHING;

-- Assign read-only permissions to member role
INSERT INTO role_permissions ("roleId", "permissionId", "assignedAt")
SELECT 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', id, NOW()
FROM permissions
WHERE action = 'read'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Create admin user (password: Admin123!)
-- Hash generated with: bcrypt.hash('Admin123!', 12)
INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", status, "emailVerified", "organizationId", "createdAt", "updatedAt", version)
VALUES (
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin@example.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ByJ0qZH6bLAS',
  'Admin',
  'User',
  'ACTIVE',
  true,
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  NOW(),
  NOW(),
  1
) ON CONFLICT (email) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO user_roles ("userId", "roleId", "assignedAt")
VALUES (
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  NOW()
) ON CONFLICT ("userId", "roleId") DO NOTHING;

-- Display success message
SELECT 'Database seeded successfully!' AS message;
SELECT 'Admin user: admin@example.com / Admin123!' AS credentials;
