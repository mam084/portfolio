import { fetchJSON, renderProjects, fetchGitHubData  } from './global.js'; // adjust path if needed

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