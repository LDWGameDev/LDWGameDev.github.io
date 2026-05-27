// Per-project page: wires up YouTube embeds (from data-youtube-url
// placeholders rendered by Hugo) and the standard nav buttons.

function extractVideoID(url) {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = url.match(youtubeRegex);
    return match && match[1] ? match[1] : null;
}

function setupVisibilityObserver(player, videoId) {
    const el = document.getElementById(`youtube-player-${videoId}`);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                player.pauseVideo();
            }
        });
    }, {
        threshold: 0.1  // pause once less than 10% of the player is visible
    });
    observer.observe(el);
}

function createYouTubePlayer(videoId) {
    return new YT.Player(`youtube-player-${videoId}`, {
        videoId: videoId,
        events: {
            'onReady': (event) => {
                event.target.setPlaybackQuality('hd1080');
                setupVisibilityObserver(event.target, videoId);
            },
            'onError': (event) => {
                console.error('YouTube player error:', event);
            }
        },
        playerVars: {
            rel: 0,
            modestbranding: 1,
            autoplay: 0
        }
    });
}

const youtubeVideoQueue = [];

function loadYouTubeAPI(callback) {
    if (window.YT && YT.Player) {
        callback();
        return;
    }
    if (!document.getElementById('youtube-iframe-api')) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
    }
    youtubeVideoQueue.push(callback);
    window.onYouTubeIframeAPIReady = function () {
        youtubeVideoQueue.forEach((init) => init());
        youtubeVideoQueue.length = 0;
    };
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initPrevNextCarousel() {
    const nav = document.querySelector('.project-prev-next');
    const dataEl = document.getElementById('all-projects-data');
    if (!nav || !dataEl) return;

    const all = JSON.parse(dataEl.textContent);
    const currentSlug = nav.dataset.currentSlug;
    const others = all.filter((p) => p.slug !== currentSlug);
    if (others.length < 2) return;

    const currentIndex = all.findIndex((p) => p.slug === currentSlug);
    const prevOriginal = all[(currentIndex - 1 + all.length) % all.length];
    let leftIdx = others.findIndex((p) => p.slug === prevOriginal.slug);

    const prevCard = nav.querySelector('.project-card-link.prev');
    const nextCard = nav.querySelector('.project-card-link.next');
    const segs = Array.from(document.querySelectorAll('.project-pagination .seg'));

    function updateCard(cardEl, project) {
        cardEl.href = `/projects/${project.slug}/`;
        const img = cardEl.querySelector('img');
        img.src = project.image;
        img.alt = project.name;
        cardEl.querySelector('.more-name').textContent = project.name;
    }

    function updateActiveSegs() {
        if (!segs.length) return;
        const activeA = leftIdx;
        const activeB = (leftIdx + 1) % others.length;
        segs.forEach((seg, i) => {
            seg.classList.toggle('active', i === activeA || i === activeB);
        });
    }

    const SLIDE_PX = 32;
    const HALF_MS = 140;

    function setTransition(on) {
        const v = on ? `transform ${HALF_MS}ms ease, opacity ${HALF_MS}ms ease` : 'none';
        prevCard.style.transition = v;
        nextCard.style.transition = v;
    }

    function render(direction) {
        const out = direction === 'next' ? -SLIDE_PX : SLIDE_PX;
        // Slide out in the direction of motion
        setTransition(true);
        prevCard.style.transform = `translateX(${out}px)`;
        nextCard.style.transform = `translateX(${out}px)`;
        prevCard.style.opacity = '0';
        nextCard.style.opacity = '0';

        setTimeout(() => {
            updateCard(prevCard, others[leftIdx]);
            updateCard(nextCard, others[(leftIdx + 1) % others.length]);
            updateActiveSegs();

            // Jump to opposite side instantly
            setTransition(false);
            prevCard.style.transform = `translateX(${-out}px)`;
            nextCard.style.transform = `translateX(${-out}px)`;
            // Force reflow so the next style change animates
            void prevCard.offsetWidth;

            // Slide back to center
            setTransition(true);
            prevCard.style.transform = 'translateX(0)';
            nextCard.style.transform = 'translateX(0)';
            prevCard.style.opacity = '1';
            nextCard.style.opacity = '1';
        }, HALF_MS);
    }

    updateActiveSegs();

    nav.querySelectorAll('[data-direction]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const dir = btn.dataset.direction;
            if (dir === 'prev') {
                leftIdx = (leftIdx - 1 + others.length) % others.length;
            } else {
                leftIdx = (leftIdx + 1) % others.length;
            }
            render(dir);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initPrevNextCarousel();

    document.querySelectorAll('.project-content-video[data-youtube-url]').forEach((el) => {
        const videoId = extractVideoID(el.dataset.youtubeUrl);
        if (!videoId) {
            console.error('Invalid YouTube URL:', el.dataset.youtubeUrl);
            return;
        }
        el.id = `youtube-player-${videoId}`;
        loadYouTubeAPI(() => createYouTubePlayer(videoId));
    });

    document.querySelectorAll('[data-action="home"]').forEach((el) => {
        el.addEventListener('click', () => { window.location.href = '/'; });
    });

    document.querySelectorAll('[data-action="scroll-top"]').forEach((btn) => {
        btn.addEventListener('click', scrollToTop);
    });
});
