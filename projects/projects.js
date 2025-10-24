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
    try {
      const data = await fetchJSON(`${base}?v=${Date.now()}`);
      if (Array.isArray(data)) return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Could not load projects.json");
}

try {
  const projects = await loadProjects();
  const container = document.querySelector(".projects");
  renderProjects(projects, container, "h2");

  const titleEl = document.querySelector(".projects-title");
  if (titleEl) {
    const base = titleEl.dataset.baseTitle || titleEl.textContent.trim() || "Projects";
    titleEl.dataset.baseTitle = base;
    titleEl.textContent = `${base} (${projects.length})`;
  }
} catch (err) {
  console.error("Failed to load projects:", err);
  const container = document.querySelector(".projects");
  if (container) container.innerHTML = `<p class="error">Couldn’t load projects. Please try again later.</p>`;
}



