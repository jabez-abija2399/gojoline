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
   **Instagram Tester** and accept the invite in the Instagram app.
4. Use case **Instagram API** → **API setup with Unified login** → create a configuration: access
   token **System-user access token**, business asset your **Instagram account**, permissions at
   least `instagram_basic` and `instagram_content_publish`. If a redirect URL is required, use
   `https://gojoline.afridea.et/`. Then **Generate access tokens** for the account.
5. Admin → Posts → Connections → Instagram: paste the token, press **Check and save**. Gojoline finds
   the account from the token's grants (Meta's `debug_token`) or the Page linked to it; if it can't,
   it asks for the **Instagram account ID** (Business settings → Accounts → Instagram accounts).
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

## 3. TikTok (about 15 minutes, plus TikTok's app review)

1. Go to developers.tiktok.com → **Manage apps** → **Connect an app**. Add the products **Login Kit**
   and **Content Posting API**, with the scopes `user.info.basic` and `video.upload`.
2. Redirect URI: `https://gojoline.afridea.et/api/admin/tiktok/callback`.
3. Set `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` from the app's page.
4. In Admin → Posts, press **Connect TikTok** and sign in with Gojoline's TikTok account once.

Videos then arrive in that account's TikTok **inbox** as drafts (TikTok allows direct public
posting only after it audits the app): open TikTok, add a sound if you like, and post.

## 4. YouTube

Use the posting kit for now: upload the video as a Short from the YouTube app. (Uploads from an
API project stay private until Google audits the project.)

## Check

Admin → Posts lists each network as connected or not. "Post now" on a post shows each network's
result under the post (sent, or the network's reason).
