# Gojoline on an AWS server

One server runs Gojoline in Docker, with Caddy in front for HTTPS. It updates itself from GitHub
`main` every 5 minutes and runs the daily visits job. Why: `docs/DECISIONS.md` (2026-11-19).

Time: about 1 to 2 hours. Cost: about $1 a day of AWS credit (`t4g.medium`).

**Works:** everything, including building and changing sites with AI. Each site being worked on
runs in its own container on this server (no internet, capped memory), started by a small
"runner"; its live preview is at `https://gojo-<id>.preview.gojoline.afridea.et`.
**Published sites** are served from this server too, at `https://<name>.afridea.et`
(section "Customer sites" below: one DNS record, two lines in `.env`, one script).

---

## 1. Create the server (AWS console)

Open EC2 in Frankfurt: https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1#LaunchInstances:

| Setting | Choose |
|---|---|
| Name | `gojoline` |
| Image (AMI) | **Ubuntu Server 24.04 LTS**, architecture **64-bit (Arm)** |
| Instance type | **t4g.medium** (2 vCPU, 4 GB) |
| Key pair | "Proceed without a key pair" is fine: you connect from the browser (step 3) |
| Network settings | Tick **Allow HTTPS** and **Allow HTTP** from the internet, and **Allow SSH traffic** (we narrow SSH to AWS's browser terminal right after launch, below) |
| Storage | **30 GB gp3** |
| Advanced details → Metadata version | **V2 only (token required)** |

Click **Launch instance**.

**Narrow SSH to the browser terminal only:** EC2 → Instances → `gojoline` → **Security** tab → the
security group → **Edit inbound rules** → the SSH rule's **Source**: choose **Custom** and type
`ec2-instance-connect`, pick **com.amazonaws.eu-central-1.ec2-instance-connect** → Save rules.
Now nobody on the internet can even try to log in; only the Connect button in the AWS console works.

**Protect `main` on GitHub** (the server deploys whatever reaches `main`): the repo → **Settings →
Branches → Add branch protection rule** → branch `main`, leave **Allow force pushes** and
**Allow deletions** off → Create. (Merges still go straight to `main` after the checks, as now.)

## 2. Give it a fixed address (Elastic IP)

EC2 → **Elastic IPs** → **Allocate Elastic IP address** → Allocate. Then **Actions → Associate**
→ choose the `gojoline` instance → Associate. Write the address down (e.g. `3.120.45.67`).

## 3. Open a terminal on the server

EC2 → Instances → select `gojoline` → **Connect** → **EC2 Instance Connect** → **Connect**.
A black terminal opens in the browser. Paste each command below and press Enter.

## 4. Let the server read the code (read-only)

```bash
sudo install -d -m 700 /root/.ssh && sudo ssh-keygen -q -t ed25519 -N "" -C gojoline-server -f /root/.ssh/id_ed25519 && sudo cat /root/.ssh/id_ed25519.pub
```

Copy the line it prints (starts with `ssh-ed25519`). On GitHub: the `gojoline` repo →
**Settings → Deploy keys → Add deploy key**. Title `aws server`, paste the key, leave
**Allow write access unticked**, Add key. Then:

```bash
echo 'github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl' | sudo tee -a /root/.ssh/known_hosts >/dev/null && sudo git clone --branch main git@github.com:jabez-abija2399/gojoline.git /opt/gojoline
```

## 5. First setup run (creates the settings file)

```bash
sudo bash /opt/gojoline/deploy/server/setup.sh
```

It installs security updates, Docker, a firewall and swap, then stops and asks you to fill in the settings.

## 6. Fill in the settings

```bash
sudo nano /opt/gojoline/deploy/server/.env
```

Copy each value from the old Vercel project (gojoline → Settings → Environment Variables).
Keep `BETTER_AUTH_SECRET` exactly the same, or everyone is signed out. Leave empty what you
never set. Write values as they are: no quotes, no spaces around `=`. Save: **Ctrl+O**, Enter, **Ctrl+X**. Never paste these values into a chat.

## 7. Start it

```bash
sudo bash /opt/gojoline/deploy/server/setup.sh
```

The first build takes 5 to 10 minutes. At the end it says **Done**.

## 8. Point the address at the server (Cloudflare)

Cloudflare → `afridea.et` → **DNS** → edit the `gojoline` record:
type **A**, content = the Elastic IP from step 2, proxy status **DNS only (grey cloud)**. Save.

Grey cloud matters: the app limits sign-in attempts by the visitor's address, and Caddy gets the
HTTPS certificate itself. Within a few minutes https://gojoline.afridea.et works again.
Telegram and Google sign-in keep working: the address didn't change.

## 8b. Previews address (once)

Cloudflare → `afridea.et` → **DNS** → **Add record**: type **A**, name **`*.preview.gojoline`**,
IPv4 = the Elastic IP, proxy **DNS only (grey cloud)**. Save. Each preview gets its own
certificate automatically the first time it opens.

## 8c. Customer sites (once): bring the published sites back

Published sites used to live at `gojo-<name>.vercel.app`, which shows an error while the Vercel
team is paused. This moves them to `https://<name>.afridea.et`, served by Caddy on this server.

1. **DNS** (Cloudflare → `afridea.et` → **DNS**): a record of type **A**, name **`*`**, IPv4
   **3.66.202.79**, proxy **DNS only (grey cloud)**. If a `*` record already exists (it pointed at
   Vercel), edit it to this. Records with their own name (`gojoline`, `askaddis`, `*.preview.gojoline`,
   mail records, …) keep working: a named record always wins over `*`.
2. **Settings:** `sudo nano /opt/gojoline/deploy/server/.env` and make sure these lines are there:
   ```
   PUBLISH_PROVIDER=server
   PUBLISH_BASE_DOMAIN=afridea.et
   ```
   Keep `VERCEL_TOKEN` and `VERCEL_TEAM_ID` if you have them (old addresses forward later, step 5).
   Recommended: also do 8d (one certificate for all sites) before step 4.
3. **Deploy** (once this change is on `main`): `sudo bash /opt/gojoline/deploy/server/setup.sh`
   (installs the new update script, then builds and starts everything; Caddy now runs as its own
   user, not root). Check: `curl -s https://gojoline.afridea.et/api/health` prints `{"ok":true}`.
4. **Move the sites, off-peak** (late evening Addis time: each site is a build on the server
   builders use). First a dry run (lists every site and what would happen, changes nothing):
   ```bash
   cd /opt/gojoline && sudo docker run --rm -v "$PWD/scripts:/s:ro" -v "$PWD/deploy/server/.env:/env:ro" node:22-bookworm-slim node /s/republish-all.mts --env /env --dry-run
   ```
   Then the same command without `--dry-run`. Each site is published again from the version that
   is live now (the same checks, badge and forms as a normal publish), about a minute per site plus
   a 30 s pause (`--delay <seconds>`), one line per site; `--limit 10` moves 10 and stops. While
   builders use both workspaces it waits (up to 10 minutes per site) instead of stopping their
   previews. Without 8d it warns when more than 35 sites would need a new certificate this week
   (Let's Encrypt allows 50 a week for afridea.et, previews included): then use `--limit 35` per week. Offline sites stay offline; taken-down sites only get the notice. Dashboards, QR
   codes and share links show the new address at once. Safe to run again: moved sites are skipped,
   failed ones are retried. A site that fails a check today (e.g. an example phone number left in)
   is listed with the reason; its owner fixes it and publishes.
5. **After 2026-12-19** (Vercel answers again), forward the old addresses to the new ones: the same
   command with `--forward-old` instead of `--dry-run` (needs `VERCEL_TOKEN`/`VERCEL_TEAM_ID`).

**Check:** `curl -sI https://<name>.afridea.et` shows `200` (the first visit to a site takes a few
seconds while its certificate is issued; only live sites can get one).
**Logs:** `sudo docker compose -f /opt/gojoline/deploy/server/compose.yml logs --tail 50 caddy`.
**Files:** the Docker volume `gojoline-sites` (never delete it; it is the live sites).
**Disk:** publishing stops by itself (owners see "try again later", Sentry gets
"publish refused: sites disk almost full") when less than 2 GB or 10% of the disk is free. Check
with `df -h /` and `sudo docker system df`; free space with `sudo docker system prune -f` or grow
the EC2 volume (EC2 → Volumes → Modify). Add an alert once: CloudWatch needs the agent for disk,
so the simple way is a daily look at `df -h /`, or a Sentry alert on that error message.
Not yet: owners' own domains (connect again after the move; see `docs/ROADMAP.md`).

## 8d. One certificate for all sites (recommended, free)

Without this, each site gets its own certificate on its first visit, and Let's Encrypt allows only
50 new ones a week for afridea.et (previews use them too). With it, one `*.afridea.et` certificate
covers every site.

1. Cloudflare → **My Profile → API Tokens → Create Token → Custom token**. Name `gojoline caddy dns`.
   Permissions: **Zone · DNS · Edit**. Zone resources: **Include · Specific zone · afridea.et**.
   Create, copy the token (no card needed).
2. `sudo nano /opt/gojoline/deploy/server/.env` and add `CLOUDFLARE_DNS_API_TOKEN=<the token>`.
   It is given only to Caddy, never to the app.
3. `sudo gojoline-update --force` (builds Caddy with the Cloudflare module, a few minutes once).
4. Check: `sudo docker compose -f /opt/gojoline/deploy/server/compose.yml logs caddy | grep -i "certificate obtained"`.
   To go back, empty the line and run step 3 again.

## 9. Stop automatically when the free credit ends

After the server exists: https://us-east-1.console.aws.amazon.com/costmanagement/home#/budgets/create

1. **Customize (advanced)** → **Cost budget** → Monthly, amount **$1**.
2. Leave **Credits** ticked in the charge types (the budget then shows $0 while credit lasts).
3. Alert at 100% to your email.
4. **Add action** at 100%: **Stop EC2 instances**, region `eu-central-1`, instance `gojoline`,
   let it create the role (`AWSBudgetsActionsWithAWSResourceControlAccess`), **Automatically run**.

Keep the "Zero spend budget" too: it emails you if real money is ever charged.

---

## Everyday

- **Updates:** nothing to do. A push to `main` is live within about 15 minutes (5 to check, ~10 to build).
  Every Sunday night it also rebuilds with fresh security patches. If a deploy fails, the old version
  keeps running and the next check tries again: `sudo journalctl -u gojoline-update --since today`.
- **Is it up?** `curl -s https://gojoline.afridea.et/api/health` prints `{"ok":true}`.
- **Logs:** `cd /opt/gojoline/deploy/server && sudo docker compose logs --tail 100 app`
- **Deploy now:** `sudo gojoline-update --force`
- **After changing a script in `deploy/server/`:** run `sudo bash /opt/gojoline/deploy/server/setup.sh` once to install it.
- **Site workspaces:** `sudo docker ps --filter label=gojoline.sandbox=1` (at most 2 run at once; idle ones stop after 15 minutes).
- **Runner logs:** `cd /opt/gojoline/deploy/server && sudo docker compose logs --tail 50 runner`
- **Restart:** `cd /opt/gojoline/deploy/server && sudo docker compose restart`

## When you leave this server (or it is no longer needed)

Otherwise it keeps using credit, and later your card:

1. EC2 → Instances → `gojoline` → **Instance state → Terminate**.
2. EC2 → **Elastic IPs** → select it → **Actions → Release**. (An address with no server still costs money.)
3. EC2 → **Volumes** and **Snapshots**: delete any left over.
4. GitHub → Deploy keys: delete `aws server`.

## Post videos (renderer)

`renderer` (deploy/server/renderer) films public pages into 1080×1920 videos for Admin → Posts.
It needs no setup: compose builds it, and it shares the runner's secret until `RENDERER_SECRET`
(24+ characters) is added to `.env`. It is reachable only from the app on the private network.
Social posts are sent by `gojoline-posts.timer` every 15 minutes (`/api/cron/posts`, `CRON_SECRET`).
