import { fetchJSON, renderProjects as importedRenderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

/* =======================================================
   Data loading (single loader, shared across the page)
   ======================================================= */
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
      // cache-buster avoids stale CDN/browser caches
      const data = await fetchJSON(`${base}?v=${Date.now()}`);
      if (Array.isArray(data)) return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('Could not load projects.json');
}

/* =======================================================
   Renderer (use global if present; otherwise fallback)
   ======================================================= */
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
const renderList = window.renderProjects ?? importedRenderProjects;

/* =======================================================
   D3 helpers
   ======================================================= */
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const sliceGenerator = d3.pie().value(d => d.value).sort(null);

function toYearCounts(list) {
  const rolled = d3.rollups(list, v => v.length, d => d.year);
  rolled.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return rolled.map(([year, count]) => ({ label: String(year), value: count }));
}

/* =======================================================
   App state
   ======================================================= */
const state = {
  all: [],
  query: '',
  selectedIndex: -1
};

/* =======================================================
   Filtering + rendering
   ======================================================= */
function matchesQuery(project) {
  if (!state.query) return true;
  const hay = Object.values(project).join('\n').toLowerCase();
  return hay.includes(state.query.toLowerCase());
}

function matchesSelectedYear(project, textFiltered) {
  if (state.selectedIndex === -1) return true;
  const data = toYearCounts(state.all); // year buckets from the query-only set
  const label = data[state.selectedIndex]?.label;
  return label ? String(project.year) === label : true;
}

/**
 * Draw the pie/legend based on a *base list* (usually the query-only set).
 * Selection only changes styling and filtering of cards — not the pie shape.
 */
function renderPieChart(baseListForPie) {
  const svg = d3.select('#projects-pie-plot');
  const legendUL = d3.select('.legend');

  // Clear previous
  svg.selectAll('*').remove();
  legendUL.selectAll('*').remove();

  const data = toYearCounts(baseListForPie);
  if (!data.length) return;

  const arcData = sliceGenerator(data);

  // slices (use selection only to toggle .selected class)
  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('class', i === state.selectedIndex ? 'selected' : null)
      .on('click', () => {
        state.selectedIndex = (state.selectedIndex === i) ? -1 : i;
        applyFiltersAndRerender();
      });
  });

  // legend (same indexing as slices)
  data.forEach((d, i) => {
    legendUL.append('li')
      .attr('class', `legend-item${i === state.selectedIndex ? ' selected' : ''}`)
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        state.selectedIndex = (state.selectedIndex === i) ? -1 : i;
        applyFiltersAndRerender();
      });
  });
}

/**
 * Combine filters, then render:
 * - Cards: filtered by query + selected year
 * - Pie:   based on query-only set (so wedges don't disappear)
 */
function applyFiltersAndRerender() {
  const projectsContainer = document.querySelector('.projects');

  // 1) filter by query (pie base)
  const byText = state.all.filter(matchesQuery);

  // 2) filter cards by selected year *within* query result
  const combined = byText.filter(p => matchesSelectedYear(p, byText));

  // Render cards with both filters
  renderList(combined, projectsContainer, 'h2');

  // Render pie with query-only base; selection only colors wedge
  renderPieChart(state.all);
}

/* =======================================================
   Boot
   ======================================================= */
window.addEventListener('DOMContentLoaded', async () => {
  try {
    state.all = await loadProjects();
    // Share globally for any other scripts expecting window.projects
    window.projects = state.all;

    const container = document.querySelector('.projects');
    renderList(state.all, container, 'h2');

    // Optional: update title count
    const titleEl = document.querySelector('.projects-title');
    if (titleEl) {
      const base = titleEl.dataset.baseTitle || titleEl.textContent.trim() || 'Projects';
      titleEl.dataset.baseTitle = base;
      titleEl.textContent = `${base} (${state.all.length})`;
    }

    // Initial pie render uses full set (no query yet)
    renderPieChart(state.all);

    // Search handler (live)
    const searchInput = document.querySelector('.searchBar');
    if (searchInput && !searchInput.__hasPieListener) {
      searchInput.addEventListener('input', (e) => {
        state.query = e.target.value ?? '';
        applyFiltersAndRerender();
      });
      searchInput.__hasPieListener = true;
    }
  } catch (err) {
    console.error('Failed to load projects:', err);
    const container = document.querySelector('.projects');
    if (container) {
      container.innerHTML = `<p class="error">Couldn’t load projects. Please try again later.</p>`;
    }
  }
});
