# Connecting Gojoline's social accounts (Admin → Posts)

Admin → Posts plans one post a day, makes videos, and sends approved posts by itself to each
network that is connected. Until a network is connected, use the post's **Posting kit** (copy the
text, download the picture or video). Everything below goes into `/opt/gojoline/deploy/server/.env`
on the server (never into the code); the app picks it up on the next deploy (or restart).

## 1. Telegram channel (5 minutes)

1. In Telegram, open your channel (for example `@gojoline`) → Administrators → **Add admin** →
   search `@gojoline_bot` → allow **Post messages**.
2. Set `TELEGRAM_CHANNEL_ID=@gojoline` (the channel's public name).
3. Optional: the Monday summary to you. Send any message to `@gojoline_bot`, then ask us for your
   chat id, and set `TELEGRAM_ADMIN_CHAT_ID=<that number>`.

## 2. Instagram on its own (about 20 minutes, no Facebook Page)

Gojoline takes either kind of Instagram token and works out which it is:

- **Unified login** (all Meta apps made since about late October 2026): a system-user token of
  your business portfolio. It never expires and posts through graph.facebook.com.
- **Instagram login** (older apps only): an Instagram token that lasts 60 days; Gojoline renews it
  by itself once it is a week old, at the start of a posting run.

Steps for a new app (Unified login):

1. In the Instagram app, make the account **Business** (or Creator): Settings → Account type and
   tools → Switch to professional account.
2. On business.facebook.com, open (or create) your **business portfolio** → Accounts → Instagram
   accounts → **Add** your Instagram. The Meta app must belong to the same portfolio (App settings →
   Basic → Business portfolio); otherwise the Unified login setup does not appear.
3. developers.facebook.com → your app → **App roles**: add the Instagram account as an
   **Instagram Tester** and accept the invite on instagram.com (Settings → Apps and websites →
   Tester invites).
4. Use case **Instagram API** → **API setup with Unified login** → create a configuration: access
   token **System-user access token**, business asset your **Instagram account**, permissions at
   least `instagram_basic` and `instagram_content_publish`. If a redirect URL is required, use
   `https://gojoline.afridea.et/`. Then **Generate access tokens** for the account.
5. Admin → Posts → Connections → Instagram: paste the token, press **Check and save**. Gojoline finds
   the account from the token's grants (Meta's `debug_token`) or the Page linked to it; if it can't,
   it asks for the **Instagram account ID** (business.facebook.com → Settings → Accounts → Instagram accounts).
   On the server instead: `INSTAGRAM_USER_ID` and `INSTAGRAM_TOKEN` (a token starting with `EAA` is
   used through graph.facebook.com and never renewed).

The app can stay in Development mode: it posts only to the portfolio's own account (Meta's App
Review is for apps that act for other people's accounts).

Instagram takes only posts with a picture or video (Reels for videos); text-only days go to the
other networks. Instagram fetches the media from a link that works for one hour.

## 2b. Facebook Page (optional, about 20 minutes)

1. Go to developers.facebook.com → **My Apps** → **Create app** → type **Business**.
2. Open **Graph API Explorer** (Tools menu). Choose your app, then **Get User Access Token** with
   `pages_show_list`, `pages_read_engagement` and `pages_manage_posts`.
3. Make the token long-lived: Tools → **Access Token Debugger** → paste it → **Extend Access Token**.
4. Run `me/accounts`. Copy your Page's `id` and its `access_token` (a Page token made from a
   long-lived user token does not expire) into Admin → Posts → Connections → Facebook, or set
   `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_TOKEN` on the server.

An Instagram account linked to the Page can still post through it (server setting
`INSTAGRAM_USER_ID` without `INSTAGRAM_TOKEN`); Instagram login above is simpler.

## 3. TikTok (Direct Post, plus drafts)

Two ways, both through TikTok's Content Posting API:

- **Direct Post** (Admin → Posts → Videos → **Post to TikTok**): TikTok's required screen. You see
  the account you post as, write the caption, choose who can watch (TikTok's own options, nothing
  chosen for you), turn on comments/duet/stitch if you want, disclose promotional content, see
  TikTok's consent line, and post. Until TikTok **audits** the app, the only audience it allows is
  **Only me**; after the audit, posts can be public.
- **Drafts**: approved posts go to the TikTok app's inbox by themselves; you finish them there.

Setup on developers.tiktok.com:

1. App details: name **Gojoline**, icon 1024×1024, category Business (or Others), description,
   Terms `https://gojoline.afridea.et/en/terms`, Privacy `https://gojoline.afridea.et/en/privacy`
   (it has a section on our social accounts), platform **Web**, website `https://gojoline.afridea.et`.
2. Products: **Login Kit** (redirect URI `https://gojoline.afridea.et/api/admin/tiktok/callback`)
   and **Content Posting API** with **Direct Post** on. Nothing else.
3. Scopes: `user.info.basic`, `video.upload`, `video.publish`.
4. **Sandbox** (for the review's demo video): create a sandbox, add your TikTok account as a target
   user, set the same redirect URI, products and scopes. Put the **sandbox** client key and secret in
   Admin → Posts → Connections → TikTok, press **Sign in with TikTok**, then record the demo.
5. Submit for review with the demo video and the explanation. After approval, replace the sandbox
   key and secret with the **production** ones and sign in with TikTok again.

Connected before 25 November? Sign in with TikTok again: direct posting needs the new
`video.publish` permission.

## 4. YouTube

Use the posting kit for now: upload the video as a Short from the YouTube app. (Uploads from an
API project stay private until Google audits the project.)

## Check

Admin → Posts lists each network as connected or not. "Post now" on a post shows each network's
result under the post (sent, or the network's reason).

## Short links for bios and posts

Use these instead of long tracking addresses (Admin → Sources lists them with their visits):
`/r/tg` Telegram channel · `/r/tgg` Telegram groups · `/r/ig` Instagram bio · `/r/tt` TikTok bio ·
`/r/fb` Facebook profile · `/r/yt` YouTube. Each lands on the home page with its utm tags.
