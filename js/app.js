document.addEventListener("DOMContentLoaded", () => {

    /* ========================================
       REVEAL ANIMATION
    ======================================== */

    const revealElements =
        document.querySelectorAll(".reveal");


    const revealObserver =
        new IntersectionObserver(

            (entries, observer) => {

                entries.forEach((entry) => {

                    if (!entry.isIntersecting) {
                        return;
                    }

                    const element = entry.target;

                    const delay =
                        Number(element.dataset.delay || 0);


                    setTimeout(() => {

                        element.classList.add("reveal-active");

                    }, delay);


                    observer.unobserve(element);

                });

            },

            {
                threshold: 0.15
            }

        );


    revealElements.forEach((element) => {

        revealObserver.observe(element);

    });



    /* ========================================
       MOBILE NAVIGATION
    ======================================== */

    const mobileMenuButton =
        document.getElementById("mobileMenuButton");

    const mobileNav =
        document.getElementById("mobileNav");


    if (mobileMenuButton && mobileNav) {

        mobileMenuButton.addEventListener("click", () => {

            const isOpen =
                mobileNav.classList.toggle("active");

            mobileMenuButton.setAttribute(
                "aria-expanded",
                isOpen
            );

        });


        // Close mobile menu after clicking a link
        mobileNav.querySelectorAll("a").forEach((link) => {

            link.addEventListener("click", () => {

                mobileNav.classList.remove("active");

                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });

    }


    /* ========================================
   PASSWORD VISIBILITY
======================================== */

const passwordInput =
    document.getElementById("password");

const passwordToggle =
    document.getElementById("passwordToggle");


if (passwordInput && passwordToggle) {

    passwordToggle.addEventListener("click", () => {

        const passwordIsHidden =
            passwordInput.type === "password";


        passwordInput.type =
            passwordIsHidden ? "text" : "password";


        passwordToggle.setAttribute(
            "aria-label",
            passwordIsHidden
                ? "Hide password"
                : "Show password"
        );

    });

}


/* ========================================
   PROFILE SETUP
======================================== */
/* ========================================
   PROFILE SETUP
======================================== */

const avatarOptions =
    document.querySelectorAll(".avatar-option");

const displayNameInput =
    document.getElementById("displayName");

const previewName =
    document.getElementById("previewName");

const previewAvatar =
    document.querySelector(".profile-preview-avatar");

const uploadAvatarButton =
    document.getElementById("uploadAvatarButton");

const avatarFileInput =
    document.getElementById("avatarFileInput");

const avatarUploadPreview =
    document.getElementById("avatarUploadPreview");


/* ========================================
   STANDARD AVATAR SELECTION
======================================== */

avatarOptions.forEach((option) => {

    option.addEventListener("click", () => {

        /* Upload button is handled separately */
        if (option.id === "uploadAvatarButton") {
            return;
        }


        avatarOptions.forEach((item) => {

            item.classList.remove("active");

            item.setAttribute(
                "aria-pressed",
                "false"
            );

        });


        option.classList.add("active");

        option.setAttribute(
            "aria-pressed",
            "true"
        );


        const selectedEmoji =
            option.querySelector(".avatar-emoji");


        if (selectedEmoji && previewAvatar) {

            previewAvatar.innerHTML =
                selectedEmoji.textContent;

        }

    });

});


/* ========================================
   OPEN IMAGE PICKER
======================================== */

if (uploadAvatarButton && avatarFileInput) {

    uploadAvatarButton.addEventListener("click", () => {

        avatarFileInput.click();

    });

}


/* ========================================
   HANDLE UPLOADED IMAGE
======================================== */

if (avatarFileInput) {

    avatarFileInput.addEventListener("change", (event) => {

        const file =
            event.target.files[0];


        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {
            return;
        }


        const reader = new FileReader();


        reader.addEventListener("load", () => {

            const imageURL =
                reader.result;


            /* Remove other selected avatars */

            avatarOptions.forEach((item) => {

                item.classList.remove("active");

                item.setAttribute(
                    "aria-pressed",
                    "false"
                );

            });


            /* Select custom photo */

            uploadAvatarButton.classList.add("active");

            uploadAvatarButton.setAttribute(
                "aria-pressed",
                "true"
            );


            /* Show photo inside upload card */

            avatarUploadPreview.innerHTML = `
                <img
                    src="${imageURL}"
                    alt="Selected profile photo"
                >
            `;


            /* Show photo in profile preview */

            if (previewAvatar) {

                previewAvatar.innerHTML = `
                    <img
                        src="${imageURL}"
                        alt="Profile preview"
                    >
                `;

            }

        });


        reader.readAsDataURL(file);

    });

}


/* ========================================
   LIVE DISPLAY NAME PREVIEW
======================================== */

if (displayNameInput && previewName) {

    displayNameInput.addEventListener("input", () => {

        const name =
            displayNameInput.value.trim();


        previewName.textContent =
            name || "Your Name";

    });

}

/* ========================================
   SUBMIT PROFILE SETUP
======================================== */
const submitProfileBtn = document.getElementById("submitProfileBtn");

if (submitProfileBtn) {
    submitProfileBtn.addEventListener("click", async () => {
        // Find selected avatar
        const selectedAvatarOption = document.querySelector(".avatar-option.active");
        let avatarValue = "chemist"; // Default
        
        if (selectedAvatarOption) {
            if (selectedAvatarOption.id === "uploadAvatarButton") {
                const img = document.querySelector("#avatarUploadPreview img");
                avatarValue = img ? img.src : "chemist"; // Base64 or default
            } else {
                avatarValue = selectedAvatarOption.getAttribute("data-avatar") || "chemist";
            }
        }

        const displayName = displayNameInput ? displayNameInput.value.trim() : "Learner";

        // Optional: show loading state on button
        const originalText = submitProfileBtn.innerHTML;
        submitProfileBtn.innerHTML = "<span>Saving...</span>";
        submitProfileBtn.disabled = true;

        try {
            // Attempt to send to backend if it's running
            const response = await fetch("http://localhost:8000/api/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    // Use token if available
                    "Authorization": "Bearer " + (localStorage.getItem("auth_token") || "")
                },
                body: JSON.stringify({
                    display_name: displayName,
                    avatar: avatarValue
                })
            });

            if (response.ok || response.status === 404 || response.status === 401) {
                // If the endpoint isn't fully ready (404) or user is not fully authenticated (401), we'll still proceed for the frontend demo
                localStorage.setItem("user_display_name", displayName);
                localStorage.setItem("user_avatar", avatarValue);
                
                // Redirect to dashboard
                window.location.href = "./dashboard.html";
            } else {
                alert("Something went wrong saving your profile.");
                submitProfileBtn.innerHTML = originalText;
                submitProfileBtn.disabled = false;
            }

        } catch (error) {
            // If backend is entirely unreachable, still fallback for demo purposes
            console.warn("Backend not reachable. Saving to localStorage and proceeding to dashboard.");
            localStorage.setItem("user_display_name", displayName);
            localStorage.setItem("user_avatar", avatarValue);
            window.location.href = "./dashboard.html";
        }
    });
}

/* ========================================
   MOCK LOGIN / SIGNUP HANDLING
======================================== */
const loginForm = document.querySelector(".login-form");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        // Prevent default submission to action URL
        e.preventDefault();
        
        // Mock setting an auth token
        localStorage.setItem("auth_token", "demo-token-12345");
        
        // Redirect to dashboard
        window.location.href = "./dashboard.html";
    });
}

const signupForm = document.querySelector(".signup-form");
if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        localStorage.setItem("auth_token", "demo-token-12345");
        
        // Redirect to profile setup first
        window.location.href = "./profile-setup.html";
    });
}

});