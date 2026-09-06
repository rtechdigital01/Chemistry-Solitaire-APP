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

});