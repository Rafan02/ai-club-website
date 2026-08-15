# AI Club Website — Cantonment English School And College

A self-contained, dependency-free website for the school's AI Club: a
futuristic public-facing site plus a simple admin dashboard for managing
content. No build tools, no backend server, and no internet connection
required to run it — just plain HTML, CSS, and JavaScript.

## Files

```
index.html          The public website
admin.html           The admin dashboard (content management)
css/style.css        Public site design system + all sections
css/admin.css         Admin dashboard layout
js/data.js            Shared config, placeholder content, and the storage engine
js/particles.js        Hero neural-network background animation
js/main.js             Public site rendering + interactions
js/admin.js            Admin dashboard logic (add/edit/delete/publish)
```

## Running it

No installation needed. Two options:

1. **Double-click `index.html`** to open it directly in a browser. Everything
   works, including the admin dashboard at `admin.html`.
2. **Or serve it locally** (recommended while editing, since some browsers
   restrict local file access slightly): from this folder run
   `python3 -m http.server 8000` and open `http://localhost:8000`.

## Publishing it for real

Any static web host works, since there's no server-side code:

- **GitHub Pages** — push this folder to a repo and enable Pages.
- **Netlify / Vercel** — drag-and-drop the folder in their dashboard.
- **The school's own web hosting** — upload the files via FTP/cPanel exactly
  as they are.

There's nothing to "build" — just upload the files as-is.

## Live AI assistant (optional, uses your free Groq API key)

The "Ask the AI Club" widget has two layers:

1. **Built-in questions** (the buttons) — instant, free, work even with no
   internet-facing backend at all. Answered entirely by `js/main.js` using
   the site's own data.
2. **Type-your-own-question box** — sends the question to a Netlify serverless
   function (`netlify/functions/ask-ai.js`), which calls **Groq's free API**
   server-side and returns the answer. Your API key never touches the
   browser, and — since it's Groq's free tier — this costs nothing to run.

### Why this needs a server function (security)

Anything in `js/*.js` is fully visible to anyone who views the page source.
If the API key were in the browser code, anyone could copy it and use it
under your account (and exhaust your free-tier limits, or worse if it's
ever a paid key). The function keeps the key in Netlify's private
environment variables, where only Netlify's servers can read it.

### Files involved

```
netlify/functions/ask-ai.js   The serverless function (the only thing that talks to Groq)
netlify.toml                  Tells Netlify where functions live + gives a clean /api/ask-ai URL
```

### Keeping the key out of GitHub

- `.gitignore` (included) already excludes `.env` and `.env.local` — if you
  ever create a local `.env` file for testing, git won't track it.
- More importantly: **the real key never lives in a file in this project at
  all.** You set it directly in Netlify (via `netlify env:set` or the
  dashboard — see steps below), not in a committed file. So even if you
  forget about `.gitignore`, there's nothing to accidentally push.
- Never paste your real key into `netlify/functions/ask-ai.js` or any other
  file in this repo. The code only ever reads it from
  `process.env.GROQ_API_KEY` at runtime.

### Deploying with the live assistant — step by step

