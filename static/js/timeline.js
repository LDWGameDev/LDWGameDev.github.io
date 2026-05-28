// Career timeline behavior:
// 1. Read each bar's data-start / data-end, compute earliest-start → latest-end window,
//    pad to year boundaries, then set each bar's left/width as a % of the window.
// 2. Generate year + quarter ticks on the axis from the same window.
// 3. On hover/focus, swap the detail panel content from the bar's data-*.
// On mobile (<=700px) CSS overrides positions to render bars as a vertical stack.

(function () {
    const tl = document.getElementById("experience-tl");
    if (!tl) return;

    const axis = document.getElementById("experience-axis");
    const bars = Array.from(tl.querySelectorAll(".bar"));
    if (bars.length === 0) return;

    // "YYYY-MM" or "present" -> integer month index (year*12 + month, 1-based month).
    // startIdx points at the first day of that month; endIdx points one past the
    // last month (inclusive end), so a role with end=2022-12 reaches Jan 2023's start.
    const now = new Date();
    const presentIdx = now.getFullYear() * 12 + (now.getMonth() + 1);

    function startIdx(value) {
        if (!value || value === "present") return presentIdx;
        const [y, m] = value.split("-").map(Number);
        return y * 12 + m;
    }

    function endIdx(value) {
        return startIdx(value) + 1;
    }

    // Collect all start/end indices.
    let minIdx = Infinity;
    let maxIdx = -Infinity;
    bars.forEach((bar) => {
        const s = startIdx(bar.dataset.start);
        const e = endIdx(bar.dataset.end);
        if (s < minIdx) minIdx = s;
        if (e > maxIdx) maxIdx = e;
    });

    // Pad window to year boundaries (Jan of minYear -> Jan of (maxYear + 1)).
    const minYear = Math.floor((minIdx - 1) / 12);
    const maxYear = Math.floor((maxIdx - 1) / 12);
    const windowStart = minYear * 12 + 1; // Jan minYear
    const windowEnd = (maxYear + 1) * 12 + 1; // Jan (maxYear + 1)
    const totalMonths = windowEnd - windowStart;

    function pct(idx) {
        return ((idx - windowStart) / totalMonths) * 100;
    }

    // Position bars.
    bars.forEach((bar) => {
        const s = startIdx(bar.dataset.start);
        const e = endIdx(bar.dataset.end);
        const left = pct(s);
        const width = pct(e) - left;
        bar.style.left = left + "%";
        bar.style.width = width + "%";
    });
    tl.classList.add("is-positioned");

    // Build axis ticks: a labeled tick at every Jan, quarter ticks in between.
    for (let y = minYear; y <= maxYear + 1; y++) {
        const tickIdx = y * 12 + 1;
        const p = pct(tickIdx);
        if (p < 0 || p > 100) continue;

        const tick = document.createElement("span");
        tick.className = "tl-tick";
        tick.style.left = p + "%";
        const label = document.createElement("span");
        label.className = "tl-tick-label";
        label.textContent = y;
        tick.appendChild(label);
        axis.appendChild(tick);

        if (y <= maxYear) {
            for (let q = 1; q <= 3; q++) {
                const qIdx = y * 12 + 1 + q * 3;
                const qp = pct(qIdx);
                if (qp <= 0 || qp >= 100) continue;
                const qtick = document.createElement("span");
                qtick.className = "tl-tick is-quarter";
                qtick.style.left = qp + "%";
                axis.appendChild(qtick);
            }
        }
    }

    // Panel swap.
    const panelEl = document.getElementById("experience-panel");
    const roleEl = document.getElementById("exp-role");
    const coEl = document.getElementById("exp-co");
    const metaEl = document.getElementById("exp-meta");
    const sumEl = document.getElementById("exp-sum");
    const hlEl = document.getElementById("exp-hl");
    const techEl = document.getElementById("exp-tech");

    const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function fmtDate(value) {
        if (!value || value === "present") return "present";
        const [y, m] = value.split("-").map(Number);
        return MONTHS_SHORT[m - 1] + " " + y;
    }

    function fmtDuration(startIdx, endIdx) {
        const months = endIdx - startIdx;
        if (months < 1) return "less than a month";
        const years = Math.floor(months / 12);
        const rem = months % 12;
        if (years === 0) return rem + " mo";
        if (rem === 0) return years + " yr";
        return years + " yr " + rem + " mo";
    }

    function applyBar(bar) {
        roleEl.textContent = bar.dataset.role || "";
        coEl.textContent = bar.dataset.company || "";

        const start = bar.dataset.start;
        const end = bar.dataset.end;
        const isOngoing = bar.dataset.ongoing === "true";

        // Build the meta line as DOM nodes so we can embed the live "Ongoing"
        // pill (markup) safely without HTML-injecting the location/type strings.
        metaEl.textContent = "";

        const dateNode = document.createElement("span");
        if (isOngoing) {
            dateNode.appendChild(document.createTextNode(fmtDate(start) + " – "));
            const ongoing = document.createElement("span");
            ongoing.className = "tl-ongoing";
            const dot = document.createElement("span");
            dot.className = "tl-live-dot";
            ongoing.appendChild(dot);
            ongoing.appendChild(document.createTextNode("Ongoing"));
            dateNode.appendChild(ongoing);
        } else {
            dateNode.textContent = fmtDate(start) + " – " + fmtDate(end);
        }
        metaEl.appendChild(dateNode);

        const tailParts = [];
        // Skip the duration figure for ongoing entries — the yaml `end` date
        // is just a hint to scale the axis, so a literal "1 yr 6 mo" misleads.
        if (!isOngoing) tailParts.push(fmtDuration(startIdx(start), endIdx(end)));
        if (bar.dataset.location) tailParts.push(bar.dataset.location);
        if (bar.dataset.type) tailParts.push(bar.dataset.type);
        tailParts.forEach((part) => {
            metaEl.appendChild(document.createTextNode(" · " + part));
        });

        sumEl.textContent = bar.dataset.summary || "";

        let highlights = [];
        try { highlights = JSON.parse(bar.dataset.highlights || "[]"); } catch (e) {}
        hlEl.innerHTML = highlights.map((h) => {
            const li = document.createElement("li");
            li.textContent = h;
            return li.outerHTML;
        }).join("");

        let tech = [];
        try { tech = JSON.parse(bar.dataset.tech || "[]"); } catch (e) {}
        techEl.innerHTML = tech.map((t) => {
            const span = document.createElement("span");
            span.textContent = t;
            return span.outerHTML;
        }).join("");

        bars.forEach((b) => b.classList.remove("is-active"));
        bar.classList.add("is-active");

        if (isOngoing) {
            panelEl.dataset.ongoing = "true";
        } else {
            delete panelEl.dataset.ongoing;
        }
    }

    // Click (or keyboard Enter/Space on a focused button) selects a bar.
    bars.forEach((bar) => {
        bar.addEventListener("click", () => applyBar(bar));
    });

    // Default: pick the role active today. An ongoing role is always considered
    // current (its yaml `end` is just an axis hint). Among non-ongoing roles,
    // "active" means today falls within [start, end]. If multiple match, prefer
    // the one with the latest start. Fall back to the latest-ending bar.
    let defaultBar = bars[0];
    let bestStart = -Infinity;
    let found = false;
    bars.forEach((bar) => {
        const s = startIdx(bar.dataset.start);
        const e = endIdx(bar.dataset.end);
        const isOngoing = bar.dataset.ongoing === "true";
        const isActive = isOngoing ? s <= presentIdx : s <= presentIdx && presentIdx < e;
        if (isActive && s > bestStart) {
            bestStart = s;
            defaultBar = bar;
            found = true;
        }
    });
    if (!found) {
        let bestEnd = -Infinity;
        bestStart = -Infinity;
        bars.forEach((bar) => {
            const e = endIdx(bar.dataset.end);
            const s = startIdx(bar.dataset.start);
            if (e > bestEnd || (e === bestEnd && s > bestStart)) {
                bestEnd = e;
                bestStart = s;
                defaultBar = bar;
            }
        });
    }
    applyBar(defaultBar);
})();
