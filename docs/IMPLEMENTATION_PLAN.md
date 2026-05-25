# Implementation Plan — Site Issues Cleanup

Companion to [TODO.md](TODO.md). Sequences the 31 audit items into 8 phases that are each independently shippable.

## Context

The repo `LDWGameDev.github.io` is a Hugo-based personal portfolio site, currently live and working. A codebase audit produced [TODO.md](TODO.md) with **31 issues** spanning correctness bugs, dead code, deploy hygiene, refactors, and SEO gaps.

The goal of this plan is to sequence those 31 items into a sensible order of execution — grouping related changes into logical phases so each phase is independently shippable, reduces risk, and unblocks later work. The site is already in production, so we want low-risk fixes early and the riskier restructures (project data model, per-project pages) gated behind safe foundations (deploy workflow, gitignore).

We will **not** introduce new tooling beyond Hugo + GitHub Actions. No frameworks, no bundlers — match the existing vanilla stack.

---

## Phases

### Phase 1 — Quick correctness fixes (low-risk, high-value)

Tiny user-visible bugs and HTML correctness issues. Each is a few lines.

Items: **#1, #2, #3, #4, #5, #7, #25, #27, #28**

Files touched:
- [layouts/page/homepage.html](../layouts/page/homepage.html) — fix mailto/tel hrefs (#1); remove duplicate `<title>` (#3,#4); fix `reloadPage()` to route to `/` (#25)
- [layouts/page/project_detail.html](../layouts/page/project_detail.html) — remove stray `src=...` line (#2); add `<!DOCTYPE html>`/`<html>`/`<body>` skeleton (#5); guard against invalid `?id=N` (#7); fix misleading IntersectionObserver comment (#27)
- [content/page/project.md](../content/page/project.md) — lowercase `Title`/`Subtitle` frontmatter keys (#28); update template references accordingly

Verification: `hugo server`, click each project card, visit `/project/?id=999` to confirm graceful fallback, click email + phone links to confirm they open mail/dial.

---

### Phase 2 — Deploy workflow + repo hygiene

Get a real CI/CD pipeline so future changes don't require committing `public/`. Foundation for everything below.

Items: **#15, #17, #14, #18**

Steps:
1. Create `.gitignore` with `public/`, `.hugo_build.lock`, `tools/output.txt`, `resources/`, `.DS_Store` (#14, #17 — but do NOT remove `public/` from tracking yet, that's #16 in Phase 3).
2. Create `.github/workflows/hugo.yml` using the official Hugo Pages workflow from https://gohugo.io/host-and-deploy/host-on-github-pages/ (#15).
3. Add minimal [README.md](../README.md) with `hugo server -D` dev command and link to the deployed site (#18).
4. Manually flip the repo's **Settings → Pages → Source** to **GitHub Actions** (user action — note this in README).

Verification: push to a branch, watch Actions tab build green, manually trigger workflow on `main`, confirm live site updates.

---

### Phase 3 — Stop committing build artifacts

Now that the workflow is proven, untrack `public/`.

Items: **#16**

Steps:
1. `git rm -r --cached public/` (already in `.gitignore` from Phase 2).
2. Commit removal as a single dedicated commit.

Verification: live site still serves after the deletion commit deploys via the workflow.

---

### Phase 4 — Dead code cleanup

Remove unused files and commented-out blocks. Pure deletion, no behavior change.

Items: **#8, #9, #10, #11, #12, #13**

Files touched:
- Delete [layouts/index.html](../layouts/index.html) stub (#8)
- Audit [layouts/_default/single.html](../layouts/_default/single.html), [layouts/_default/terms.html](../layouts/_default/terms.html), [layouts/taxonomy/list.html](../layouts/taxonomy/list.html) — delete what's unreached after Hugo build (#9). `terms.html` likely powers `/tags/`, keep if so.
- [layouts/page/homepage.html:53-65](../layouts/page/homepage.html#L53-L65) — delete commented grid markup (#10)
- [content/_index.md:12-43](../content/_index.md#L12-L43) — delete commented projects data (#11)
- Replace temp text files with `.gitkeep` in `assets/`, `data/`, `i18n/` (#12)
- [hugo.toml:14-15](../hugo.toml#L14-L15) — remove `[outputs] section = []` (#13)

Verification: `hugo --minify` builds clean; diff `public/` against pre-cleanup build — should be byte-identical for live pages.

---

### Phase 5 — CSS/JS refactor

Reduce duplication, modernize handler patterns. No behavior change, just cleanup.

Items: **#20, #21, #22, #23, #24**

Steps:
1. Extract shared CSS (`title-social-container`, `clickable-title`, `#scroll-to-top`, fonts) from [homepage.css](../static/css/homepage.css) + [project_detail.css](../static/css/project_detail.css) into `static/css/_common.css` (#21).
2. Drop Montserrat `@import` lines (unused) (#22).
3. Move the large `<script>` block in [project_detail.html:39-271](../layouts/page/project_detail.html#L39-L271) into `static/js/project_detail.js`; similarly move homepage's `<script>` into `static/js/homepage.js` (#20).
4. Replace inline `onclick="..."` with `data-action` attributes + `addEventListener` listeners in the new JS files (#23).
5. Add descriptive `alt` text — profile picture "LDW logo", project images already use project name (#24).

Verification: visit every page, click every interactive element (title, social icons, tag buttons, project cards, scroll-to-top, contact links), confirm identical behavior. DevTools: no console errors, no 404s on new JS/CSS paths.

---

### Phase 6 — Project data model overhaul

The big refactor. Replace the `"<type>#<value>"` magic-prefix format with structured data. Unblocks Phase 7.

Items: **#19, #6, #26**

Approach:
1. Create `data/projects.yaml` with one entry per project. Each entry has structured `content:` as a list of `{type: text|image|gif|video, value: "..."}` objects (replacing `"0#..."` / `"1#..."` / `"2#..."` / `"3#..."`) (#19).
2. Normalize tag casing in the data file — pick canonical forms (`Unity`, `Unreal Engine`, `Personal`, `Work`, `Prototype`); update both project tags and the homepage filter list (#6).
3. Update [layouts/page/homepage.html](../layouts/page/homepage.html) to range over `site.Data.projects` instead of `site.Params.projects`.
4. Update [layouts/page/project_detail.html](../layouts/page/project_detail.html) JS to read the new schema. Replace the `value.split(/#(.+)/)` parser with `item.type` switch (#19, #26 — list parser becomes a proper structured `lines: [...]` field instead of `\n-` magic).
5. Delete the `projects = [...]` block from [hugo.toml](../hugo.toml).
6. Update [tools/convert_projects_xlsx_to_txt.py](../tools/convert_projects_xlsx_to_txt.py) to emit YAML in the new schema (or note in README that it's deprecated).

Mid-phase pause: after step 3 (homepage rendering from YAML), verify before continuing to step 4 (detail page). Otherwise both pages can break at once.

Verification: visit homepage, every project card renders. Click each, every content type (text, list, image, gif, YouTube video) renders identically to before. Compare side-by-side against current production.

---

### Phase 7 — Crawlable per-project pages

With structured data in place, generate one Hugo page per project so search engines can index them.

Items: **#31**

Approach:
1. Convert each `data/projects.yaml` entry into a content file under `content/projects/<slug>/index.md` (preferred: simpler than a content adapter, can colocate images per project).
2. New route: `/projects/<slug>/` replaces `/project/?id=N`.
3. Keep `/project/?id=N` as a redirect (301) to the new slug-based URL — preserves any existing inbound links.
4. Update homepage card links from `navigateToProject(index)` to direct `<a href="/projects/{{ .slug }}/">`.

Verification: every project URL works directly without JS; view-source shows full content for SEO; old `/project/?id=N` URLs redirect.

---

### Phase 8 — SEO / polish

Final coat of paint.

Items: **#29, #30**

Steps:
1. Add a `layouts/partials/head.html` with `<meta name="description">`, OG tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`), Twitter card tags. Include from both layouts.
2. Add `static/images/og-card.png` (1200×630) — placeholder if no design exists yet.
3. Add favicon size variants (16, 32, 180 apple-touch).
4. Verify `public/sitemap.xml` includes all per-project pages after Phase 7 (#30). Hugo generates this automatically once pages exist.
5. Add `static/robots.txt` allowing all.

Verification: Lighthouse SEO score ≥ 95; OG preview validators (e.g. opengraph.xyz) render correctly.

---

## Critical files (cross-phase)

- [hugo.toml](../hugo.toml) — Phase 4 (#13), Phase 6 (#19)
- [content/_index.md](../content/_index.md) — Phase 4 (#11)
- [content/page/project.md](../content/page/project.md) — Phase 1 (#28), removed in Phase 7
- [layouts/page/homepage.html](../layouts/page/homepage.html) — Phases 1, 4, 5, 6, 7
- [layouts/page/project_detail.html](../layouts/page/project_detail.html) — Phases 1, 5, 6, 7
- [static/css/homepage.css](../static/css/homepage.css), [static/css/project_detail.css](../static/css/project_detail.css) — Phase 5
- `.github/workflows/hugo.yml` — created in Phase 2
- `.gitignore` — created in Phase 2
- `data/projects.yaml` — created in Phase 6
- `content/projects/<slug>/index.md` — created in Phase 7

---

## Dependencies

```
Phase 1 ──┐
Phase 2 ──┼──> Phase 3 ──> Phase 4 ──> Phase 5 ──┐
          │                                       ├──> Phase 6 ──> Phase 7 ──> Phase 8
          └─────────────────────────────────────  ┘
```

- Phase 2 must happen before Phase 3 (workflow must work before we untrack `public/`).
- Phase 6 must happen before Phase 7 (per-project pages need structured data).
- Phase 7 must happen before Phase 8's sitemap verification.
- Phase 1, 4, 5 are independent and can interleave.

---

## Working style

- **One commit per phase** (or per logical sub-group within a phase).
- After each phase, check off the corresponding items in [TODO.md](TODO.md).
- Verify at the end of each phase before moving to the next.
- For Phase 6, pause mid-phase to verify (see note above).

---

## End-to-end verification (after all phases)

1. Run `hugo --minify`, confirm zero warnings.
2. Live site loads, all project cards visible, filters work, all detail pages render with all content types.
3. View-source on a project page shows full content (not just JS scaffolding).
4. Lighthouse: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90.
5. GitHub Actions workflow green on `main`, deploys without manual `public/` commits.
