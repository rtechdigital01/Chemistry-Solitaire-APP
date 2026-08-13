document.addEventListener("DOMContentLoaded", async () => {

    const headerContainer = document.getElementById("header");

    if (!headerContainer) {
        return;
    }

    const response = await fetch("./components/header.html");

    const headerHTML = await response.text();

    headerContainer.innerHTML = headerHTML;

});