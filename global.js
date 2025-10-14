
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
// IMPORTANT: set this to your GH Pages repo name (yours is /portfolio/)
const BASE_PATH = isLocal ? "/" : "/portfolio/";


for (const p of pages) {
  let url = p.url;

  url = !url.startsWith("http") ? BASE_PATH + url : url;
  nav.insertAdjacentHTML("beforeend", `<a href="${url}">${p.title}</a>`);
}



const navLinks = $$("nav a");
const currentLink = navLinks.find((a) => {
  const aURL = new URL(a.href, location.origin);
  return (
    aURL.host === location.host &&
    normalizePath(aURL.pathname) === normalizePath(location.pathname)
  );
});

if (currentLink) {
  currentLink.classList.add("current");
  currentLink.setAttribute("aria-current", "page"); // accessibility
}
