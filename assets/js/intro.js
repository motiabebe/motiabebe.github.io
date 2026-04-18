// Intro Sequence Engine
const TIMING = {
    greetingDelay: 300, terminalStart: 1000, typeSpeedCmd: 70,
    osProcessingError: 800, userReadingError: 1600, themeSwapDelay: 600,
    nameRevealDelay: 400, typeSpeedName: 70
};

document.addEventListener("DOMContentLoaded", () => {
    if (window.introHasRun) return;
    window.introHasRun = true;
    window.introSkipped = false;

    let activeTyped = null;
    let timeoutIds = [];

    const DOM = {
        greetingText: document.querySelector('#greetingText'),
        terminalContainer: document.querySelector('#terminal-container'),
        terminalLine: document.querySelector('#terminal-line'),
        finalNameContainer: document.querySelector('#final-name-container'),
        introActions: document.querySelector('#intro-actions'),
        skipBtn: document.querySelector('#skip-intro-btn')
    };

    const killCursors = () => document.querySelectorAll('.typed-cursor').forEach(c => c.remove());

    const delay = (ms) => new Promise(resolve => {
        const id = setTimeout(() => { if (!window.introSkipped) resolve(); }, ms);
        timeoutIds.push(id);
    });

    const typeCommand = (selector, text, speed, hideCursor = false) => new Promise(resolve => {
        if (window.introSkipped) return resolve();
        activeTyped = new Typed(selector, {
            strings: [text], typeSpeed: speed, showCursor: !hideCursor,
            onComplete: () => {
                killCursors();
                if (!window.introSkipped) resolve();
            }
        });
    });

    const applyThemeSwap = () => {
        document.body.classList.add('transition-theme');
        document.body.classList.replace('bg-black', 'bg-light');
        document.body.classList.replace('text-light', 'text-dark');

        const nav = document.querySelector('#main-nav');
        if (nav) nav.classList.replace('opacity-0', 'opacity-100');
        window.dispatchEvent(new Event('scroll'));
    };

    DOM.skipBtn.addEventListener('click', () => {
        if (window.introSkipped) return;
        window.introSkipped = true;

        timeoutIds.forEach(clearTimeout);
        if (activeTyped) activeTyped.destroy();
        killCursors();

        DOM.skipBtn.classList.add('d-none');
        DOM.terminalContainer.classList.add('d-none');
        DOM.greetingText.classList.remove('d-none');

        applyThemeSwap();

        DOM.finalNameContainer.classList.replace('opacity-0', 'opacity-100');
        document.getElementById('typed-name').innerHTML = "Moti Abebe";
        DOM.introActions.classList.replace('opacity-0', 'opacity-100');
    });

    const runIntroSequence = async () => {
        await delay(TIMING.greetingDelay);
        DOM.greetingText.classList.remove('d-none');

        await delay(TIMING.terminalStart);
        DOM.terminalContainer.classList.replace('opacity-0', 'opacity-100');
        DOM.terminalLine.innerHTML = `<span class="text-success">visitor@portfolio:~$</span> <span id="t-1"></span>`;

        await typeCommand('#t-1', "echo $namr;", TIMING.typeSpeedCmd);
        await delay(TIMING.osProcessingError);

        DOM.terminalLine.innerHTML = `<span class="text-danger">bash: namr: unbound variable</span>`;
        await delay(TIMING.userReadingError);

        DOM.terminalLine.innerHTML = `<span class="text-success">visitor@portfolio:~$</span> <span id="t-2"></span>`;
        await typeCommand('#t-2', "echo $name;", TIMING.typeSpeedCmd);
        await delay(TIMING.themeSwapDelay);

        DOM.terminalContainer.classList.replace('opacity-100', 'opacity-0');
        applyThemeSwap();
        await delay(TIMING.nameRevealDelay);

        DOM.terminalContainer.classList.add('d-none');
        DOM.finalNameContainer.classList.replace('opacity-0', 'opacity-100');
        await typeCommand('#typed-name', "Moti Abebe", TIMING.typeSpeedName, true);

        DOM.skipBtn.classList.add('d-none');
        await delay(700);
        DOM.introActions.classList.replace('opacity-0', 'opacity-100');
    };

    runIntroSequence();
});