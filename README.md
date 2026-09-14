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
assets/js/events.js   the animated name in the header
assets/docs/          CV lives here
assets/img/           project images live here
.nojekyll             tells Pages to serve files as-is, no Jekyll build
```

### The header animation

`events.js` samples the rendered name into a grid of points, scatters them, and
lets them converge — the way an event camera accumulates brightness changes into
an edge. Positive and negative polarity are the blue and red dots.

It is progressive enhancement: the plain `<h1>` is what the page ships with, and
the canvas only takes over once the script runs successfully. No JavaScript, an
old browser, or a thrown error all leave readable text behind. It also respects
`prefers-reduced-motion`, drawing the settled state with no animation.

### Colours

Defined once as custom properties at the top of `style.css`, with a dark-mode
block right underneath. Change them in those two places and the whole page follows.

## Before publishing work from a lab

Anything from the IPAL internship needs your supervisor's sign-off before it goes
online — results, figures, datasets, code, and the specific approach. The project
entry in `index.html` is deliberately written without numbers or images, and
carries a comment saying so. Clear it first, then add.
