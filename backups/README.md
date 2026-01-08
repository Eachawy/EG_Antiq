# Database Backups

This directory stores database backups created during production deployments.

## Backup Files

Backups are automatically created by the deployment script with the naming format:
`backup_before_date_migration_YYYYMMDD_HHMMSS.sql`

## Retention Policy

- Keep backups for at least 30 days after deployment
- Verify deployment success before deleting backups
- Consider archiving backups to external storage

## Restore a Backup

Using the rollback script (recommended):
```bash
./rollback-production.sh
```

Manual restore:
```bash
docker exec -i backend-postgres psql -U postgres -d Antiq_db < backups/backup_[timestamp].sql
```

## Backup Size

Check backup sizes:
```bash
du -sh backups/*
```

