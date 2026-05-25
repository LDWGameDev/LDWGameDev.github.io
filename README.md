# LDWGameDev.github.io

Personal portfolio site for Do Duy Long (LDWork), Unreal Engine gameplay developer. Live at <https://ldwgamedev.github.io/>.

Built with [Hugo](https://gohugo.io/) — vanilla HTML/CSS/JS, no frameworks.

## Local development

```sh
hugo server -D
```

Then open <http://localhost:1313/>.

## Deployment

GitHub Pages serves from the `deploy` branch (Settings → Pages → Source = "Deploy from a branch", branch = `deploy`, path = `/`).

To publish changes:

```powershell
.\tools\deploy.ps1
```

The script builds the site with Hugo, then pushes the contents of `public/` to the `deploy` branch. Pages picks up the update within ~1 minute.

The `public/` folder is also tracked on `main` for historical reasons; it's regenerated on every deploy so its contents on `main` may lag behind production until you commit a fresh build.

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
