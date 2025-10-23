
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


const pages = [
  { url: "https://mam084.github.io/portfolio/",          title: "Home" },
  { url: "https://mam084.github.io/portfolio/projects/", title: "Projects" },
  { url: "https://mam084.github.io/portfolio/CV/",       title: "Resume" },
  { url: "https://mam084.github.io/portfolio/contact/",  title: "Contact" },
  { url: "https://github.com/mam084/", title: "GitHub Profile" }, // external
];


const nav = document.createElement("nav");
document.body.prepend(nav);


const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

const BASE_PATH = isLocal ? "/" : "/portfolio/";


for (const p of pages) {
  let url = p.url;

  url = !url.startsWith("http") ? BASE_PATH + url : url;
  let a = document.createElement('a');
  a.href = url;
  a.textContent = p.title;
  
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-select" aria-label="Color scheme">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
`
);


const select = document.querySelector("#theme-select");
const root = document.documentElement;


const saved = localStorage.getItem("color-scheme") || "light dark";
select.value = saved;
root.style.setProperty("color-scheme", saved);

select.addEventListener("input", (e) => {
  const value = e.target.value;
  root.style.setProperty("color-scheme", value);
  localStorage.setItem("color-scheme", value);
});

const mql = window.matchMedia("(prefers-color-scheme: dark)");
mql.addEventListener?.("change", () => {
  if (select.value === "light dark") {
    root.style.setProperty("color-scheme", "light dark");
  }
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
    throw error;
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement || !(containerElement instanceof Element)) {
    console.error('renderProjects: invalid containerElement:', containerElement);
    return;
  }

  // Validate heading level
  const validHeadings = new Set(['h1','h2','h3','h4','h5','h6']);
  const H = validHeadings.has(String(headingLevel).toLowerCase())
    ? String(headingLevel).toLowerCase()
    : 'h2';

  // Clear previous content so re-renders don’t duplicate
  containerElement.innerHTML = '';

  // Handle empty arrays
  if (!Array.isArray(projects) || projects.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'projects-empty';
    empty.textContent = 'No projects to show yet.';
    containerElement.appendChild(empty);
    return;
  }

  // Render each project
  for (const project of projects) {
    const article = document.createElement('article');

    // Fallbacks for missing fields
    const title = project?.title ?? 'Untitled Project';
    const img   = project?.image ?? 'https://via.placeholder.com/600x400?text=No+Image';
    const desc  = project?.description ?? 'No description provided.';

    article.innerHTML = `
      <${H} class="project-title">${title}</${H}>
      <img class="project-image" src="${img}" alt="${title}">
      <p class="project-description">${desc}</p>
    `;

    containerElement.appendChild(article);
  }
}