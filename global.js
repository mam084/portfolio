console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

navLinks = SS("nav a")

let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname,
);

if (currentLink) {
  currentLink.classList.add('current');
}