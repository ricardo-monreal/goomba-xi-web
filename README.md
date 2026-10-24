# Goomba XI — website

The Goomba XI website: accounts, character pages, community tools, server information, and the sign-in API used by the Goomba XI launcher. Built with Next.js 16 and React 19, reading the game's MariaDB database directly.

It runs on the same machine as the game server. [`goomba-xi-server`](https://github.com/ricardo-monreal/goomba-xi-server) installs, builds and updates it (`sudo goomba install`, then `sudo goomba web-update`), so you normally never run the commands below on the server by hand.

## What's on it

| Section | Pages |
| --- | --- |
| Home | Hero with Windows / Linux downloads, news, live Vana'diel clock, players online |
| Blog | Markdown posts from `content/blog` |
| About | Getting Started, Overview, Rules, Approved Addons (all 469 entries, searchable, filter by program), FAQ, Privacy |
| Account | Register, log in, forgot / reset password, change password and e-mail, your characters |
| Characters | Search by name, nation, online. Character page: jobs, experience totals, Maat progress, crafts, missions, fame, equipment. Owners also get Inventory, Auctions, Delivery, Bazaar and privacy Settings tabs |
| Tools | Linkshells (with pages the holder can edit), Yells (live), Bazaar search, Item Browser (stats, AH history, sellers), Dressing Room (gear planner with stat totals and presets), World Info (time, moon, week, weather forecast by zone, ferries and airships live, daily guild points, conquest) |

## How accounts work

Website accounts **are** game accounts: registration writes to `xidb.accounts` with a bcrypt hash, the same way the login server does, so one username and password works everywhere. The login server's own account creation is turned off (`ACCOUNT_CREATION = false` in the server settings) so everyone signs up here and agrees to the rules.

The launcher never gives the game your password. It signs in through this site and, when you press Play, asks for a **launch token**: a single-use, 5-minute token stored (as a SHA-256) in `accounts_login_tokens`. xiloader sends it in place of the password and the login server deletes it on use. Upstream LandSandBoat doesn't know launch tokens; the server repository adds them with a small source patch (`patches/0001-launch-token-login.patch`, ported from the Phoenix fork), so the Phoenix xiloader the launcher ships works unchanged.

### Launcher API

All JSON. Launcher calls carry `Authorization: Bearer <session token>`.

| Method and path | Body / result |
| --- | --- |
| `POST /api/launcher/login` | `{ username, password, device? }` → `{ ok, token, account }` (a 90-day launcher session) |
| `GET /api/launcher/me` | → `{ ok, account, online, characters: [{ name, race, nation, rank, job, level, subJob, subLevel, zone, online }] }` |
| `POST /api/launcher/launch-token` | → `{ ok, username, loginToken, expiresInSeconds }` |
| `POST /api/launcher/logout` | ends the launcher session |
| `GET /api/status` | → `{ ok, name, online }` (no sign-in needed) |

Errors are `{ ok: false, error }` with a 4xx status; 401 means "sign in again".

## Configuration

Environment variables (on the server: `/etc/goomba/web.env`, written by `goomba install`; locally: copy `.env.example` to `.env.local`):

| Variable | Meaning |
| --- | --- |
| `SITE_URL` | Public URL: `http://<server LAN IP>` on a home network, `https://<domain>` with a domain. Secure cookies follow the protocol each request uses. |
| `FILES_URL` | File server base URL. Launcher downloads come from `<FILES_URL>/launcher/`, item icons from `<FILES_URL>/icons/items/`. |
| `GAME_DB_HOST`, `GAME_DB_PORT`, `GAME_DB_USER`, `GAME_DB_PASSWORD` | MariaDB login (the `goomba_web` user). |
| `GAME_DB_NAME` | Game database, default `xidb`. |
| `WEB_DB_NAME` | The site's own database, default `goomba_web`. |
| `SESSION_SECRET` | Required; long random string. |
| `SMTP_URL`, `MAIL_FROM` | Outgoing mail for password resets, e.g. `smtps://user:pass@smtp.example.com:465`. Without it, reset links are written to the log (`goomba logs web`). |
| `DISCORD_URL`, `YOUTUBE_URL`, `X_URL`, `WIKI_URL` | Optional links in the header and footer. |

The `goomba_web` MariaDB user needs: everything on `goomba_web`; `SELECT` on `xidb`; `INSERT, UPDATE, DELETE` on `xidb.accounts` and `xidb.accounts_login_tokens`. The server installer grants exactly that.

## Item names and icons

The game database only has internal item names (`onion_sword`). Real names, descriptions and icons come from the client's item DATs. Import them from the [Era-DATs](https://github.com/phoenixffxi/Era-DATs) (era-accurate text from the Phoenix project) once, and again whenever Era-DATs changes:

```bash
git clone https://github.com/phoenixffxi/Era-DATs /tmp/Era-DATs
set -a; source /etc/goomba/web.env; set +a
node scripts/import-items.mjs --era /tmp/Era-DATs --icons /tmp/item-icons
# Upload /tmp/item-icons/*.png to the file server as <FILES_URL>/icons/items/
```

That covers ~19,400 items. General items (crystals, materials, furnishings in `ROM/118/106`) aren't in Era-DATs because it doesn't change them; dump that DAT with [Kraken](https://github.com/Frankie-hz/Kraken) from a game install and add `--yaml 106.yml`. Until then those items show a tidied server name and a placeholder icon.

## Writing a blog post

Add `content/blog/<slug>.md`:

```markdown
---
title: Harvest Festival
date: 2026-10-25
summary: One line for the home page and the blog list.
---

Markdown body…
```

Commit, push, then `sudo goomba web-update`.

## Static data

`src/data/*.json` is generated by `npm run gen:data` (also part of `npm run build`):

- `approved-addons.json` from `src/data/approved-addons.txt`. Edit the text file to change the list.
- `experience.json`, `mods.json` (item stat names) and `transport.json` (ferry and airship schedules) from the LandSandBoat server's `data/` folder when `LSB_DIR` is set, e.g. `LSB_DIR=/opt/goomba/server npm run gen:data`. `goomba web-update` sets it, so the tables always match the running server. Otherwise the committed copies are used.

## Development

```bash
npm install
cp .env.example .env.local     # point it at a MariaDB with a LandSandBoat xidb
npm run migrate
npm run dev                    # http://localhost:3000
npm run typecheck
```

## License

GPL-3.0-or-later. FINAL FANTASY XI content and images © SQUARE ENIX CO., LTD.
