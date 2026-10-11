document.addEventListener("DOMContentLoaded", async () => {

    const footerContainer = document.getElementById("footer");

    if (!footerContainer) {
        return;
    }

    try {
        const response = await fetch("/components/footer.html");
        if (response.ok) {
            const footerHTML = await response.text();
            footerContainer.innerHTML = footerHTML;
            return;
        }
    } catch (e) {}

    try {
        const response = await fetch("./components/footer.html");
        if (response.ok) {
            const footerHTML = await response.text();
            footerContainer.innerHTML = footerHTML;
        }
    } catch (e) {}

});