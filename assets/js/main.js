// Global Data & Configuration
window.portfolioStore = { works: [], photos: [], designs: [] };

const renderConfig = {
    'works-section': { url: 'data/works.json', templateId: 'works-template', targetId: 'works-grid' },
    'photography-section': { url: 'data/photography.json', templateId: 'photo-template', targetId: 'photo-gallery' },
    'design-section': { url: 'data/design.json', templateId: 'design-template', targetId: 'design-grid' },
    'video-section': { url: 'data/video.json', templateId: 'video-template', targetId: 'video-grid' },
    'music-section': { url: 'data/music.json', templateId: 'music-template', targetId: 'music-grid' }
};

// Intersection Observers
const themeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const nav = document.getElementById('main-nav');
            if (nav) entry.target.getAttribute('data-theme') === 'dark' ? nav.classList.add('nav-dark') : nav.classList.remove('nav-dark');
        }
    });
}, { rootMargin: '-10% 0px -80% 0px' });

const mediaObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;

            if (el.tagName === 'IMG' && el.hasAttribute('data-src')) {
                el.onload = () => el.classList.add('loaded');
                el.src = el.getAttribute('data-src');
                el.removeAttribute('data-src');
            }

            if (el.classList.contains('lazy-video')) {
                const vidId = el.getAttribute('data-videoid');
                if (vidId) {
                    const yt = document.createElement('lite-youtube');
                    yt.setAttribute('videoid', vidId);
                    if (el.getAttribute('data-class')) yt.className = el.getAttribute('data-class');
                    if (el.getAttribute('data-style')) yt.style.cssText = el.getAttribute('data-style');
                    el.parentNode.replaceChild(yt, el);
                }
            }
            observer.unobserve(el);
        }
    });
}, { rootMargin: '300px 0px' });

const scrollAnimationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            if (el.classList.contains('observe-animate')) {
                el.classList.remove('opacity-0');
                el.classList.add('animate__animated', el.getAttribute('data-animate-class') || 'animate__fadeInUp');
            }
            if (el.classList.contains('observe-typed') && el.hasAttribute('data-typed-string')) {
                new Typed(el, {
                    strings: [el.getAttribute('data-typed-string')],
                    typeSpeed: parseInt(el.getAttribute('data-typed-speed'), 10) || 40,
                    showCursor: false
                });
            }
            observer.unobserve(el);
        }
    });
}, { threshold: 0.25 });

// Core Engines (Render & Filter)
async function renderSection(sectionId) {
    const config = renderConfig[sectionId];
    if (!config) return;

    const target = document.getElementById(config.targetId);
    const template = document.getElementById(config.templateId);
    if (!target || !template) return;

    try {
        const response = await fetch(config.url);
        const data = await response.json();
        let renderData = data;

        if (sectionId === 'works-section') {
            window.portfolioStore.works = data.projects;
            renderFilterButtons(data.projects, 'filter-container', 'category', 'btn-outline-light opacity-50', 'btn-light text-dark', 'handleFilter');

        } else if (sectionId === 'design-section') {
            window.portfolioStore.designs = data.designs.map(d => ({ ...d, isMusic: d.type === 'music' }));
            renderData = { designs: window.portfolioStore.designs };
            renderFilterButtons(data.designs, 'design-filter', 'type', 'btn-outline-light opacity-50', 'btn-light text-dark', 'filterDesign');
        } else if (sectionId === 'photography-section') {
            window.portfolioStore.photos = data.photos;
            renderFilterButtons(data.photos, 'photo-filter', 'category', 'btn-outline-dark opacity-50', 'btn-dark text-white', 'filterPhotography');
            const pressTarget = document.getElementById('press-gallery');
            const pressTemplate = document.getElementById('press-template');
            if (pressTarget && pressTemplate) {
                pressTarget.innerHTML = Mustache.render(pressTemplate.innerHTML, data);
                pressTarget.querySelectorAll('.lazy-image').forEach(el => mediaObserver.observe(el));
            }
        }

        target.innerHTML = Mustache.render(template.innerHTML, renderData);

        initTilt(target);
        target.querySelectorAll('.observe-animate, .observe-typed').forEach(el => scrollAnimationObserver.observe(el));
        target.querySelectorAll('.lazy-image, .lazy-video').forEach(el => mediaObserver.observe(el));

        if (sectionId === 'photography-section') {
            animateValue("photo-views", 0, 2500000, 2000, "M+");
            animateValue("photo-downloads", 0, 18000, 2000, "+");
        }
    } catch (error) {
        console.error(`Error rendering ${sectionId}:`, error);
    }
}

function processFilter(activeBtn, category, storeKey, renderProp, targetId, templateId, filterClass, outlineClass, activeClass, filterKey, extraUI = null) {
    document.querySelectorAll(filterClass).forEach(b => {
        activeClass.split(' ').forEach(cls => b.classList.remove(cls));
        outlineClass.split(' ').forEach(cls => b.classList.add(cls));
    });
    outlineClass.split(' ').forEach(cls => activeBtn.classList.remove(cls));
    activeClass.split(' ').forEach(cls => activeBtn.classList.add(cls));

    if (extraUI) extraUI(activeBtn);

    const allData = window.portfolioStore[storeKey];
    const filtered = category === 'All' ? allData : allData.filter(i => i[filterKey] === category);
    const target = document.getElementById(targetId);

    const currentHeight = target.offsetHeight;
    target.style.height = currentHeight + 'px';
    target.style.overflow = 'hidden';

    target.innerHTML = Mustache.render(document.getElementById(templateId).innerHTML, { [renderProp]: filtered });

    requestAnimationFrame(() => {
        target.style.transition = 'height 0.4s ease-in-out';
        target.style.height = target.scrollHeight + 'px';

        setTimeout(() => {
            target.style.height = 'auto';
            target.style.overflow = 'visible';
            target.style.transition = 'none';
        }, 400);
    });

    initTilt(target);
    target.querySelectorAll('.observe-animate').forEach(el => scrollAnimationObserver.observe(el));
    target.querySelectorAll('.lazy-image').forEach(img => mediaObserver.observe(img));
}

