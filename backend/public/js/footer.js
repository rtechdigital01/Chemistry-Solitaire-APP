document.addEventListener("DOMContentLoaded", async () => {

    const footerContainer = document.getElementById("footer");

    if (!footerContainer) {
        return;
    }

    const response = await fetch("./components/footer.html");

    const footerHTML = await response.text();

    footerContainer.innerHTML = footerHTML;

});