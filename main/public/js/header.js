document.addEventListener("DOMContentLoaded", () => {

    const headerContainer = document.getElementById("header");

    if (!headerContainer) {
        return;
    }

    const isLoggedIn = !!localStorage.getItem("auth_token");

    let playHref = "/login";
    let playText = "Play Now";

    if (isLoggedIn) {
        let userRole = null;
        let userCountry = null;
        let userClass = null;

        try {
            const userJson = localStorage.getItem("user");
            if (userJson) {
                const u = JSON.parse(userJson);
                userRole = u.role;
                userCountry = u.country;
                userClass = u.education_level || u.key_stage;
            }
        } catch (e) {}

        if (userRole === 'teacher') {
            const path = window.location.pathname;
            if (path.includes('teacher-dashboard')) {
                playText = "Play Game";
                playHref = "games.html";
            } else {
                playHref = "teacher-dashboard.html";
                playText = "Dashboard";
            }
        } else {
            playHref = "dashboard.html";
            playText = "Dashboard";
        }
    }


    /* ========================================
       INSERT HEADER
    ======================================== */

    headerContainer.innerHTML = `
        <header class="site-header">

            <div class="header-inner">

                <!-- LOGO -->
                <a href="/" class="brand">
                    <img
                        src="/images/logo.png"
                        alt="Science Solitaire"
                        class="brand-logo"
                        style="
                            width:120px;
                            max-width:120px;
                            height:auto;
                            display:block;
                            object-fit:contain;
                        "
                    >
                </a>


                <!-- DESKTOP NAVIGATION -->
                <nav class="header-nav">

                    <a href="/why-solitaire">
                        Why SciSolitaire?
                    </a>

                    <span
                        style="
                            opacity:0.55;
                            cursor:not-allowed;
                            white-space:nowrap;
                        "
                    >
                        Gameplay Preview &#128274;
                    </span>

                    <a href="/curriculum">
                        Progress & Feedback
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
                        href="${playHref}"
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
                            ${playText}
                        </span>

                    </a>

                </nav>


                <!-- MOBILE HAMBURGER -->
                <button
                    class="mobile-menu-button"
                    id="mobileMenuButton"
                    type="button"
                    aria-label="Open navigation"
                    aria-expanded="false"
                    onclick="
                        const nav = document.getElementById('mobileNav');
                        const open = nav.classList.toggle('active');
                        this.setAttribute('aria-expanded', open ? 'true' : 'false');
                    "
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

            </div>


            <!-- MOBILE NAVIGATION -->
            <nav
                class="mobile-nav"
                id="mobileNav"
            >

                <a href="/why-solitaire">
                    Why SciSolitaire?
                </a>

                <span
                    style="
                        opacity:0.55;
                        cursor:not-allowed;
                    "
                >
                    Gameplay Preview &#128274;
                </span>

                <a href="/curriculum">
                    Progress & Feedback
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

                <a href="${playHref}">
                    ${playText}
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


    if (mobileMenuButton && mobileNav) {

        mobileMenuButton.addEventListener("click", () => {

            const isOpen =
                mobileNav.classList.toggle("active");

            mobileMenuButton.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        });


        mobileNav
            .querySelectorAll("a")
            .forEach((link) => {

                link.addEventListener("click", () => {

                    mobileNav.classList.remove("active");

                    mobileMenuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                });

            });

    }

});