document.addEventListener("DOMContentLoaded", () => {

    const headerContainer =
        document.getElementById("header");

    if (!headerContainer) {
        return;
    }

    const isLoggedIn =
        !!localStorage.getItem("auth_token");


    /* ========================================
       INSERT REUSABLE HEADER
    ======================================== */

    headerContainer.innerHTML = `
        <header class="site-header">

            <div class="header-inner">

                <!-- Logo -->
                <a href="/" class="brand">

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

                    <span>Science Solitaire</span>

                </a>


                <!-- Desktop Navigation -->
                <nav class="header-nav">

                    <a href="/why-solitaire">
                        Why SciSolitaire?
                    </a>

                    <a href="/gameplay">
                        Gameplay Preview
                    </a>

                    <a href="/curriculum">
                        Science Curriculum
                    </a>

                    <a href="/about">
                        About
                    </a>

                    ${
                        !isLoggedIn
                            ? `
                                <a href="/login">
                                    Log In
                                </a>
                            `
                            : ""
                    }

                    <a
                        href="${isLoggedIn ? "/dashboard" : "/login"}"
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

                        <span>
                            ${isLoggedIn ? "Dashboard" : "Play Now"}
                        </span>

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

                <a href="/why-solitaire">
                    Why SciSolitaire?
                </a>

                <a href="/gameplay">
                    Gameplay Preview
                </a>

                <a href="/curriculum">
                    Science Curriculum
                </a>

                <a href="/about">
                    About
                </a>

                ${
                    !isLoggedIn
                        ? `
                            <a href="/login">
                                Log In
                            </a>
                        `
                        : ""
                }

                <a href="${isLoggedIn ? "/dashboard" : "/login"}">
                    ${isLoggedIn ? "Dashboard" : "Play Now"}
                </a>

            </nav>

        </header>
    `;


    /* ========================================
       MOBILE MENU
    ======================================== */

    const mobileMenuButton =
        headerContainer.querySelector(
            "#mobileMenuButton"
        );

    const mobileNav =
        headerContainer.querySelector(
            "#mobileNav"
        );


    if (!mobileMenuButton || !mobileNav) {
        return;
    }


    mobileMenuButton.addEventListener(
        "click",
        () => {

            const isOpen =
                mobileNav.classList.toggle(
                    "active"
                );

            mobileMenuButton.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        }
    );


    mobileNav
        .querySelectorAll("a")
        .forEach((link) => {

            link.addEventListener(
                "click",
                () => {

                    mobileNav.classList.remove(
                        "active"
                    );

                    mobileMenuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        });

});