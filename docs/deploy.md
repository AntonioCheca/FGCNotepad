# Deploy notes

Run every command on the Lightsail VM from `~/FGCNotepad`. The normal flow is still `scripts/deploy-prod.sh`; this file lists only what differs for a given release.

## Release: Symfony 7.4, PHP 8.4, security hardening (October 2026)

What changes in production:

- Backend image moves from `php:8.2-fpm` to `php:8.4-fpm`, Symfony 7.2 to 7.4, Composer 2.6 to 2.x.
- Doctrine switches to native lazy objects (requires PHP 8.4, no generated proxy files any more).
- `docker/nginx.prod.conf` gains security headers, `server_tokens off` and Cloudflare real-IP restoration.
- New role `ROLE_QA_TESTER`. Replay Lab and combo recommendations are limited to QA testers and admins.
- Login (5 failures / 15 min), registration (10 / hour per IP) and shared-review passwords (20 failures / 15 min per link) are rate limited.
- No new `.env.prod` variables and no schema migrations in this release.

### 1. Before deploying

```bash
cd ~/FGCNotepad

# Back up Postgres first.
sudo make prod-db-backup
sudo make prod-db-backup-list
```

`.env.prod` is ignored by git, so review it by hand after pulling. Nothing new is required for this release, but confirm these rows are still right: `APP_PUBLIC_DOMAIN`, `CORS_ALLOW_ORIGIN`, `SYMFONY_TRUSTED_HOSTS`, `NEXT_PUBLIC_API_URL`, `NEXT_SERVER_API_URL`, `REGISTRATION_ENABLED`.

Compare Cloudflare's published ranges with the `set_real_ip_from` lines in `docker/nginx.prod.conf`; add any range that is missing:

```bash
curl -s https://www.cloudflare.com/ips-v4; echo; curl -s https://www.cloudflare.com/ips-v6; echo
grep set_real_ip_from docker/nginx.prod.conf
```

### 2. Deploy

These differ from `scripts/deploy-prod.sh` in two places: `build --pull` (fetch the new PHP 8.4 / Node / Composer base images) and an explicit Nginx restart (the config file is bind-mounted, so `up -d` does not reload it).

```bash
git pull --ff-only
sudo docker compose -f docker-compose.prod.yml config >/dev/null

sudo docker compose -f docker-compose.prod.yml build --pull backend frontend
sudo docker compose -f docker-compose.prod.yml up -d

sudo docker compose -f docker-compose.prod.yml exec -T nginx nginx -t
sudo docker compose -f docker-compose.prod.yml restart nginx

sudo docker compose -f docker-compose.prod.yml exec -T backend php bin/console doctrine:migrations:migrate --no-interaction
```

### 3. Verify

```bash
# Expect PHP 8.4.x and Symfony 7.4.x.
sudo docker compose -f docker-compose.prod.yml exec -T backend php -v | head -1
sudo docker compose -f docker-compose.prod.yml exec -T backend php bin/console about --env=prod | grep -E "Version|Environment|Debug"

# Health check and new headers (expect strict-transport-security, x-frame-options, x-content-type-options, server: nginx without a version).
curl -s -o /dev/null -w "%{http_code}\n" https://fightinggametheory.com/api/health
curl -sI https://fightinggametheory.com/auth/login | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy|^server"

# Visitor IPs in the access log should be real client IPs with the last octet zeroed (e.g. 81.40.12.0), not Cloudflare 104.x / 172.64.x / 162.158.x addresses.
sudo docker compose -f docker-compose.prod.yml logs --tail 5 nginx
```

In the browser: log in, open Home, and check that the sidebar shows Replay Lab for admins only.

### 4. Grant the QA tester role

Admins already have QA access. For anyone else, use **Admin → Users** and pick the `QA Tester` or `Moderator + QA Tester` preset. Changing someone's roles logs them out once; they just log in again.

Fallback from the shell (replace `someone`):

```bash
sudo docker compose -f docker-compose.prod.yml exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
UPDATE forum."user" SET roles = (roles::jsonb || '["ROLE_QA_TESTER"]'::jsonb)::json
WHERE username = 'someone' AND NOT (roles::jsonb ? 'ROLE_QA_TESTER');
SQL
```

### Rollback

This release has no schema changes, so rolling back the code is enough:

```bash
git log --oneline -5                     # pick the commit before this release
git checkout <previous-commit>
sudo docker compose -f docker-compose.prod.yml build backend frontend
sudo docker compose -f docker-compose.prod.yml up -d
sudo docker compose -f docker-compose.prod.yml restart nginx
git checkout main                        # once a fix is ready to redeploy
```

Restore the database only if data was damaged:

```bash
sudo make prod-db-restore BACKUP=/opt/fightinggametheory/backups/postgres/<file>.dump CONFIRM_PROD_DB_RESTORE=restore
```

## Scheduled jobs (root crontab on the VM)

`/privacy` promises that original Replay Lab videos are deleted after 14 days and that database backups are kept for up to 14 days.
Both only hold while these jobs run (`sudo crontab -e`):

```cron
0 3 * * * cd /home/ubuntu/FGCNotepad && /usr/bin/make prod-db-backup >> /var/log/fgcnotepad-db-backup.log 2>&1
30 3 * * * cd /home/ubuntu/FGCNotepad && /usr/bin/docker compose -f docker-compose.prod.yml exec -T backend php bin/console app:replay-lab:cleanup >> /var/log/fgcnotepad-replay-cleanup.log 2>&1
```

Lightsail automatic snapshots (7 days) must stay enabled; local dumps do not survive losing the instance.
