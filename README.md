# Data Science Portfolio

Source for my personal portfolio site: **[mam084.github.io/portfolio](https://mam084.github.io/portfolio/)**

I'm a data scientist with an M.S. in Data Science from UC San Diego. The site collects my machine learning, analytics, and visualization projects, along with my resume.

## Pages

| Page | What's there |
|---|---|
| [Home](https://mam084.github.io/portfolio/) | Short intro and featured projects |
| [Projects](https://mam084.github.io/portfolio/projects/) | Every project, with search and a by-year breakdown |
| [Resume](https://mam084.github.io/portfolio/CV/) | Experience, skills, and education |

## How it works

A static site with no build step, served by GitHub Pages.

- `lib/projects.json` is the single source of truth for project cards. Both the home page and the projects page render from it, so adding a project means adding one entry there.
- `global.js` builds the shared navigation, the light/dark theme switcher, and the project-card renderer.
- `projects/projects.js` adds search and a D3 breakdown of projects by year.
- `meta/` is a small code-statistics page built with D3 from `meta/loc.csv`.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

`global.js` detects `localhost` and adjusts its base path, so links work the same locally and on GitHub Pages.
