// Project detail page: reads project data from a JSON <script> block
// embedded by the Hugo layout, renders the title + body content, and
// lazy-loads the YouTube IFrame API for embedded videos.
//
// Body content schema (each block has `type`):
//   text  -> { type: text,  value: "..." }
//   list  -> { type: list,  intro: "...", items: ["...", "..."] }
//   image -> { type: image, value: "/path/img.png" }
//   gif   -> { type: gif,   value: "/path/anim.gif" }
//   video -> { type: video, value: "https://youtu.be/..." }

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

function renderVideo(item, container) {
    const videoId = extractVideoID(item.value);
    if (!videoId) {
        console.error('Invalid YouTube link:', item.value);
        return;
    }
    const videoContainer = document.createElement('div');
    videoContainer.id = `youtube-player-${videoId}`;
    videoContainer.className = 'project-content-video';
    container.appendChild(videoContainer);
    loadYouTubeAPI(() => createYouTubePlayer(videoId));
}

function renderText(item, container) {
    const p = document.createElement('p');
    p.textContent = item.value;
    container.appendChild(p);
}

function renderList(item, container) {
    if (item.intro) {
        const p = document.createElement('p');
        p.textContent = item.intro;
        container.appendChild(p);
    }
    const ul = document.createElement('ul');
    (item.items || []).forEach((line) => {
        const li = document.createElement('li');
        li.textContent = line;
        ul.appendChild(li);
    });
    container.appendChild(ul);
}

function renderImageLike(item, container, className) {
    const img = document.createElement('img');
    img.src = item.value;
    img.className = className;
    container.appendChild(img);
}

const renderers = {
    text:  renderText,
    list:  renderList,
    image: (item, c) => renderImageLike(item, c, 'project-content-image'),
    gif:   (item, c) => renderImageLike(item, c, 'project-content-gif'),
    video: renderVideo,
};

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
    (project.content || []).forEach((item) => {
        const render = renderers[item.type];
        if (render) {
            render(item, contentContainer);
        } else {
            console.warn('Unknown content type:', item.type, item);
        }
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
