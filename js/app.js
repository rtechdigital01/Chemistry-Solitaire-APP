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

            if (response.ok) {
                // If the endpoint is fully ready and successful
                localStorage.setItem("user_display_name", displayName);
                localStorage.setItem("user_avatar", avatarValue);
                
                // Redirect to dashboard
                window.location.href = "./dashboard.html";
            } else {
                alert("Something went wrong saving your profile. Make sure you are logged in.");
                submitProfileBtn.innerHTML = originalText;
                submitProfileBtn.disabled = false;
            }

        } catch (error) {
            console.error(error);
            alert("Backend not reachable. Ensure the server is running.");
            submitProfileBtn.innerHTML = originalText;
            submitProfileBtn.disabled = false;
        }
    });
}

/* ========================================
   REAL LOGIN / SIGNUP HANDLING
======================================== */
const authForm = document.querySelector(".login-form");

if (authForm) {
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const isSignup = !!document.getElementById('firstName');
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        
        const submitBtn = authForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = "<span>Please wait...</span>";
        submitBtn.disabled = true;

        try {
            let endpoint = "http://localhost:8000/api/auth/login";
            let payload = { email, password };

            if (isSignup) {
                endpoint = "http://localhost:8000/api/auth/register";
                payload = {
                    name: document.getElementById('firstName').value,
                    email: email,
                    password: password,
                    password_confirmation: password // Auto-confirm for this UI
                };
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // Store the real sanctum token
                localStorage.setItem("auth_token", data.token || data.data?.token || "");
                
                if (isSignup) {
                    window.location.href = "./profile-setup.html";
                } else {
                    window.location.href = "./dashboard.html";
                }
            } else {
                alert(data.message || "Authentication failed. Please check your credentials.");
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }

        } catch (error) {
            console.error(error);
            alert("Backend not reachable. Ensure the server is running.");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

});