import { fetchJSON, renderProjects } from '../global.js';

try {
  const projects = await fetchJSON('../lib/projects.json');

  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2'); // or 'h3', etc.

  const titleEl = document.querySelector('.projects-title');
  if (titleEl) {
    const base = titleEl.dataset.baseTitle || titleEl.textContent.trim() || 'Projects';
    titleEl.dataset.baseTitle = base; // preserve original
    titleEl.textContent = `${base} (${Array.isArray(projects) ? projects.length : 0})`;
  }
} catch (err) {
  console.error('Failed to load projects:', err);

  // Minimal UI fallback
  const projectsContainer = document.querySelector('.projects');
  if (projectsContainer) {
    projectsContainer.innerHTML = `<p class="error">Couldn’t load projects. Please try again later.</p>`;
  }
}


