# Gojoline on an AWS server

One server runs Gojoline in Docker, with Caddy in front for HTTPS. It updates itself from GitHub
`main` every 5 minutes and runs the daily visits job. Why: `docs/DECISIONS.md` (2026-11-19).

Time: about 1 to 2 hours. Cost: about $1 a day of AWS credit (`t4g.medium`).

**Works right away:** sign-in, dashboards, messages, visits, payments, admin, all public pages.
**Not yet:** building and changing sites with AI. That still uses Vercel Sandbox, which is paused
with the Vercel team, until builds move to this server (next slice).

---

## 1. Create the server (AWS console)

Open EC2 in Frankfurt: https://eu-central-1.console.aws.amazon.com/ec2/home?region=eu-central-1#LaunchInstances:

| Setting | Choose |
|---|---|
| Name | `gojoline` |
| Image (AMI) | **Ubuntu Server 24.04 LTS**, architecture **64-bit (Arm)** |
| Instance type | **t4g.medium** (2 vCPU, 4 GB) |
| Key pair | "Proceed without a key pair" is fine: you connect from the browser (step 3) |
| Network settings | Tick **Allow SSH traffic** from **Anywhere** (the browser terminal in step 3 connects from AWS's own addresses; login is by temporary key only, never a password), and tick **Allow HTTPS** and **Allow HTTP** from the internet |
| Storage | **30 GB gp3** |

Click **Launch instance**.

## 2. Give it a fixed address (Elastic IP)

EC2 → **Elastic IPs** → **Allocate Elastic IP address** → Allocate. Then **Actions → Associate**
→ choose the `gojoline` instance → Associate. Write the address down (e.g. `3.120.45.67`).

## 3. Open a terminal on the server

EC2 → Instances → select `gojoline` → **Connect** → **EC2 Instance Connect** → **Connect**.
A black terminal opens in the browser. Paste each command below and press Enter.

## 4. Let the server read the code (read-only)

```bash
sudo mkdir -p /root/.ssh && sudo ssh-keygen -q -t ed25519 -N "" -C gojoline-server -f /root/.ssh/id_ed25519 && sudo cat /root/.ssh/id_ed25519.pub
```

Copy the line it prints (starts with `ssh-ed25519`). On GitHub: the `gojoline` repo →
**Settings → Deploy keys → Add deploy key**. Title `aws server`, paste the key, leave
**Allow write access unticked**, Add key. Then:

```bash
sudo GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new" git clone --branch main git@github.com:jabez-abija2399/gojoline.git /opt/gojoline
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
never set. Save: **Ctrl+O**, Enter, **Ctrl+X**. Never paste these values into a chat.

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
- **Is it up?** `curl -s https://gojoline.afridea.et/api/health` prints `{"ok":true}`.
- **Logs:** `cd /opt/gojoline/deploy/server && sudo docker compose logs --tail 100 app`
- **Deploy now:** `sudo bash /opt/gojoline/deploy/server/update.sh --force`
- **Restart:** `cd /opt/gojoline/deploy/server && sudo docker compose restart`

## When you leave this server (or it is no longer needed)

Otherwise it keeps using credit, and later your card:

1. EC2 → Instances → `gojoline` → **Instance state → Terminate**.
2. EC2 → **Elastic IPs** → select it → **Actions → Release**. (An address with no server still costs money.)
3. EC2 → **Volumes** and **Snapshots**: delete any left over.
4. GitHub → Deploy keys: delete `aws server`.
