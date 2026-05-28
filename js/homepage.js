// Tag filter logic + tiny click handlers for the homepage.

function filterProjects(tag, activeButton) {
    const projects = document.querySelectorAll('.project-card');
    const buttons = document.querySelectorAll('.tag-button');

    buttons.forEach((btn) => btn.classList.remove('active'));
    activeButton.classList.add('active');

    const wanted = tag.toLowerCase();
    projects.forEach((project) => {
        const tags = project.getAttribute('data-tags').split(',').map((t) => t.trim().toLowerCase());
        const visible = wanted === 'all' || tags.includes(wanted);
        project.style.display = visible ? 'block' : 'none';
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-action="home"]').forEach((el) => {
        el.addEventListener('click', () => { window.location.href = '/'; });
    });

    document.querySelectorAll('[data-action="filter"]').forEach((btn) => {
        btn.addEventListener('click', () => filterProjects(btn.dataset.tag, btn));
    });

    document.querySelectorAll('[data-action="scroll-top"]').forEach((btn) => {
        btn.addEventListener('click', scrollToTop);
    });

    const urlTag = new URLSearchParams(window.location.search).get('tag');
    let initialButton = null;
    if (urlTag) {
        initialButton = document.querySelector(`.tag-button[data-tag="${CSS.escape(urlTag)}"]`);
    }
    if (!initialButton) {
        initialButton = document.querySelector('.tag-button');
    }
    if (initialButton) {
        filterProjects(initialButton.dataset.tag, initialButton);
    }
});
