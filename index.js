import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// same paths but rooted for home
const CANDIDATES = [
  './projects.json',       // main fallback
  './lib/projects.json'
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
  throw lastErr ?? new Error('Could not load projects.json');
}

async function init() {
  try {
    const projects = await loadProjects();

    // Newest first is already handled inside render; just pick first N
    const latest = projects
      .slice()
      .sort((a, b) => (+(b?.year ?? -Infinity)) - (+(a?.year ?? -Infinity)))
      .slice(0, 3);

    const container = document.querySelector('.projects');
    renderProjects(latest, container, 'h3');
  } catch (err) {
    console.error('Failed to load projects on home:', err);
  }

  try {
    const githubData = await fetchGitHubData('mam084');
    const profileStats = document.querySelector('#profile-stats');
    if (profileStats) {
      profileStats.innerHTML = `
        <h2 class="profile-stats__title">GitHub Profile</h2>
        <dl class="profile-stats__grid">
          <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers</dt><dd>${githubData.followers}</dd>
          <dt>Following</dt><dd>${githubData.following}</dd>
        </dl>
      `;
    }
  } catch (err) {
    console.error('GitHub stats failed:', err);
    const profileStats = document.querySelector('#profile-stats');
    if (profileStats) {
      profileStats.innerHTML = `
        <h2 class="profile-stats__title">GitHub Profile</h2>
        <p class="error">Couldn’t load GitHub stats right now.</p>
      `;
    }
  }
}

// ✅ Run init once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
