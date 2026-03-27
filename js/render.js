// Function to fetch JSON, grab template from DOM, and render Mustache
async function renderData(dataPath, templateId, targetId) {
    try {
        const response = await fetch(dataPath);
        const data = await response.json();

        const template = document.getElementById(templateId).innerHTML;
        const target = document.getElementById(targetId);

        const renderedHTML = Mustache.render(template, data);
        target.innerHTML = renderedHTML;

        // Re-initialize Vanilla-Tilt on new elements if applicable
        VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.2
        });

    } catch (error) {
        console.error(`Error rendering ${dataPath}:`, error);
    }
}