This needs Netlify CLI or a GitHub-connected deploy (drag-and-drop alone
doesn't reliably pick up serverless functions).

**Option A — Netlify CLI (fastest, no GitHub needed)**

1. Install Node.js if you don't have it (nodejs.org).
2. Open a terminal in the project folder and run:
   ```
   npm install -g netlify-cli
   netlify login
   netlify init
   ```
   Choose "Create & configure a new site" when prompted, and accept the
   defaults (publish directory `.`, functions directory
   `netlify/functions` — `netlify.toml` already sets these).
3. Add your Groq API key as a secret (never commit it to a file):
   ```
   netlify env:set GROQ_API_KEY gsk_your-real-key-here
   ```
4. Deploy:
   ```
   netlify deploy --prod
   ```
5. Netlify prints your live URL, e.g. `https://your-site-123.netlify.app`.
   Open `netlify/functions/ask-ai.js`, find `ALLOWED_ORIGINS`, and replace
   `"https://YOUR-SITE-NAME.netlify.app"` with your real URL. Redeploy
   (`netlify deploy --prod` again) so the function accepts requests from
   your actual site.

**Option B — GitHub + Netlify (better long-term, supports auto-deploy)**

1. Push this whole folder to a new GitHub repository. `.gitignore` already
   keeps `.env` files out — you won't be committing a key by accident.
2. Go to app.netlify.com → "Add new site" → "Import an existing project" →
   connect GitHub → pick the repo.
3. Build settings: leave the build command empty, publish directory `.`
   (netlify.toml already declares the functions directory).
4. Before or after the first deploy: Site settings → Environment variables →
   Add variable → key `GROQ_API_KEY`, value = your real key.
5. Deploy. Copy the live URL Netlify gives you.
6. Edit `ALLOWED_ORIGINS` in `netlify/functions/ask-ai.js` to your real URL,
   commit, and push — Netlify redeploys automatically.

### Where to get a free Groq API key

console.groq.com → API Keys → Create API Key. Groq's free tier is generous
for a club-sized site (no credit card required). Keep the key secret —
treat it like a password. If it ever leaks (e.g. accidentally committed to
a public repo), revoke it immediately from the same page and create a new
one.

### Security measures already built in

- **API key never reaches the browser** — lives only in Netlify's env vars,
  read via `process.env.GROQ_API_KEY` at request time.
- **CORS allowlist** — the function only accepts requests from your own
  site's origin, not from random other websites trying to piggyback on
  your key.
- **Basic rate limiting** — caps requests per IP address per minute at the
  function level, plus a client-side session cap (15 live questions per
  visit) so a runaway loop can't hammer your usage.
- **Input length capped** at 400 characters server-side.
- **System prompt keeps it on-topic** and instructs the model to ignore
  attempts to override its instructions (prompt injection) and to avoid
  inventing facts it wasn't given.
- **Graceful fallback** — if the live API is down, rate-limited, misconfigured,
  or the visitor hits the session cap, the widget automatically tries to
  answer from the same built-in FAQ logic instead of just failing.

### Cost

Groq's free tier is used here, so typed questions cost nothing under normal
club-sized traffic. Free tiers do have request-per-minute limits — if the
site gets a sudden burst of visitors, some requests may get a "the
assistant is a little busy" message and should just retry in a moment
(the built-in buttons still work instantly regardless). Check
console.groq.com for current free-tier limits if this ever matters.

### Upgrading rate limiting later

The current rate limit is a simple in-memory counter per function instance
— good enough to stop obvious abuse, but not perfectly accurate across
Netlify's distributed servers. If the club grows and this matters more, the
function can be upgraded to use **Netlify Blobs** (free, built into Netlify)
or a small **Upstash Redis** free tier to track request counts reliably
across all instances. That's a change confined entirely to
`netlify/functions/ask-ai.js` — nothing else needs to change.

## Managing content (for student admins)

Open **`admin.html`**. It's now protected by a password screen.

- **Default password:** `aiclub2026`
- **Change it immediately:** log in once, go to **Settings → Change Admin
  Password**, and set something the club officers will actually remember.
- This is a lightweight deterrent, not enterprise security — there's no
  backend to enforce it, so a technically determined person could still get
  around it by reading the page source. It's meant to stop casual visitors
  from stumbling onto `/admin.html` and editing things, not to protect
  sensitive data. Don't put anything truly sensitive behind it.
- The login only lasts for that browser tab's session (closing the tab logs
  you out). There's a **Log out** link in the sidebar too.
- For stronger protection before a public launch, Netlify's own site-wide
  password (Site settings → Visitor access, free tier) can lock the *entire*
  site — including the public pages — behind one shared password until
  you're ready to go live.

The sidebar has one section per content type: Events, Projects, News,
Achievements, Gallery, Team, Resources, FAQ, and Settings. Each section
works the same simple way:

1. Click **+ Add** to open a form.
2. Fill in the fields, optionally attach an image.
3. Click **Publish**.

Edits and deletes work the same way from the list. Changes appear on the
public site immediately (just refresh `index.html`).

### Important: where content is stored

This site has **no backend/database** — that was intentionally out of scope
for v1. Content added through the admin dashboard is saved in the browser's
own storage (`localStorage`) **on the device/browser that made the edit**.

What this means in practice:

- If you add an event on your laptop, it shows up on that laptop's browser
  immediately — including on the live published site, if you're editing
  the same files you deployed.
- It does **not** automatically sync to a different computer's browser.
  Only one admin's browser is really "the source of truth" at a time.
- Clearing browser data/cache on that device will erase the edits (the
  site will fall back to the original placeholder content).

**For a single club officer maintaining the site, this is simple and works
fine.** If the club later wants multiple admins editing from different
devices with everything staying in sync, the `Store` object in `js/data.js`
is written so its `getState`/`saveState`/`upsert`/`remove` functions are the
*only* place that touches storage — swapping `localStorage` for a real
backend (a small database + API, a headless CMS, or a service like
Firebase) later only requires changing that one file, not the rest of the
site.

### Images

Uploaded images are automatically resized and compressed in the browser
before saving, to keep things fast. Browser storage has a practical limit
(roughly 5–10MB total depending on the browser), which is enough for a solid
number of images, but if the dashboard ever warns that saving failed, it
likely means storage is full — consider linking to externally hosted images
for very large galleries in the future.

## One place to update once registration is ready

Go to **Admin → Settings → Join the Club** and paste the registration link
(a Google Form, sign-up sheet, etc.) once it exists. Until then, every
"Join the AI Club" button safely scrolls to the on-page Join section instead
of pointing anywhere broken.

Settings also holds social media links and contact info — all blank/generic
until filled in, by design (nothing was invented).

## What's placeholder vs. real

Everything shown initially — achievements, projects, events, news, gallery
photos, team members, and stats — is clearly-labeled **placeholder content**
so the site looks complete on day one. None of it is a real claim about the
club. Replace it section by section from the admin dashboard as real content
becomes available.

## Notes on scope

- **No student/member accounts or login yet** — intentionally left out of
  v1, per the brief. The `Store` data structure doesn't assume anything
  that would make adding this later harder.
- **No official logo yet** — the nav/footer use a temporary text+abstract
  mark (a gradient "AI" square) that's trivial to swap for a real logo file
  later (just replace the `.brand-mark` markup in `index.html`/`admin.html`
  with an `<img>` tag).
- **Colors are a temporary visual identity**, not official school branding.
