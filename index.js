import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

async function loadProjects() {
  try {
    const data = await fetchJSON(`./lib/projects.json?v=${Date.now()}`);
    if (!Array.isArray(data)) throw new Error('Invalid JSON');
    return data;
  } catch (err) {
    console.error('Could not load projects.json', err);
    throw err;
  }
}

async function init() {
  try {
    const projects = await loadProjects();

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
