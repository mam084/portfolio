console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}


let pages = [
    { url: 'https://mam084.github.io/portfolio/', title: 'Home' },
    { url: 'https://mam084.github.io/portfolio/projects/', title: 'Projects' },
    { url: 'https://mam084.github.io/portfolio/CV', title: 'Resume' },
    { url: 'https://mam084.github.io/portfolio/projects/contact', title: 'Contact' },
    { url: 'https://github.com/mam084', title: 'GitHub Profile' },
];

const BASE_PATH = location.hostname === 'localhost' || location.hostname === '127.0.0.1'? '/' : '/website/'; // GitHub Pages repo name

let nav = document.createElement('nav');
document.body.prepend(nav);


for (let p of pages) {
    let url = p.url;
    let title = p.title;

    url = !url.startsWith('http') ? BASE_PATH + url : url;

    nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}


navLinks = $$("nav a")

let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname,
);

if (currentLink) {
    currentLink.classList.add('current');
}