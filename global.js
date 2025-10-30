
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
  const res = await fetch(url, { cache: "no-store" }); // avoid stale JSON
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// Compute site base like “/portfolio/” so assets work from / and /projects/
function siteBase() {
  const parts = location.pathname.split("/").filter(Boolean); // ["portfolio", "projects", ...]
  return parts.length ? `/${parts[0]}/` : "/"; // "/portfolio/" on GH Pages repo site
}

// Resolve asset paths so "../images/..." also works on the home page
function resolveAsset(src) {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src; // absolute URL
  if (src.startsWith("/")) return src;       // already root-absolute

  // strip leading ./ or ../ segments
  const cleaned = src.replace(/^(\.\/|\.\.\/)+/, "");
  // if caller passed "images/foo.png" or "../images/foo.png", map to "/<repo>/images/foo.png"
  return siteBase() + cleaned;
}

export function renderProjects(projects, containerElement, headingLevel = "h2") {
  if (!containerElement || !(containerElement instanceof Element)) {
    console.error("renderProjects: invalid containerElement:", containerElement);
    return;
  }

  // Heading validation
  const H = new Set(["h1","h2","h3","h4","h5","h6"]).has(String(headingLevel).toLowerCase())
    ? String(headingLevel).toLowerCase()
    : "h2";

  containerElement.innerHTML = "";

  if (!Array.isArray(projects) || projects.length === 0) {
    const empty = document.createElement("p");
    empty.className = "projects-empty";
    empty.textContent = "No projects to show yet.";
    containerElement.appendChild(empty);
    return;
  }

  // Newest first when year is present; items without year sink
  const items = [...projects].sort((a, b) => {
    const ya = Number.isFinite(+a?.year) ? +a.year : -Infinity;
    const yb = Number.isFinite(+b?.year) ? +b.year : -Infinity;
    return yb - ya;
  });

  for (const p of items) {
    const article = document.createElement("article");
    article.className = "project";

    const title = p?.title ?? "Untitled Project";
    const img   = resolveAsset(p?.image ?? "images/placeholder.png");
    const desc  = p?.description ?? "";
    const url   = p?.url ?? null;
    const repo  = p?.repo ?? null;
    const year  = p?.year ?? null;

    const yearBadge = year
      ? `<span class="project-year" aria-label="Year">${year}</span>`
      : "";

    const linksHTML = `
      ${url ? `<a class="project-link demo" href="${url}" target="_blank" rel="noopener noreferrer">Live</a>` : ''}
      ${repo ? `<a class="project-link code" href="${repo}" target="_blank" rel="noopener noreferrer">Repo</a>` : ''}
    `;


    article.innerHTML = `
      <${H} class="project-title">${title} ${yearBadge}</${H}>
      <img class="project-image" src="${img}" alt="${title}" loading="lazy">

      <div class="project-body">
        ${desc ? `<p class="project-description">${desc}</p>` : ''}
        ${linksHTML ? `<div class="project-links">${linksHTML}</div>` : ''}
      </div>
    `;


    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData(username) {
  if (!username) throw new Error('fetchGitHubData: username is required');
  // Uses your existing fetchJSON helper
  return fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}
