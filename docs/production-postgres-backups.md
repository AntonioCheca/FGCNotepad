# Production Postgres Backups

Production backups are local logical Postgres dumps stored on the Lightsail instance. This protects against bad migrations, accidental data edits, bad imports, and QA mistakes.

Local backups do not protect against total instance or disk loss. Keep Lightsail snapshots enabled until an off-instance backup target is added later.

## Backup Location

Default backup directory:

```bash
/opt/fightinggametheory/backups/postgres
```

The backup script creates Postgres custom-format dump files named like:

```bash
fgc_db_20260819_030000.dump
```

The default retention keeps the latest `14` dumps. Override this per run with `BACKUP_RETENTION=30` if needed.

## Before Running Production Commands

After pulling changes on the Lightsail VM, review ignored `.env.prod` manually before deploy or backup work. Common rows to verify are `APP_PUBLIC_DOMAIN`, `CORS_ALLOW_ORIGIN`, `SYMFONY_TRUSTED_HOSTS`, `NEXT_PUBLIC_API_URL`, `NEXT_SERVER_API_URL`, and `REGISTRATION_ENABLED`.

Validate production Compose on the VM:

```bash
sudo docker compose -f docker-compose.prod.yml config
```

## Manual Backup

From `~/FGCNotepad` on the Lightsail VM:

```bash
sudo make prod-db-backup
```

Use this before high-risk data work:

```bash
sudo make prod-db-backup BACKUP_RETENTION=30
```

## List Backups

```bash
sudo make prod-db-backup-list
```

## Scheduled Backup

Install a daily cron job on the Lightsail VM. Use the absolute repository path from `pwd`; the example below assumes `/home/ubuntu/FGCNotepad`.

```bash
sudo crontab -e
```

Add:

```cron
0 3 * * * cd /home/ubuntu/FGCNotepad && /usr/bin/make prod-db-backup >> /var/log/fgcnotepad-db-backup.log 2>&1
```

If the repository path differs, use the real production path.

## Restore Production

Production restore is destructive. Test the backup against a local or temporary database first whenever possible.

From `~/FGCNotepad` on the Lightsail VM:

```bash
sudo make prod-db-restore BACKUP=/opt/fightinggametheory/backups/postgres/fgc_db_YYYYMMDD_HHMMSS.dump CONFIRM_PROD_DB_RESTORE=restore
```

The restore script stops `frontend` and `backend` during the restore, then restarts them afterward. After restore, run application smoke checks before continuing data work.

## Restore Drill Checklist

- Create a fresh manual backup with `sudo make prod-db-backup`.
- Confirm it appears in `sudo make prod-db-backup-list`.
- Copy the dump to a local or temporary environment when feasible.
- Restore with `pg_restore` into a non-production database.
- Confirm the app can read expected users, posts, combos, and imported frame data.

## Snapshot Safety Net

Keep Lightsail instance snapshots enabled. Snapshots are the disaster recovery layer for losing the whole instance, while these Postgres dumps are the fast rollback layer for database-level mistakes.
