# Site Issues TODO

Track issues found during the codebase audit. Tackle one at a time, check off as done.

---

## Bugs (broken behavior)

- [x] **1. Fix broken mailto/tel links** — [layouts/page/homepage.html:87-88](../layouts/page/homepage.html#L87-L88) sets `href="Email: ldwork.cs@gmail.com"` and `href="Phone: ..."`. Clicking does nothing. Change to `mailto:{{ .Params.email }}` and `tel:{{ .Params.phone }}`.
- [x] **2. Remove stray text inside `<script>`** — [layouts/page/project_detail.html:207](../layouts/page/project_detail.html#L207) has a bare `src="https://www.youtube.com/iframe_api"` line. Dead code that parses by accident; could mask a real bug later.
- [x] **3. Remove duplicate `<title>` tags** — both [homepage.html:3](../layouts/page/homepage.html#L3) and [project_detail.html:1](../layouts/page/project_detail.html#L1) have a `<title>` outside `<head>` plus another inside. One is hardcoded `"Ldwork Game Dev"`, the other uses `{{ .Title }}`. Keep one, inside `<head>`.
- [x] **4. Move `<title>` inside `<head>`** — same files: `<title>` appears before `<head>`. Invalid HTML.
- [x] **5. Add proper HTML skeleton to `project_detail.html`** — no `<!DOCTYPE html>`, `<html>`, or `<body>`. Renders in quirks mode.
- [ ] **6. Normalize tag casing** — [homepage.html:111-112](../layouts/page/homepage.html#L111-L112) lowercases for matching, but `hugo.toml` has inconsistent casing across projects (`Unreal Engine` vs `UnrealEngine` shows up in `public/tags/`). Pick one canonical form.
- [x] **7. Validate `?id=N` on detail page** — [project_detail.html:214-215](../layouts/page/project_detail.html#L214-L215): bad/missing `?id=` throws `Cannot read properties of undefined`. Add fallback or redirect to `/`.

## Wasted/dead files

- [x] **8. Delete empty stub** [layouts/index.html](../layouts/index.html) — never used (homepage uses `layout: "homepage"`).
- [x] **9. Audit default layouts** — Deleted `_default/single.html` (unused). Kept `_default/terms.html` (renders `/tags/`, `/categories/`) and `taxonomy/list.html` (renders individual term pages like `/tags/unity/`).
- [x] **10. Delete commented-out dead grid markup** in [homepage.html:53-65](../layouts/page/homepage.html#L53-L65).
- [x] **11. Delete commented-out projects data** in [content/_index.md:12-43](../content/_index.md#L12-L43) — superseded by `hugo.toml`.
- [x] **12. Replace placeholder text files** — [assets/temp-assets.txt](../assets/temp-assets.txt), [data/temp-data.txt](../data/temp-data.txt), [i18n/temp-i8n.txt](../i18n/temp-i8n.txt). Replaced with `.gitkeep`.
- [x] **13. ~~Remove `[outputs] section = []`~~** — Kept. Turns out it's load-bearing: it suppresses the unwanted `content/page/` section list page (which has no template by design). Added a comment in `hugo.toml` explaining why.
- [x] **14. Gitignore `tools/output.txt`** — one-off generated artifact from the xlsx converter.

## Deploy / repo hygiene

- [x] **15. ~~Add GitHub Actions workflow~~** — Abandoned. Account billing is locked, so Actions can't run. Replaced with `tools/deploy.ps1` that builds locally and pushes to the `deploy` branch (the pre-existing deploy model). Revisit if/when billing is unlocked.
- [x] **16. ~~Stop committing `public/`~~** — Skipped. Keeping `public/` tracked since we're back on the manual deploy-branch model.
- [x] **17. Gitignore `.hugo_build.lock`** — Hugo build lockfile shouldn't be tracked.
- [x] **18. Add `README.md`** — one-liner with the local dev command (`hugo server`).

## Code quality / maintainability

- [ ] **19. Restructure project data** — [hugo.toml](../hugo.toml) has projects as one giant inline array with `"0#..."`/`"1#..."`/`"2#..."`/`"3#..."` magic-number prefixes. Move each project to its own content file or a `data/projects.yaml`, and use a `type:` field.
- [ ] **20. Extract inline `<script>` to static files** — large JS block in [project_detail.html:39-271](../layouts/page/project_detail.html#L39-L271). Easier to lint and cache.
- [ ] **21. Extract shared CSS** — ~50 lines duplicated between [homepage.css](../static/css/homepage.css) and [project_detail.css](../static/css/project_detail.css) (`title-social-container`, `clickable-title`, `#scroll-to-top`). Make `_common.css`.
- [ ] **22. Drop unused font imports** — both CSS files `@import` Montserrat + Poppins; Montserrat is never used. Share Poppins.
- [ ] **23. Replace inline `onclick` handlers** with `addEventListener`. Enables CSP later.
- [ ] **24. Improve `alt` text** on profile/project images.
- [x] **25. Make homepage title click consistent** — `reloadPage()` reloads instead of routing to `/`. Detail page does it correctly.
- [ ] **26. Harden text-list parser** — [project_detail.html](../layouts/page/project_detail.html) `displayTextContent` uses `\n-` as a list marker. Items without `- ` prefix silently disappear.
- [x] **27. Fix misleading IntersectionObserver comment** — [project_detail.html:76](../layouts/page/project_detail.html#L76) says "Pause when 90% out of view" but `threshold: 0.1` means it pauses when more than 90% is out. Behavior likely fine; comment is wrong.
- [x] **28. Lowercase frontmatter keys** — [content/page/project.md](../content/page/project.md) uses `Title`/`Subtitle`. Non-idiomatic for Hugo.

## SEO / polish

- [ ] **29. Add meta tags** — `<meta name="description">`, Open Graph tags, favicon size variants. Important for portfolio links shared with recruiters.
- [ ] **30. Configure sitemap / robots.txt** — verify Hugo's default sitemap covers everything that should be indexed.
- [ ] **31. Make project pages crawlable** — `?id=N` JS-rendered detail pages aren't indexed by search engines. Generate one Hugo page per project instead.

---

## Suggested order

Highest leverage / quickest wins first:

1. #1 (broken contact links) — 5 min, user-facing bug
2. #15, #16, #17 (deploy workflow + gitignore) — unlocks cleaner workflow for everything below
3. #3, #4, #5 (HTML structure) — quick correctness fixes
4. #2, #7 (script bugs) — quick correctness fixes
5. #19 (project data restructure) — biggest refactor, unblocks #31
6. #31 (crawlable project pages) — depends on #19
7. Everything else as polish
