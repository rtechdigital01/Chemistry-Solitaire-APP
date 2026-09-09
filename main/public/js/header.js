document.addEventListener("DOMContentLoaded", () => {

    const headerContainer = document.getElementById("header");

    if (!headerContainer) {
        return;
    }


    /* ========================================
       INSERT REUSABLE HEADER
    ======================================== */

    const isAuthenticated = !!localStorage.getItem('auth_token');

    // --- ROUTE GUARDING ---
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || currentPath.includes('/forgot-password');
    const isProtectedPage = currentPath.includes('/dashboard') || currentPath.includes('/teacher-dashboard') || currentPath.includes('/games') || currentPath.includes('/gameplay');

    if (isProtectedPage && !isAuthenticated) {
        window.location.href = '/login';
        return;
    }

    if (isAuthenticated) {
        // Fetch user from backend for source of truth
        fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Accept': 'application/json'
            }
        }).then(res => res.json()).then(user => {
            if (user && user.role) {
                // Prevent authenticated users from going back to login/signup
                if (isAuthPage) {
                    window.location.href = user.role === 'teacher' ? '/teacher-dashboard' : '/dashboard';
                    return;
                }

                // Enforce Student Dashboard Access
                if (currentPath.includes('/dashboard') && !currentPath.includes('/teacher-dashboard') && user.role === 'teacher') {
                    window.location.href = '/teacher-dashboard';
                    return;
                }

                // Enforce Teacher Dashboard Access
                if (currentPath.includes('/teacher-dashboard') && user.role !== 'teacher') {
                    window.location.href = '/dashboard';
                    return;
                }
            }
        }).catch(() => {
            // If token is invalid, clear it
            localStorage.removeItem('auth_token');
            if (isProtectedPage) window.location.href = '/login';
        });
    }
    // --- END ROUTE GUARDING ---
    let authLinksDesktop = '';
    let authLinksMobile = '';

    if (isAuthenticated) {
        authLinksDesktop = `
            <a href="/dashboard" class="header-play-button">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M8 5L19 12L8 19V5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                </svg>
                <span>Dashboard</span>
            </a>
        `;
        authLinksMobile = `<a href="/dashboard">Dashboard</a>`;
    } else {
        authLinksDesktop = `
            <a href="/login">Log In</a>
            <a href="/signup" class="header-play-button" style="padding-left: 20px; padding-right: 20px;">
                <span>Sign Up</span>
            </a>
        `;
        authLinksMobile = `
            <a href="/login">Log In</a>
            <a href="/signup">Sign Up</a>
        `;
    }

    headerContainer.innerHTML = `
        <header class="site-header">

            <div class="header-inner">

                <!-- Logo -->
                <a href="/index" class="brand">

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
                    <a href="/index#why-solitaire">Why SciSolitaire?</a>
                    <a href="/index#gameplay">Gameplay Preview</a>
                    <a href="/index#send-access">Progress &amp; Feedback</a>
                    <a href="/games">Games</a>
                    ${authLinksDesktop}
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
            <nav class="mobile-nav" id="mobileNav">
                <a href="/index#why-solitaire">Why SciSolitaire?</a>
                <a href="/index#gameplay">Gameplay Preview</a>
                <a href="/index#send-access">Progress &amp; Feedback</a>
                <a href="/games">Games</a>
                ${authLinksMobile}
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