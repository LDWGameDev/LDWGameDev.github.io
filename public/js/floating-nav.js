/* Floating section nav scrollspy + click-to-jump.
   Partial: layouts/partials/floating_nav.html. Styles: static/css/floating-nav.css. */
(function () {
    const nav = document.querySelector('.fnav');
    if (!nav) return;

    const labelButtons = [...nav.querySelectorAll('.fnav-labels button')];
    const ticks = [...nav.querySelectorAll('.fnav-ticks li')];
    const fill = nav.querySelector('.fnav-fill');

    const sections = labelButtons
        .map(btn => document.getElementById(btn.dataset.target))
        .filter(Boolean);

    if (sections.length === 0) return;

    // Probe line: 25% from the top of the viewport. A section is "active" once its top
    // crosses this line, so the indicator advances a little before the heading reaches center.
    const PROBE_RATIO = 0.25;

    function update() {
        const probe = window.scrollY + window.innerHeight * PROBE_RATIO;

        let activeIdx = 0;
        for (let i = 0; i < sections.length; i++) {
            if (sections[i].offsetTop <= probe) activeIdx = i;
        }

        labelButtons.forEach((btn, i) => btn.classList.toggle('is-active', i === activeIdx));
        ticks.forEach((t, i) => t.classList.toggle('is-passed', i <= activeIdx));

        // Fill tracks tick positions: each section maps to one tick, so progress through
        // the segment between section i and i+1 fills between tick i and tick i+1.
        // Once the last section is active, the fill is pinned at 100% so it reaches the bottom tick.
        const n = sections.length;
        let progress;
        if (activeIdx >= n - 1) {
            progress = 1;
        } else {
            const segStart = sections[activeIdx].offsetTop;
            const segEnd = sections[activeIdx + 1].offsetTop;
            const segSpan = Math.max(1, segEnd - segStart);
            const segProgress = Math.max(0, Math.min(1, (probe - segStart) / segSpan));
            progress = (activeIdx + segProgress) / (n - 1);
        }
        fill.style.height = (progress * 100) + '%';
    }

    // Click a label or tick → smooth scroll to that section. Account for a small top offset
    // so the heading doesn't sit flush against the viewport edge.
    function jumpTo(targetId) {
        const el = document.getElementById(targetId);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    labelButtons.forEach(btn => {
        btn.addEventListener('click', () => jumpTo(btn.dataset.target));
    });
    nav.querySelectorAll('.fnav-ticks li').forEach(tick => {
        if (!tick.dataset.target) return;
        tick.style.pointerEvents = 'auto';
        tick.style.cursor = 'pointer';
        tick.addEventListener('click', () => jumpTo(tick.dataset.target));
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            update();
            ticking = false;
        });
    }, { passive: true });

    window.addEventListener('resize', update);

    update();
    requestAnimationFrame(() => nav.classList.add('is-ready'));
})();
