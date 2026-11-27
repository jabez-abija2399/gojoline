# Gojoline on an AWS server

One server runs Gojoline in Docker, with Caddy in front for HTTPS. It updates itself from GitHub
`main` every 5 minutes and runs the daily visits job. Why: `docs/DECISIONS.md` (2026-11-19).

Time: about 1 to 2 hours. Cost: about $1 a day of AWS credit (`t4g.medium`).

**Works:** everything, including building and changing sites with AI. Each site being worked on
runs in its own container on this server (no internet, capped memory), started by a small
"runner"; its live preview is at `https://gojo-<id>.preview.gojoline.afridea.et`.
**Publishing** needs the Cloudflare setup in `docs/ROADMAP.md` ("Blocked"); until then it says paused.

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
