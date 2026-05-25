// Legacy /project/?id=N URL → /projects/<slug>/ redirector.
// Preserves any old inbound links from before per-project pages existed.

(function () {
    const dataEl = document.getElementById('projects-data');
    const projects = dataEl ? JSON.parse(dataEl.textContent) : [];

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    const project = Number.isInteger(id) ? projects[id] : null;

    window.location.replace(project ? `/projects/${project.slug}/` : '/');
})();
