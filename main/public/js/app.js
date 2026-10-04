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

const passwordToggles = document.querySelectorAll(".password-toggle");

passwordToggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
        const wrapper = toggle.closest(".password-input-wrapper");
        if (!wrapper) return;
        
        const passwordInput = wrapper.querySelector("input");
        if (!passwordInput) return;

        const passwordIsHidden = passwordInput.type === "password";

        passwordInput.type = passwordIsHidden ? "text" : "password";

        toggle.setAttribute(
            "aria-label",
            passwordIsHidden ? "Hide password" : "Show password"
        );
    });
});


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
   FETCH REVIEWS
======================================== */
const reviewsContainer = document.getElementById('reviewsContainer');
if (reviewsContainer) {
    fetch(`${window.APP_CONFIG.API_BASE_URL}/reviews`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'Success' && result.data && result.data.length > 0) {
               
                    reviewsContainer.innerHTML = `
                        <div class="reviews-slider">
                            <div class="reviews-track" id="reviewsTrack"></div>
                        </div>
                    `;
                    
                    const reviewsTrack = document.getElementById("reviewsTrack");
                    
                    const reviews = [...result.data, ...result.data];
                    
                    reviews.forEach(review => {
                        const stars = '★'.repeat(review.rating);
                    
                        const reviewCard = `
                            <div class="premium-review-card">
                                <div class="review-stars">${stars}</div>
                    
                                <p class="review-comment">
                                    "${review.comment}"
                                </p>
                    
                                <div class="review-user">
                                    <div class="review-avatar">
                                        ${review.user_name
                                            ? review.user_name.charAt(0).toUpperCase()
                                            : "U"}
                                    </div>
                    
                                    <div>
                                        <strong class="review-name">
                                            ${review.user_name}
                                        </strong>
                    
                                        <span class="review-role">
                                            ${review.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        `;
                    
                        reviewsTrack.innerHTML += reviewCard;
                    });               
              
            } else {
                reviewsContainer.innerHTML = '<p style="color: #64748B;">No reviews available at this time.</p>';
            }
        })
        .catch(err => {
            console.error('Error fetching reviews:', err);
            reviewsContainer.innerHTML = '<p style="color: #ef4444;">Failed to load reviews.</p>';
        });
}

});