// Utilities & Bindings
function initTilt(container) {
    const cards = container.querySelectorAll('[data-tilt]');
    if (cards.length > 0) VanillaTilt.init(cards);
}

function renderFilterButtons(items, containerId, key, outlineClass, activeClass, clickFunc) {
    const categories = ['All', ...new Set(items.map(i => i[key]))];
    document.getElementById(containerId).innerHTML = categories.map(cat =>
        `<button class="btn btn-sm rounded-pill px-3 filter-btn-${containerId} ${cat === 'All' ? activeClass : outlineClass}" onclick="${clickFunc}(this, '${cat}')">${cat}</button>`
    ).join('');
}

function animateValue(id, start, end, duration, suffix = "") {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        let val = Math.floor(progress * (end - start) + start);

        if (val >= 1000000) obj.innerHTML = (val / 1000000).toFixed(1) + suffix;
        else if (val >= 1000) obj.innerHTML = (val / 1000).toFixed(0) + "K" + suffix;
        else obj.innerHTML = val + suffix;

        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

window.handleFilter = (btn, cat) => processFilter(btn, cat, 'works', 'projects', 'works-grid', 'works-template', '.filter-btn-filter-container', 'btn-outline-light opacity-50', 'btn-light text-dark', 'category');
window.filterPhotography = (btn, cat) => processFilter(btn, cat, 'photos', 'photos', 'photo-gallery', 'photo-template', '.filter-btn-photo-filter', 'btn-outline-dark opacity-50', 'btn-dark text-white', 'category');
window.filterDesign = (btn, cat) => processFilter(btn, cat, 'designs', 'designs', 'design-grid', 'design-template', '.filter-btn-design-filter', 'btn-outline-light', 'btn-light text-dark', 'type', (b) => {
    document.querySelectorAll('.filter-btn-design-filter').forEach(btn => btn.classList.add('opacity-50'));
    b.classList.remove('opacity-50');
});

// Global Event Listeners
document.body.addEventListener('htmx:afterSwap', (evt) => {
    const path = evt.detail.pathInfo.requestPath;
    const sectionRoutes = {
        'works.html': 'works-section',
        'photography.html': 'photography-section',
        'design.html': 'design-section',
        'video.html': 'video-section',
        'music.html': 'music-section'
    };

    for (const [route, id] of Object.entries(sectionRoutes)) {
        if (path.includes(route)) renderSection(id);
    }

    if (path.includes('footer.html')) {
        const yearEl = document.getElementById('current-year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
    }

    document.querySelectorAll('.lazy-image, .lazy-video').forEach(el => {
        mediaObserver.observe(el);
    });

    document.querySelectorAll('section:not(.observed-theme)').forEach(sec => {
        themeObserver.observe(sec);
        sec.classList.add('observed-theme');
    });

    document.querySelectorAll('.observe-animate:not(.observed-anim), .observe-typed:not(.observed-anim)').forEach(el => {
        scrollAnimationObserver.observe(el);
        el.classList.add('observed-anim');
    });
});

document.body.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');

    if (href.startsWith('#')) {
        const targetElement = document.querySelector(href);
        if (targetElement && href !== '#') {
            e.preventDefault();
            const navOffset = 100;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }

        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse?.classList.contains('show')) {
            bootstrap.Collapse.getInstance(navbarCollapse)?.hide();
        }
        return;
    }

    const trackedDomains = ['ticker.et', 'ibex-waves', 'faydalink', 'zelan-studios', 'tv-guidelines', 'kulu-group'];
    const isTracked = trackedDomains.some(domain => href.includes(domain));

    if (isTracked) {
        e.preventDefault();

        const utm = new URLSearchParams({
            utm_source: 'portfolio',
            utm_medium: 'referral',
            utm_campaign: 'v2',
            utm_content: anchor.innerText.trim().toLowerCase().replace(/\s+/g, '_')
        });

        const finalUrl = href.includes('?')
            ? `${href}&${utm.toString()}`
            : `${href}?${utm.toString()}`;

        window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }
});

let ticking = false;
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    let currentSectionId = "";

    sections.forEach(section => {
        if (window.scrollY >= (section.offsetTop - 200)) currentSectionId = section.getAttribute('id');
    });

    navLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        link.classList.remove('active-nav');
        if (currentSectionId === href || currentSectionId === href + "-section" || (currentSectionId && currentSectionId.includes(href))) {
            link.classList.add('active-nav');
        }
    });

    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const nameContainer = document.getElementById('final-name-container');
            const introActions = document.getElementById('intro-actions');
            const isMobile = window.innerWidth < 768;

            if (scrollY < window.innerHeight) {
                if (nameContainer) {
                    nameContainer.style.transform = `scale(${1 + scrollY * (isMobile ? 0.0004 : 0.0015)})`;
                    nameContainer.style.opacity = Math.max(1 - (scrollY * 0.002), 0);
                }
                if (introActions) {
                    introActions.style.transform = `translateY(${scrollY * (isMobile ? 0.1 : 0.3)}px)`;
                    introActions.style.opacity = Math.max(1 - (scrollY * 0.003), 0);
                }
            }
            ticking = false;
        });
        ticking = true;
    }
});