import { fetchJSON, renderProjects, fetchGitHubData } from "./global.js";

async function loadProjects() {
  const data = await fetchJSON(`./lib/projects.json?v=${Date.now()}`);
  if (!Array.isArray(data)) throw new Error("Invalid projects.json format");
  return data;
}

async function init() {
  // ---- Homepage projects ----
  try {
    const projects = await loadProjects();

    const container = document.querySelector(".projects");
    if (!container) throw new Error("Missing .projects container on page");

    const featured = projects.filter((p) => p.featured);

    // If fewer than 3 featured, fall back to newest 3 by year
    const toShow =
      featured.length >= 3
        ? featured.slice(0, 3)
        : projects
            .slice()
            .sort((a, b) => (+(b?.year ?? -Infinity)) - (+(a?.year ?? -Infinity)))
            .slice(0, 3);

    renderProjects(toShow, container, "h3");
  } catch (err) {
    console.error("Failed to load projects on home:", err);
  }

  // ---- GitHub stats (optional section) ----
  try {
    const githubData = await fetchGitHubData("mam084");
    const profileStats = document.querySelector("#profile-stats");
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
    console.error("GitHub stats failed:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
