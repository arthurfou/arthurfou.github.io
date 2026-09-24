# Personal site

Static personal site, hosted on GitHub Pages. No build step, no dependencies —
open `index.html` in a browser and what you see is what ships.

## Before the first deploy

Search the repo for these and replace them:

| Placeholder | Where | Replace with |
| --- | --- | --- |
| `GITHUB_USERNAME` | `index.html` (canonical, og:url, GitHub link, project links) | your GitHub username |
| `YOUR-LINKEDIN-SLUG` | `index.html` | the slug in your LinkedIn URL |
| `REPO-NAME` | `index.html`, twice | the repos behind those two projects |

Then add the files the page expects:

- `assets/docs/cv.pdf` — the CV the "CV (PDF)" link points at. Keep the filename
  stable so the link never rots, and re-upload over it when the CV changes.
- `assets/img/` — project stills or short loops. A GIF or an MP4 loop under ~3 MB
  is plenty; anything heavier will make the page feel slow on mobile.

One quick check: run `grep -rn "GITHUB_USERNAME\|YOUR-LINKEDIN-SLUG\|REPO-NAME" .`
and make sure it comes back empty before you push.

## Deploying

The repo must be named `<your-username>.github.io` and be public. Push to `main`
and GitHub Pages redeploys on its own; the first build can take up to ten minutes.

```bash
git add .
git commit -m "Update site"
git push
```

To preview locally, any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening the file directly with `file://` also works, but a server matches
production more closely.

## What is here

```
index.html            the whole site, one page
404.html              not-found page
assets/css/style.css  all styling
assets/js/events.js   the event-camera animation in the header
assets/js/nav.js      highlights the current section in the floating nav
assets/docs/          CV lives here
assets/img/           portrait, IPAL figure, project media (keep each under ~1 MB)
.nojekyll             tells Pages to serve files as-is, no Jekyll build
```

### The header animation

The header is a small simulated event camera. `events.js` moves a few bright
discs across a dark canvas; wherever an edge moves, it fires events — positive
(blue) on the leading edge, negative (red) on the trailing one. The visitor's
cursor is one more moving edge. It pauses when the header is off screen or the
tab is hidden.

It is decoration only: the name is a plain `<h1>`, so no JavaScript, an old
browser or a thrown error leave a dark band with the name on it. It respects
`prefers-reduced-motion` by drawing one frozen frame.

### Colours

Defined once as custom properties at the top of `style.css`, with a dark-mode
block right underneath. Everything derives from event polarity: `--pos` (blue),
`--neg` (red), and the five `--g1`…`--g5` steps between them used on the
hairlines, buttons and panels. The header and footer use the dark `--ev-*` palette; inside `.hero` the page
tokens are remapped to it, so the same buttons and portrait work on both. The
name's gradient is written directly on `.name`, since it always sits on the
dark header.

Fonts: Silkscreen (the pixel name), Geist (text), Geist Mono (labels, dates).

## Before publishing work from a lab

Anything from the IPAL internship needs your supervisor's sign-off before it goes
online — results, figures, datasets, code, and the specific approach. The project
entry in `index.html` is deliberately written without numbers or images, and
carries a comment saying so. Clear it first, then add.
