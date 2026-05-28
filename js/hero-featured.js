/* Hero "Featured" row: renders 3 random project cards from the shipped pool
   embedded in <script id="hero-featured-pool">, cross-fades to a fresh trio
   every 5s, pauses on hover/focus, and skips rotation under reduced-motion.
   Markup: layouts/page/homepage.html. Styles: static/css/homepage.css. */
(function () {
    const root = document.getElementById('hero-featured');
    if (!root) return;

    const poolEl = document.getElementById('hero-featured-pool');
    const slots = [...root.querySelectorAll('.hero-featured-card')];
    if (!poolEl || slots.length === 0) return;

    let pool;
    try {
        pool = JSON.parse(poolEl.textContent);
    } catch (_) {
        return;
    }
    if (!Array.isArray(pool) || pool.length === 0) return;

    const slotCount = slots.length;
    const ROTATE_MS = 5000;
    const FADE_MS = 250;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function shuffled(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    let lastSlugs = new Set();
    function pickTrio() {
        // Sample without replacement, avoiding the previous trio when pool size allows.
        const eligible = pool.length > slotCount
            ? pool.filter(p => !lastSlugs.has(p.slug))
            : pool;
        const picked = shuffled(eligible).slice(0, slotCount);
        // If pool is small and we ended up short, top up from the full pool.
        if (picked.length < slotCount) {
            const extras = shuffled(pool.filter(p => !picked.includes(p)));
            picked.push(...extras.slice(0, slotCount - picked.length));
        }
        lastSlugs = new Set(picked.map(p => p.slug));
        return picked;
    }

    function tagList(tags) {
        return Array.isArray(tags) ? tags.join(', ') : '';
    }

    function renderInto(slot, project) {
        slot.setAttribute('href', `/projects/${project.slug}/`);
        slot.setAttribute('aria-label', project.name);
        slot.innerHTML = `
            <img src="${project.image}" alt="${project.name}" class="hero-featured-image">
            <div class="hero-featured-info">
                <h4 class="hero-featured-name">${project.name}</h4>
                <p class="hero-featured-time">${project.time || ''}</p>
                <p class="hero-featured-tags">${tagList(project.tags)}</p>
            </div>
        `;
    }

    function paint(trio) {
        slots.forEach((slot, i) => {
            if (trio[i]) renderInto(slot, trio[i]);
        });
    }

    // Initial paint.
    paint(pickTrio());
    requestAnimationFrame(() => root.classList.add('is-ready'));

    if (reduceMotion) return;

    let timerId = null;
    let paused = false;

    function swap() {
        if (paused) return;
        const next = pickTrio();
        slots.forEach(s => s.classList.add('is-swapping'));
        setTimeout(() => {
            paint(next);
            slots.forEach(s => s.classList.remove('is-swapping'));
        }, FADE_MS);
    }

    function start() {
        if (timerId !== null) return;
        timerId = setInterval(swap, ROTATE_MS);
    }
    function stop() {
        if (timerId === null) return;
        clearInterval(timerId);
        timerId = null;
    }

    root.addEventListener('mouseenter', () => { paused = true; });
    root.addEventListener('mouseleave', () => { paused = false; });
    root.addEventListener('focusin', () => { paused = true; });
    root.addEventListener('focusout', () => { paused = false; });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
    });

    start();
})();
