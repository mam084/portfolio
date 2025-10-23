import { fetchJSON, renderProjects } from './global.js'; // adjust path if needed

async function init() {
  try {
    const projects = await fetchJSON('./lib/projects.json');

    const latestProjects = Array.isArray(projects) ? projects.slice(0, 3) : [];

    const container = document.querySelector('.projects');
    if (!container) {
      console.error('Missing .projects container on the home page.');
      return;
    }

    renderProjects(latestProjects, container, 'h3'); 
  } catch (err) {
    console.error('Failed to load latest projects on home page:', err);
    const container = document.querySelector('.projects');
    if (container) {
      container.innerHTML = `<p class="error">Couldn’t load latest projects right now.</p>`;
    }
  }
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}