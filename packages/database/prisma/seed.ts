import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { slug: 'default-org' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default-org',
      status: 'ACTIVE',
      plan: 'FREE',
      settings: {},
    },
  });

  console.log('Created organization:', org.name);

  // Create default permissions
  const permissions = [
    { resource: 'users', action: 'create', description: 'Create users' },
    { resource: 'users', action: 'read', description: 'Read users' },
    { resource: 'users', action: 'update', description: 'Update users' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'organizations', action: 'read', description: 'Read organizations' },
    { resource: 'organizations', action: 'update', description: 'Update organizations' },
    { resource: 'organizations', action: 'delete', description: 'Delete organizations' },
    { resource: 'settings', action: 'read', description: 'Read settings' },
    { resource: 'settings', action: 'update', description: 'Update settings' },
    { resource: 'audit', action: 'read', description: 'Read audit logs' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: perm,
    });
  }

  console.log('Created permissions');

  // Create admin role
  const adminRole = await prisma.role.upsert({
    where: {
      organizationId_name: {
        organizationId: org.id,
        name: 'ADMIN',
      },
    },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with full access',
      isSystem: true,
      organizationId: org.id,
    },
  });

  // Assign all permissions to admin role
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('Created admin role with permissions');

  // Create member role
  const memberRole = await prisma.role.upsert({
    where: {
      organizationId_name: {
        organizationId: org.id,
        name: 'MEMBER',
      },
    },
    update: {},
    create: {
      name: 'MEMBER',
      description: 'Regular member with limited access',
      isSystem: true,
      organizationId: org.id,
    },
  });

  // Assign read-only permissions to member role
  const readPermissions = await prisma.permission.findMany({
    where: { action: 'read' },
  });
  for (const permission of readPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: memberRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: memberRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('Created member role with permissions');

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      status: 'ACTIVE',
      emailVerified: true,
      organizationId: org.id,
    },
  });

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('Created admin user:', adminUser.email);
  console.log('Password: Admin123!');

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
