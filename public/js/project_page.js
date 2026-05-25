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

document.addEventListener('DOMContentLoaded', () => {
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
