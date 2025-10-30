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

/* =========================
 * Pie chart + legend + search (D3)
 * ========================= */
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// ---------- Use existing globals if available; fallback if missing ----------
async function ensureProjects() {
  if (Array.isArray(window.projects) && window.projects.length) return window.projects;
  try {
    const res = await fetch('./projects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    window.projects = data;
    return data;
  } catch {
    window.projects = [];
    return [];
  }
}

// Fallback renderer if your site hasn't defined one.
if (typeof window.renderProjects !== 'function') {
  window.renderProjects = (list, container = document.querySelector('.projects')) => {
    const root = container ?? document.querySelector('.projects');
    if (!root) return;
    root.innerHTML = '';
    for (const p of list) {
      const art = document.createElement('article');

      const h2 = document.createElement('h2');
      h2.className = 'project-title';
      const title = document.createElement('span');
      title.textContent = p.title ?? 'Untitled';
      const year = document.createElement('span');
      year.className = 'project-year';
      year.textContent = p.year ?? '';
      h2.append(title, year);
      art.appendChild(h2);

      if (p.image) {
        const img = document.createElement('img');
        img.src = p.image;
        img.alt = p.title ?? '';
        art.appendChild(img);
      }
      if (p.description) {
        const d = document.createElement('p');
        d.className = 'project-description';
        d.textContent = p.description;
        art.appendChild(d);
      }
      if (p.links && Array.isArray(p.links) && p.links.length) {
        const linksWrap = document.createElement('div');
        linksWrap.className = 'project-links';
        for (const link of p.links) {
          const a = document.createElement('a');
          a.className = 'project-link';
          a.href = link.href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = link.label ?? 'Link';
          linksWrap.appendChild(a);
        }
        art.appendChild(linksWrap);
      }

      root.appendChild(art);
    }
  };
}

// ---------- D3 setup ----------
const svg = d3.select('#projects-pie-plot');
const legendUL = d3.select('.legend');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const sliceGenerator = d3.pie().value(d => d.value).sort(null);

function toYearCounts(list) {
  // list -> [['2024', 3], ...] -> [{label:'2024', value:3}, ...]
  const rolled = d3.rollups(list, v => v.length, d => d.year);
  rolled.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return rolled.map(([year, count]) => ({ label: String(year), value: count }));
}

function clearChart() {
  svg.selectAll('*').remove();
  legendUL.selectAll('*').remove();
}

function renderPieChart(list, selectedIndex) {
  clearChart();

  const data = toYearCounts(list);
  if (!data.length) return;

  const arcData = sliceGenerator(data);
  const paths = arcData.map(d => arcGenerator(d));

  // slices
  paths.forEach((dPath, i) => {
    svg.append('path')
      .attr('d', dPath)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : null)
      .on('click', () => {
        state.selectedIndex = (state.selectedIndex === i) ? -1 : i;
        applyFiltersAndRerender();
      });
  });

  // legend
  data.forEach((d, i) => {
    legendUL.append('li')
      .attr('class', `legend-item${i === selectedIndex ? ' selected' : ''}`)
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        state.selectedIndex = (state.selectedIndex === i) ? -1 : i;
        applyFiltersAndRerender();
      });
  });
}

// ---------- Combined filtering (search + year) ----------
const state = {
  all: [],
  query: '',
  selectedIndex: -1
};

function matchesQuery(project) {
  if (!state.query) return true;
  const hay = Object.values(project).join('\n').toLowerCase();
  return hay.includes(state.query.toLowerCase());
}
function matchesSelectedYear(project, textFiltered) {
  if (state.selectedIndex === -1) return true;
  const data = toYearCounts(textFiltered);
  const label = data[state.selectedIndex]?.label;
  return label ? String(project.year) === label : true;
}

function applyFiltersAndRerender() {
  const byText = state.all.filter(matchesQuery);
  const combined = byText.filter(p => matchesSelectedYear(p, byText));
  window.renderProjects(combined, projectsContainer);
  renderPieChart(combined, state.selectedIndex);
}

// ---------- Boot ----------
window.addEventListener('DOMContentLoaded', async () => {
  state.all = Array.isArray(window.projects) && window.projects.length
    ? window.projects
    : await ensureProjects();

  // First render
  window.renderProjects(state.all, projectsContainer);
  renderPieChart(state.all, state.selectedIndex);

  // Search
  if (searchInput && !searchInput.__hasPieListener) {
    searchInput.addEventListener('input', (e) => {
      state.query = e.target.value ?? '';
      applyFiltersAndRerender();
    });
    searchInput.__hasPieListener = true;
  }
});


