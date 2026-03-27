// Global Data Store for Filtering
window.portfolioStore = {
    works: [],
    designs: []
};

// 1. Navbar Theme Observer (Only toggles the Nav, not the Body)
const themeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const nav = document.getElementById('main-nav');
            if (!nav) return;

            // Check if the section hitting the viewport has data-theme="dark"
            if (entry.target.getAttribute('data-theme') === 'dark') {
                nav.classList.add('nav-dark');
            } else {
                nav.classList.remove('nav-dark');
            }
        }
    });
}, { rootMargin: '-10% 0px -80% 0px' }); // Triggers exactly when section reaches the top nav area

// 2. Unified Data Renderer Config
const renderConfig = {
    'works-section': { url: 'data/works.json', templateId: 'works-template', targetId: 'works-grid' },
    'photography-section': { url: 'data/photography.json', templateId: 'photo-template', targetId: 'photo-gallery' },
    'design-section': { url: 'data/design.json', templateId: 'design-template', targetId: 'design-grid' },
    'video-section': { url: 'data/video.json', templateId: 'video-template', targetId: 'video-grid' },
    'music-section': { url: 'data/music.json', templateId: 'music-template', targetId: 'music-grid' }
};

// 3. Main Render Engine
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

        // --- Section Specific Pre-processing ---
        if (sectionId === 'works-section') {
            window.portfolioStore.works = data.projects;
            renderFilterButtons(data.projects, 'filter-container', 'category', 'btn-outline-light opacity-50', 'btn-light text-dark', 'handleFilter');
        }
        else if (sectionId === 'design-section') {
            window.portfolioStore.designs = data.designs.map(d => ({ ...d, isMusic: d.type === 'music' }));
            renderData = { designs: window.portfolioStore.designs };
            renderFilterButtons(data.designs, 'design-filter', 'type', 'btn-outline-light opacity-50', 'btn-light text-dark', 'filterDesign');
        }
        else if (sectionId === 'photography-section') {
            window.portfolioStore.photos = data.photos;
            renderData = { photos: data.photos };
            renderFilterButtons(data.photos, 'photo-filter', 'category', 'btn-outline-dark opacity-50', 'btn-dark text-white', 'filterPhotography');
        }

        // --- Render Mustache Template ---
        target.innerHTML = Mustache.render(template.innerHTML, renderData);

        // --- Section Specific Post-processing ---
        initTilt(target);

        if (sectionId === 'photography-section') {
            animateValue("photo-views", 0, 2500000, 2000, "M+");
            animateValue("photo-downloads", 0, 18000, 2000, "+");
        }
    } catch (error) {
        console.error(`Error rendering ${sectionId}:`, error);
    }
}

// 4. Reusable Tilt Initializer
function initTilt(container) {
    const cards = container.querySelectorAll('[data-tilt]');
    if (cards.length > 0) VanillaTilt.init(cards);
}

// 5. Unified Filter Button Generator
function renderFilterButtons(items, containerId, key, outlineClass, activeClass, clickFunc) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const categories = ['All', ...new Set(items.map(i => i[key]))];
    container.innerHTML = categories.map(cat => `
        <button class="btn btn-sm rounded-pill px-3 filter-btn-${containerId} ${cat === 'All' ? activeClass : outlineClass}" 
                onclick="${clickFunc}(this, '${cat}')">${cat}</button>
    `).join('');
}

// 6. Global Filter Actions (For HTML onclick)
window.handleFilter = (btn, category) => {
    updateFilterUI(btn, '.filter-btn-filter-container', 'btn-outline-light opacity-50', 'btn-light text-dark');
    const filtered = category === 'All' ? window.portfolioStore.works : window.portfolioStore.works.filter(p => p.category === category);

    const target = document.getElementById('works-grid');
    target.innerHTML = Mustache.render(document.getElementById('works-template').innerHTML, { projects: filtered });
    initTilt(target);
};

window.filterPhotography = (btn, category) => {
    updateFilterUI(btn, '.filter-btn-photo-filter', 'btn-outline-dark opacity-50', 'btn-dark text-white');

    const filtered = category === 'All' ? window.portfolioStore.photos : window.portfolioStore.photos.filter(p => p.category === category);
    const target = document.getElementById('photo-gallery');

    target.innerHTML = Mustache.render(document.getElementById('photo-template').innerHTML, { photos: filtered });
};

window.filterDesign = (btn, category) => {
    updateFilterUI(btn, '.filter-btn-design-filter', 'btn-outline-light', 'btn-light text-dark');
    document.querySelectorAll('.filter-btn-design-filter').forEach(b => b.classList.add('opacity-50'));
    btn.classList.remove('opacity-50');

    const filtered = category === 'All' ? window.portfolioStore.designs : window.portfolioStore.designs.filter(d => d.type === category);
    const target = document.getElementById('design-grid');
    target.innerHTML = Mustache.render(document.getElementById('design-template').innerHTML, { designs: filtered });
    initTilt(target);
};

// UI Helper for Filter Buttons
function updateFilterUI(activeBtn, selector, outlineClass, activeClass) {
    document.querySelectorAll(selector).forEach(b => {
        activeClass.split(' ').forEach(cls => b.classList.remove(cls));
        outlineClass.split(' ').forEach(cls => b.classList.add(cls));
    });
    outlineClass.split(' ').forEach(cls => activeBtn.classList.remove(cls));
    activeClass.split(' ').forEach(cls => activeBtn.classList.add(cls));
}

// 7. Stats Number Counter
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

// 8. HTMX Switchboard - Listens for injected HTML files
document.body.addEventListener('htmx:afterSwap', (evt) => {
    const path = evt.detail.pathInfo.requestPath;

    if (path.includes('works.html')) renderSection('works-section');
    if (path.includes('photography.html')) renderSection('photography-section');
    if (path.includes('design.html')) renderSection('design-section');
    if (path.includes('video.html')) renderSection('video-section');
    if (path.includes('music.html')) renderSection('music-section');

    if (path.includes('footer.html')) {
        const yearEl = document.getElementById('current-year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();
    }

    // Attach IntersectionObserver to newly swapped sections for theme switching
    document.querySelectorAll('section:not(.observed)').forEach(sec => {
        themeObserver.observe(sec);
        sec.classList.add('observed');
    });
});

// Auto-close mobile navbar when a link is clicked
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('mobile-nav-close')) {
        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse) || new bootstrap.Collapse(navbarCollapse);
            bsCollapse.hide();
        }
    }
});