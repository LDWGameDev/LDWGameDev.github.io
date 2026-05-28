// Project timeline behavior:
// 1. Parse each node's data-time -> release year (use the last 4-digit year in the string,
//    so "2022 - 2025" -> 2025 and "2020" -> 2020).
// 2. Window = [minYear .. maxYear]; place each dot at its year's x-percent.
// 3. Group projects by release year. First project of a year = LEFT side; second = RIGHT.
//    Two projects sharing a year stack vertically in the same column.
// 4. Click a dot or pill -> show the detail card anchored under the active node (centered
//    on its x-percent). Click outside / Escape closes it.
// 5. On mobile (<=700px) the plot is hidden by CSS; a vertical card list takes over.

(function () {
    const root = document.getElementById("project-tl");
    if (!root) return;

    const plot = document.getElementById("ptl-plot");
    const axis = document.getElementById("ptl-axis");
    const panelWrap = document.getElementById("ptl-panel-wrap");
    const panel = document.getElementById("ptl-panel");
    const nodes = Array.from(plot.querySelectorAll(".ptl-node"));
    if (nodes.length === 0) return;

    function parseReleaseYear(time) {
        if (!time) return null;
        const matches = String(time).match(/\d{4}/g);
        if (!matches || matches.length === 0) return null;
        return parseInt(matches[matches.length - 1], 10);
    }

    // Annotate each node with its release year and original index.
    const entries = nodes.map((node, idx) => ({
        node,
        idx,
        year: parseReleaseYear(node.dataset.time),
    })).filter((e) => e.year !== null);

    if (entries.length === 0) return;

    const minYear = entries.reduce((m, e) => Math.min(m, e.year), Infinity);
    const maxYear = entries.reduce((m, e) => Math.max(m, e.year), -Infinity);
    // Avoid divide-by-zero if every project is the same year.
    const span = Math.max(1, maxYear - minYear);

    function xPct(year) {
        return ((year - minYear) / span) * 100;
    }

    // Group by year (in file order) so we know who is the 1st vs 2nd in a year.
    const byYear = new Map();
    entries.forEach((e) => {
        if (!byYear.has(e.year)) byYear.set(e.year, []);
        byYear.get(e.year).push(e);
    });

    // Stack offsets when two share a year. Plot is 200px tall; center = 50%.
    const STACK_TOP = "28%";
    const STACK_BOTTOM = "72%";

    const plotHeight = plot.clientHeight;

    byYear.forEach((group) => {
        group.forEach((e, i) => {
            const x = xPct(e.year);
            e.node.style.left = x + "%";

            // Side: 1st in year = LEFT, 2nd = RIGHT.
            e.node.classList.add(i === 0 ? "side-left" : "side-right");

            // Vertical position: single = center, stacked = split.
            let topPct;
            if (group.length === 1) {
                topPct = 50;
            } else {
                topPct = i === 0 ? 28 : 72;
            }
            e.node.style.top = topPct + "%";

            // Projection line: from dot center down to the axis at the plot's bottom.
            const proj = e.node.querySelector(".ptl-projection");
            if (proj) {
                const dotY = (topPct / 100) * plotHeight;
                proj.style.height = (plotHeight - dotY) + "px";
            }
        });
    });

    root.classList.add("is-positioned");

    // Axis ticks: one per year in the window.
    for (let y = minYear; y <= maxYear; y++) {
        const tick = document.createElement("span");
        tick.className = "ptl-tick";
        tick.style.left = xPct(y) + "%";
        const label = document.createElement("span");
        label.className = "ptl-tick-label";
        label.textContent = y;
        tick.appendChild(label);
        axis.appendChild(tick);
    }

    // ---------- Detail card ----------
    const heroEl = document.getElementById("ptl-panel-hero");
    const heroGateEl = document.getElementById("ptl-panel-hero-gate");
    const iconEl = document.getElementById("ptl-panel-icon");
    const iconGateEl = document.getElementById("ptl-panel-icon-gate");
    const nameEl = document.getElementById("ptl-panel-name");
    const metaEl = document.getElementById("ptl-panel-meta");
    const descEl = document.getElementById("ptl-panel-desc");
    const ctaEl = document.getElementById("ptl-panel-cta");
    const ctaLockedEl = document.getElementById("ptl-panel-cta-locked");

    let activeNode = null;

    function openFor(node) {
        if (activeNode) activeNode.classList.remove("is-active");
        activeNode = node;
        node.classList.add("is-active");

        const isWip = node.dataset.wip === "true";
        const img = node.dataset.image || "";

        // Hero: real image for shipped projects, hatched lock panel for WIP.
        heroEl.hidden = isWip;
        heroGateEl.hidden = !isWip;
        if (!isWip) heroEl.src = img;

        // Inline icon: real image for shipped, lock badge for WIP.
        iconEl.hidden = isWip;
        iconGateEl.hidden = !isWip;
        if (!isWip) iconEl.src = img;

        nameEl.textContent = node.dataset.name || "";

        if (isWip) {
            metaEl.textContent = "In development";
        } else {
            const metaParts = [];
            if (node.dataset.time) metaParts.push(node.dataset.time);
            if (node.dataset.tags) metaParts.push(node.dataset.tags);
            metaEl.textContent = metaParts.join(" · ");
        }

        descEl.textContent = node.dataset.description || "";

        // CTA: link for shipped, locked chip for WIP.
        ctaEl.hidden = isWip;
        ctaLockedEl.hidden = !isWip;
        if (!isWip) ctaEl.href = "/projects/" + (node.dataset.slug || "") + "/";

        panel.classList.toggle("is-wip-panel", isWip);

        // Anchor card under the node's x-percent.
        panel.style.left = node.style.left;
        panel.hidden = false;
    }

    function close() {
        if (activeNode) activeNode.classList.remove("is-active");
        activeNode = null;
        panel.hidden = true;
    }

    nodes.forEach((node) => {
        const onSelect = (ev) => {
            ev.stopPropagation();
            if (activeNode === node) {
                close();
            } else {
                openFor(node);
            }
        };
        node.querySelector(".ptl-dot").addEventListener("click", onSelect);
        const pill = node.querySelector(".ptl-pill");
        if (pill) pill.addEventListener("click", onSelect);
    });

    // Click outside the panel/dots closes it.
    document.addEventListener("click", (ev) => {
        if (!activeNode) return;
        if (panel.contains(ev.target)) return;
        close();
    });

    document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") close();
    });

    // ---------- Mobile fallback: build a vertical list from the same data ----------
    const LOCK_SVG = '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M4 7V5a4 4 0 1 1 8 0v2h.5A1.5 1.5 0 0 1 14 8.5v5A1.5 1.5 0 0 1 12.5 15h-9A1.5 1.5 0 0 1 2 13.5v-5A1.5 1.5 0 0 1 3.5 7H4zm1.5 0h5V5a2.5 2.5 0 1 0-5 0v2z"/></svg>';
    const mobileList = document.createElement("div");
    mobileList.className = "ptl-mobile";
    entries.forEach((e) => {
        const isWip = e.node.dataset.wip === "true";
        // WIP items aren't links (no detail page exists); shipped ones are.
        const item = document.createElement(isWip ? "div" : "a");
        item.className = "ptl-mobile-item" + (isWip ? " is-wip" : "");
        if (!isWip) item.href = "/projects/" + (e.node.dataset.slug || "") + "/";

        if (isWip) {
            const lock = document.createElement("div");
            lock.className = "ptl-mobile-lock";
            lock.innerHTML = LOCK_SVG;
            item.appendChild(lock);
        } else {
            const img = document.createElement("img");
            img.src = e.node.dataset.image || "";
            img.alt = "";
            item.appendChild(img);
        }

        const meta = document.createElement("div");
        const name = document.createElement("div");
        name.className = "ptl-mobile-name";
        name.textContent = e.node.dataset.name || "";
        const sub = document.createElement("div");
        sub.className = "ptl-mobile-meta";
        if (isWip) {
            sub.textContent = "In development · " + (e.node.dataset.time || "");
        } else {
            const subParts = [];
            if (e.node.dataset.time) subParts.push(e.node.dataset.time);
            if (e.node.dataset.tags) subParts.push(e.node.dataset.tags);
            sub.textContent = subParts.join(" · ");
        }
        meta.appendChild(name);
        meta.appendChild(sub);
        item.appendChild(meta);
        mobileList.appendChild(item);
    });
    root.appendChild(mobileList);
})();
