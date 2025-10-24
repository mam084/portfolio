import { fetchJSON, renderProjects } from '../global.js';

// Try multiple candidate locations for projects.json (handles different repo structures),
// add a cache-buster to avoid stale CDN/browser caches.
const CANDIDATES = [
  './projects.json',
  '../projects.json',
  '../lib/projects.json',
  '/projects.json',
  '/lib/projects.json'
];

async function loadProjects() {
  let lastErr = null;
  for (const base of CANDIDATES) {
    const url = `${base}?v=${Date.now()}`;
    try {
      const data = await fetchJSON(url);
      if (Array.isArray(data)) {
        console.info('[projects] Loaded from', base);
        return data;
      } else {
        console.warn('[projects] Non-array JSON at', base, data);
      }
    } catch (err) {
      lastErr = err;
      // continue to next candidate
    }
  }
  throw lastErr ?? new Error('Could not load projects.json from any known location.');
}

try {
  const projects = await loadProjects();

  // Optional: if you want newest first but keep stable when year missing,
  // you can sort here instead of inside renderProjects.
  // projects.sort((a, b) => (+(b?.year ?? -Infinity)) - (+(a?.year ?? -Infinity)));

  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');

  // Update count in header
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
