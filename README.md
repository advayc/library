# Library Room Booker

I wanted to book rooms for my local library but it was annoying to go through the whole page so I spent a few hours making a script to do it for me.

How it works
- The script uses Playwright to automate the library website UI.
- Run the CLI `booking.js` with a natural-language date/time (or let `server.js` trigger it). The script parses dates, signs in (using `.env` credentials), searches availability, and walks through reservation steps. It can run interactively or in fully automated headless mode; it will pause for manual login if CAPTCHA/MFA appears.

Deployment (Railway)
- The repo includes a `Dockerfile` and `railway.toml` so it can be deployed to Railway. Configure required env vars in the Railway dashboard (see `ENV` variables in the code comments), connect the repository, and deploy the service or scheduled job.

Notion calendar integration
- After a successful booking the code calls the Notion helper to add a calendar entry. Set `NOTION_TOKEN` and `NOTION_DATABASE_ID` in `.env` to enable this (see `notion/notion.js`).

Customization
- Copy `.env.example` to `.env` and fill credentials and IDs.
- Update any site-specific selectors in `booking.js` if the site layout changes.

Files
- `README.md`: this file — project summary and usage notes.
- `booking.js`: main CLI script that uses Playwright to log in, search rooms, present selection, and complete the reservation. It supports flags for headless, auto mode, and non-interactive runs, and it calls the Notion helper on success.
- `server.js`: minimal HTTP server that exposes `POST /book` and `GET /status/<jobId>`. It lets you trigger `booking.js` remotely (e.g., from a phone or webhook) and streams job logs. Protect with `API_TOKEN`.
- `package.json` / `package-lock.json`: Node dependencies and scripts used to install and run the project.
- `Dockerfile`: containerizes the app (Playwright + Node) for consistent deployments.
- `railway.toml`: Railway deployment configuration used by the Railway platform.
- `notion/`: helper code to create Notion calendar entries.
	- `notion/notion.js`: Notion API client and `addToNotionCalendar()` helper — requires `NOTION_TOKEN` and `NOTION_DATABASE_ID`.
	- `notion/notion-inspect.js` / `notion/notion-test.js`: helper/test scripts for inspecting or validating Notion integration.
- `playwright_profile/`: optional Playwright browser profile artifacts (local browser state, cookies, etc.) — can be used for manual login persistence.
view it working here: [demo.mov](demo.mov)
- `signature.png`: optional image used by the booking flow for signature uploads (if used).
- `.env.example` / `.env`: environment variable examples and local secrets (do not commit real secrets to git).
- `node_modules/`: installed packages (not committed in ideal workflows).

That's it — booking automation, optional Notion sync, and a Railway-friendly deploy setup.

