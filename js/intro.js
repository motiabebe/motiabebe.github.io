const TIMING = {
    greetingDelay: 300,         // Wait before "Hi, I'm" appears
    terminalStart: 1000,        // Wait before terminal fades in
    osProcessingError: 800,     // System delay before spitting out the error
    userReadingError: 1600,     // Time the user stares at the error before typing again
    themeSwapDelay: 600,        // Pause after correct command before shifting to white
    nameRevealDelay: 400,       // Pause after white screen before typing Name

    // Typing speeds
    typeSpeedCmd: 50,           // Speed of terminal typing
    typeSpeedName: 70           // Speed of name typing
};

document.addEventListener("DOMContentLoaded", () => {
    if (window.introHasRun) return;
    window.introHasRun = true;

    const greetingText = document.querySelector('#greetingText');
    const terminalContainer = document.querySelector('#terminal-container');
    const terminalLine = document.querySelector('#terminal-line');
    const finalNameContainer = document.querySelector('#final-name-container');
    const introActions = document.querySelector('#intro-actions');

    // Helper to brutally kill the blinking cursors
    const killCursors = () => document.querySelectorAll('.typed-cursor').forEach(c => c.remove());

    // 1. Greeting appears
    setTimeout(() => {
        greetingText.classList.remove('d-none');
    }, TIMING.greetingDelay);

    // 2. Terminal starts
    setTimeout(() => {
        terminalContainer.classList.replace('opacity-0', 'opacity-100');

        terminalLine.innerHTML = `<span class="text-success">visitor@portfolio:~$</span> <span id="t-1"></span>`;

        new Typed('#t-1', {
            strings: ["echo $namr;"],
            typeSpeed: TIMING.typeSpeedCmd,
            onComplete: () => {
                killCursors();
                // We DO NOT use typed.destroy() here, as it clears the text!

                // Show Error
                setTimeout(() => {
                    terminalLine.innerHTML = `<span class="text-danger">bash: namr: unbound variable</span>`;

                    // Show next prompt and correct command
                    setTimeout(() => {
                        terminalLine.innerHTML = `<span class="text-success">visitor@portfolio:~$</span> <span id="t-2"></span>`;

                        new Typed('#t-2', {
                            strings: ["echo $name;"],
                            typeSpeed: TIMING.typeSpeedCmd,
                            onComplete: () => {
                                killCursors();

                                // Transition to white theme
                                setTimeout(triggerThemeTransition, TIMING.themeSwapDelay);
                            }
                        });

                    }, TIMING.userReadingError);
                }, TIMING.osProcessingError);
            }
        });

    }, TIMING.terminalStart);

    // 3. Theme Transition Logic
    function triggerThemeTransition() {
        terminalContainer.classList.replace('opacity-100', 'opacity-0');

        document.body.classList.add('transition-theme');
        document.body.classList.replace('bg-black', 'bg-light');
        document.body.classList.replace('text-light', 'text-dark');

        const nav = document.querySelector('#main-nav');
        if (nav) nav.classList.replace('opacity-0', 'opacity-100');

        setTimeout(() => {
            // Remove terminal completely from the DOM flow
            terminalContainer.classList.add('d-none');

            // Reveal name container
            finalNameContainer.classList.replace('opacity-0', 'opacity-100');
            document.getElementById('typed-name').innerHTML = "";
            killCursors();

            // Type Name
            new Typed('#typed-name', {
                strings: ["Moti Abebe"],
                typeSpeed: TIMING.typeSpeedName,
                showCursor: false,
                onComplete: (self) => {
                    setTimeout(() => {
                        if (self.cursor) self.cursor.remove();
                        killCursors();

                        // Reveal actions
                        introActions.classList.replace('opacity-0', 'opacity-100');
                    }, 500);
                }
            });

        }, TIMING.nameRevealDelay);
    }
});