document.addEventListener("DOMContentLoaded", () => {

    const headerContainer = document.getElementById("header");

    if (!headerContainer) {
        return;
    }


    /* ========================================
       INSERT REUSABLE HEADER
    ======================================== */

    headerContainer.innerHTML = `
        <header class="site-header">

            <div class="header-inner">

                <!-- Logo -->
                <a href="./index.html" class="brand">

                    <div class="brand-icon">

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="3"
                                stroke="currentColor"
                                stroke-width="1.8"
                            />

                            <ellipse
                                cx="12"
                                cy="12"
                                rx="9"
                                ry="4"
                                stroke="currentColor"
                                stroke-width="1.5"
                            />

                            <ellipse
                                cx="12"
                                cy="12"
                                rx="9"
                                ry="4"
                                transform="rotate(60 12 12)"
                                stroke="currentColor"
                                stroke-width="1.5"
                            />

                            <ellipse
                                cx="12"
                                cy="12"
                                rx="9"
                                ry="4"
                                transform="rotate(120 12 12)"
                                stroke="currentColor"
                                stroke-width="1.5"
                            />
                        </svg>

                    </div>

                    <span>Chemistry Solitaire</span>

                </a>


                <!-- Desktop Navigation -->
                <nav class="header-nav">

                    <a href="./index.html#why-solitaire">
                        Why Solitaire?
                    </a>

                    <a href="./index.html#gameplay">
                        Gameplay Preview
                    </a>

                    <a href="./index.html#send-access">
                        SEND &amp; Access
                    </a>

                    <a href="./index.html#about">
                        About
                    </a>

                    <a href="./login.html">
                        Log In
                    </a>


                    <a
                        href="./index.html#demo"
                        class="header-play-button"
                    >

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <path
                                d="M8 5L19 12L8 19V5Z"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linejoin="round"
                            />
                        </svg>

                        <span>Play Now</span>

                    </a>

                </nav>


                <!-- Hamburger -->
                <button
                    class="mobile-menu-button"
                    id="mobileMenuButton"
                    type="button"
                    aria-label="Open navigation"
                    aria-expanded="false"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

            </div>


            <!-- Mobile Navigation -->
            <nav
                class="mobile-nav"
                id="mobileNav"
            >

                <a href="./index.html#why-solitaire">
                    Why Solitaire?
                </a>

                <a href="./index.html#gameplay">
                    Gameplay Preview
                </a>

                <a href="./index.html#send-access">
                    SEND &amp; Access
                </a>

                <a href="./index.html#about">
                    About
                </a>

                <a href="./login.html">
                    Log In
                </a>

                <a href="./index.html#demo">
                    Play Now
                </a>

            </nav>

        </header>
    `;


    /* ========================================
       MOBILE MENU
    ======================================== */

    const mobileMenuButton =
        headerContainer.querySelector("#mobileMenuButton");

    const mobileNav =
        headerContainer.querySelector("#mobileNav");


    if (!mobileMenuButton || !mobileNav) {
        return;
    }


    mobileMenuButton.addEventListener("click", () => {

        const isOpen =
            mobileNav.classList.toggle("active");

        mobileMenuButton.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

    });


    /* Close after selecting a link */

    mobileNav.querySelectorAll("a").forEach((link) => {

        link.addEventListener("click", () => {

            mobileNav.classList.remove("active");

            mobileMenuButton.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });

});