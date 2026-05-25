# LDWGameDev.github.io

Personal portfolio site for Do Duy Long (LDWork), Unreal Engine gameplay developer. Live at <https://ldwgamedev.github.io/>.

Built with [Hugo](https://gohugo.io/) — vanilla HTML/CSS/JS, no frameworks.

## Local development

```sh
hugo server -D
```

Then open <http://localhost:1313/>.

## Deployment

Pushes to `main` trigger [.github/workflows/hugo.yml](.github/workflows/hugo.yml), which builds with Hugo extended `0.143.0` and publishes to GitHub Pages.

**One-time setup** (already done on this repo): in **Settings → Pages → Source**, select **GitHub Actions**.

## Repo layout

```
content/        site content (Markdown + frontmatter)
layouts/        Hugo templates
static/         static assets (CSS, JS, images) — copied verbatim into the build
data/           structured data consumed by templates
hugo.toml       site config + project list
tools/          ad-hoc scripts (xlsx → project data)
docs/           internal notes (TODO, implementation plan)
```

`public/` is the Hugo build output. It is **not** committed — the GitHub Actions workflow regenerates it on every deploy.
