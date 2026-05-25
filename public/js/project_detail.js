// Project detail page: reads project data from a JSON <script> block
// embedded by the Hugo layout, renders the title + body content, and
// lazy-loads the YouTube IFrame API for embedded videos.

function convertToEmbedURL(url) {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = url.match(youtubeRegex);
    return match && match[1] ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function extractVideoID(url) {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = url.match(youtubeRegex);
    return match && match[1] ? match[1] : null;
}

function setupVisibilityObserver(player, videoId) {
    const videoElement = document.getElementById(`youtube-player-${videoId}`);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                player.pauseVideo();
            }
        });
    }, {
        threshold: 0.1  // pause once less than 10% of the player is visible
    });
    observer.observe(videoElement);
}

function createYouTubePlayer(videoId) {
    const player = new YT.Player(`youtube-player-${videoId}`, {
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
    return player;
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

function displayYouTubeVideo(link, container) {
    const videoId = extractVideoID(link);
    if (!videoId) {
        console.error('Invalid YouTube link:', link);
        return;
    }
    const videoContainer = document.createElement('div');
    videoContainer.id = `youtube-player-${videoId}`;
    videoContainer.className = 'project-content-video';
    container.appendChild(videoContainer);
    loadYouTubeAPI(() => createYouTubePlayer(videoId));
}

function displayTextContent(content, container) {
    const processed = content.replace(/\\n/g, '\n');
    if (processed.includes('\n-')) {
        const lines = processed.split('\n');
        const p = document.createElement('p');
        p.textContent = lines[0];
        container.appendChild(p);
        const ul = document.createElement('ul');
        lines.slice(1).forEach((line) => {
            if (line.startsWith('-')) {
                const li = document.createElement('li');
                li.textContent = line.substring(2);
                ul.appendChild(li);
            }
        });
        container.appendChild(ul);
    } else {
        const p = document.createElement('p');
        p.textContent = processed;
        container.appendChild(p);
    }
}

function displayImageContent(src, container) {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'project-content-image';
    container.appendChild(img);
}

function displayGifContent(src, container) {
    const gif = document.createElement('img');
    gif.src = src;
    gif.className = 'project-content-gif';
    container.appendChild(gif);
}

function renderProject(project) {
    document.getElementById('project-image').src = project.image;
    document.getElementById('project-image').alt = project.name;
    document.getElementById('project-name').textContent = project.name;
    document.getElementById('project-time').textContent = project.time;
    document.getElementById('project-description').textContent = project.description;

    const tagsContainer = document.getElementById('project-tags');
    tagsContainer.innerHTML = '';
    project.tags.forEach((tag) => {
        const el = document.createElement('span');
        el.className = 'tag';
        el.textContent = tag;
        tagsContainer.appendChild(el);
    });

    const contentContainer = document.createElement('div');
    contentContainer.className = 'project-detailed-content';
    project.content.forEach((item) => {
        Object.values(item).forEach((value) => {
            const [type, content] = value.split(/#(.+)/);
            if (type === '0') {
                displayTextContent(content, contentContainer);
            } else if (type === '1') {
                displayImageContent(content, contentContainer);
            } else if (type === '2') {
                displayGifContent(content, contentContainer);
            } else if (type === '3') {
                displayYouTubeVideo(content, contentContainer);
            }
        });
    });
    document.querySelector('.project-title-section').after(contentContainer);
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    const dataEl = document.getElementById('projects-data');
    const projects = JSON.parse(dataEl.textContent);

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('id'), 10);
    const project = Number.isInteger(projectId) ? projects[projectId] : undefined;

    if (!project) {
        window.location.href = '/';
        return;
    }

    renderProject(project);

    document.querySelectorAll('[data-action="home"]').forEach((el) => {
        el.addEventListener('click', () => { window.location.href = '/'; });
    });

    document.querySelectorAll('[data-action="scroll-top"]').forEach((btn) => {
        btn.addEventListener('click', scrollToTop);
    });
});
