document.addEventListener("DOMContentLoaded", () => {
    
    // API Configuration
    const API_BASE_URL = '/api';


// ========================================
// ROUTE PROTECTION
// ========================================

const currentPage =
    window.location.pathname
        .split('/')
        .filter(Boolean)
        .pop()
        ?.replace('.html', '') || 'index';

const protectedPages = [
    'dashboard',
    'profile-setup',
    'gameplay',
    'gameplay-states',
    'results'
];

const authPages = [
    'login',
    'signup',
    'forgot-password'
];

const authToken =
    localStorage.getItem('auth_token');


// Protect private pages
if (
    protectedPages.includes(currentPage) &&
    !authToken
) {
    window.location.href = '/login';
    return;
}


// Logged-in users should not return to login/signup
if (
    authPages.includes(currentPage) &&
    authToken
) {
    window.location.href = '/dashboard';
    return;
}
    
    // Hide Login links everywhere when user is logged in
function updateAuthNavigation() {
    if (!localStorage.getItem('auth_token')) {
        return;
    }

    const loginLinks = document.querySelectorAll('a[href$="login.html"]');

    loginLinks.forEach(link => {
        link.style.display = 'none';
    });
}

// Run immediately for pages where the header already exists
updateAuthNavigation();

// Watch for shared header being loaded dynamically
const authNavObserver = new MutationObserver(() => {
    updateAuthNavigation();
});

authNavObserver.observe(document.body, {
    childList: true,
    subtree: true
});
    
    
    
    

    // Helper: Show Error Message on Form
    function showFormError(form, message) {
        let errorEl = form.querySelector('.api-error-message');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'api-error-message';
            errorEl.style.color = '#ef4444';
            errorEl.style.fontSize = '14px';
            errorEl.style.marginBottom = '16px';
            errorEl.style.padding = '10px';
            errorEl.style.backgroundColor = '#fee2e2';
            errorEl.style.borderRadius = '8px';
            form.insertBefore(errorEl, form.firstChild);
        }
        errorEl.textContent = message;
    }

    // Helper: Clear Error Message
    function clearFormError(form) {
        const errorEl = form.querySelector('.api-error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }

    /* ========================================
       LOGIN FORM HANDLER
    ======================================== */
    const loginForm = document.querySelector('form[action="dashboard.html"]');
    if (loginForm && window.location.pathname.includes('login')) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop standard redirect
            clearFormError(loginForm);
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = "Logging in...";
            submitBtn.disabled = true;

            const email = loginForm.querySelector('#email').value;
            const password = loginForm.querySelector('#password').value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Login failed. Please check your credentials.');
                }

                // Save token and redirect
                localStorage.setItem('auth_token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                window.location.href = 'dashboard.html';

            } catch (error) {
                showFormError(loginForm, error.message);
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    /* ========================================
       SIGNUP FORM HANDLER
    ======================================== */
   /* ========================================
   SIGNUP FORM HANDLER
======================================== */
const signupForm =
    document.querySelector('form[action="check-email.html"]');

if (
    signupForm &&
    window.location.pathname.includes('signup')
) {

    signupForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        clearFormError(signupForm);

        const submitBtn =
            signupForm.querySelector('button[type="submit"]');

        const originalBtnText =
            submitBtn.textContent;

        submitBtn.textContent = "Creating Account...";
        submitBtn.disabled = true;


        const firstName =
            signupForm.querySelector('#firstName').value.trim();

        const email =
            signupForm.querySelector('#email').value.trim();

        const password =
            signupForm.querySelector('#password').value;

        const passwordConfirmation =
            signupForm.querySelector('#passwordConfirmation').value;

        const country =
            signupForm.querySelector('#country').value;

        const educationLevel =
            signupForm.querySelector('#educationLevel').value;


        if (password !== passwordConfirmation) {

            showFormError(
                signupForm,
                'Passwords do not match.'
            );

            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;

            return;
        }


        try {

            const response = await fetch(
                `${API_BASE_URL}/auth/register`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },

                    body: JSON.stringify({
                        name: firstName,
                        email: email,
                        password: password,
                        password_confirmation: passwordConfirmation,
                        country: country,
                        education_level: educationLevel
                    })
                }
            );


            const result = await response.json();


            if (!response.ok) {

                let errorMsg =
                    result.message || 'Signup failed.';

                if (result.errors) {

                    const firstErrorKey =
                        Object.keys(result.errors)[0];

                    errorMsg =
                        result.errors[firstErrorKey][0];
                }

                throw new Error(errorMsg);
            }


            localStorage.setItem(
                'auth_token',
                result.data.token
            );

            localStorage.setItem(
                'user',
                JSON.stringify(result.data.user)
            );

            window.location.href = 'check-email.html';


        } catch (error) {

            showFormError(
                signupForm,
                error.message
            );

        } finally {

            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }

    });
}

/* ========================================
   PASSWORD SHOW / HIDE
======================================== */
document.querySelectorAll('.password-toggle').forEach(button => {

    button.addEventListener('click', () => {

        const wrapper =
            button.closest('.password-input-wrapper');

        const input =
            wrapper?.querySelector('input');

        if (!input) return;

        const showing =
            input.type === 'text';

        input.type =
            showing ? 'password' : 'text';

        button.setAttribute(
            'aria-label',
            showing ? 'Show password' : 'Hide password'
        );

    });

});


    /* ========================================
       LOGOUT HANDLER
    ======================================== */
    const logoutBtn = document.querySelector('.dashboard-logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    await fetch(`${API_BASE_URL}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } catch (err) {
                    console.error("Logout error", err);
                }
            }
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = 'index';
        });
    }

    /* ========================================
       FORGOT PASSWORD FORM HANDLER
    ======================================== */
    const forgotPasswordForm = document.querySelector('form[action="login.html"]');
    if (forgotPasswordForm && window.location.pathname.includes('forgot-password')) {
        // Remove the inline onclick alert first to prevent double firing
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.removeAttribute('onclick');

        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop standard redirect
            clearFormError(forgotPasswordForm);
            
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = "Sending...";
            submitBtn.disabled = true;

            const email = forgotPasswordForm.querySelector('#email').value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Failed to send reset link.');
                }

                // Show success message and redirect
                alert('Password reset link sent! Please check your email.');
                window.location.href = 'login.html';

            } catch (error) {
                showFormError(forgotPasswordForm, error.message);
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
    
    
    
    
/* ========================================
   DASHBOARD USER GREETING
======================================== */
/* ========================================
   DASHBOARD USER PROFILE
======================================== */
if (currentPage === 'dashboard') {

    const token = localStorage.getItem('auth_token');

    const avatarMap = {
        chemist: '🧪',
        atom: '⚛️',
        scientist: '🔬',
        lab: '🌡️',
        crystal: '💎',
        molecule: '🧬',
        flask: '⚗️',
        nature: '🦋'
    };

    async function loadDashboardProfile() {

        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {

            const response = await fetch(
                `${API_BASE_URL}/auth/me`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error('Unable to load profile.');
            }

            const user = result.data;
            
            const dashboardUserCourse =
                document.getElementById("dashboardUserCourse");
            
            if (dashboardUserCourse) {
                dashboardUserCourse.textContent =
                    user.education_level && user.key_stage
                        ? `${user.education_level} • ${user.key_stage} Chemistry`
                        : 'Chemistry Student';
            }

            // Keep local browser copy updated
            localStorage.setItem(
                'user',
                JSON.stringify(user)
            );
            
            

const dashboardCoinBalance =
    document.getElementById("dashboardCoinBalance");

if (dashboardCoinBalance) {
    dashboardCoinBalance.textContent =
        Number(user.coin_balance || 0).toLocaleString();
}

            /* USER NAME */
            const nameElement =
                document.getElementById('dashboardUserName');

            if (nameElement) {

                const firstName =
                    user.display_name ||
                    (user.name
                        ? user.name.trim().split(' ')[0]
                        : 'Student');

                nameElement.textContent = firstName;
            }


            /* AVATAR */
            const avatarElement =
                document.getElementById('dashboardAvatarContent');

            if (avatarElement) {

                if (user.profile_photo) {

                    avatarElement.innerHTML = `
                        <img
                            src="/${user.profile_photo}"
                            alt="Profile photo"
                            style="
                                width:100%;
                                height:100%;
                                object-fit:cover;
                                border-radius:inherit;
                            "
                        >
                    `;

                } else {

                    avatarElement.textContent =
                        avatarMap[user.avatar] || '🧪';
                }
            }


            /* GREETING */
            const hour = new Date().getHours();

            let greeting;

            if (hour < 12) {
                greeting = 'Good morning 👋';
            } else if (hour <= 16) {
                greeting = 'Good afternoon 👋';
            } else {
                greeting = 'Good evening 👋';
            }

            const greetingElement =
                document.getElementById('dashboardGreeting');

            if (greetingElement) {
                greetingElement.textContent = greeting;
            }

        } catch (error) {
            console.error(
                'Dashboard profile error:',
                error
            );
        }
    }

    loadDashboardProfile();
}
    
    
    
    
    
/* ========================================
   PROFILE SETUP API
======================================== */
if (currentPage === 'profile-setup') {

    const displayNameInput = document.getElementById('displayName');
    const previewName = document.getElementById('previewName');
    const avatarFileInput = document.getElementById('avatarFileInput');
    const enterPortalButton = document.querySelector('.enter-portal-button');

    // Use the signed-up user's first name instead of static "Alex"
    const storedUser = localStorage.getItem('user');

    if (storedUser && displayNameInput) {
        try {
            const user = JSON.parse(storedUser);

            const defaultName =
                user.display_name ||
                (user.name ? user.name.trim().split(' ')[0] : '');

            if (defaultName) {
                displayNameInput.value = defaultName;

                if (previewName) {
                    previewName.textContent = defaultName;
                }
            }

        } catch (error) {
            console.error('Unable to read user information:', error);
        }
    }

    if (enterPortalButton) {

        enterPortalButton.addEventListener('click', async (e) => {

            e.preventDefault();

            const token = localStorage.getItem('auth_token');

            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            const displayName = displayNameInput.value.trim();

            if (!displayName) {
                alert('Please enter a display name.');
                return;
            }

            const selectedAvatar =
                document.querySelector('.avatar-option.active');

            const formData = new FormData();

            formData.append('display_name', displayName);

            // If user uploaded a photo
            if (
                selectedAvatar &&
                selectedAvatar.id === 'uploadAvatarButton' &&
                avatarFileInput.files.length > 0
            ) {
                formData.append(
                    'profile_photo',
                    avatarFileInput.files[0]
                );
            } else {
                // Standard avatar
                const avatar =
                    selectedAvatar?.dataset.avatar || 'chemist';

                formData.append('avatar', avatar);
            }

            const originalText = enterPortalButton.innerHTML;

            enterPortalButton.style.pointerEvents = 'none';

            try {

                const response = await fetch(
                    `${API_BASE_URL}/auth/profile`,
                    {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                        'Unable to save your profile.'
                    );
                }

                // Keep the latest user profile in the browser
                localStorage.setItem(
                    'user',
                    JSON.stringify(result.data)
                );

                window.location.href = 'dashboard.html';

            } catch (error) {

                alert(error.message);

                enterPortalButton.innerHTML = originalText;
                enterPortalButton.style.pointerEvents = '';

            }
        });
    }
}
    

// Display saved avatar or uploaded profile photo
const avatarElement =
    document.getElementById('dashboardAvatarContent');

const avatarMap = {
    chemist: '🧪',
    atom: '⚛️',
    scientist: '🔬',
    lab: '🌡️',
    crystal: '💎',
    molecule: '🧬',
    flask: '⚗️',
    nature: '🦋'
};

if (avatarElement) {

    if (user.profile_photo) {

        const photoPath =
            '/' + user.profile_photo.replace(/^\/+/, '');

        avatarElement.innerHTML = `
            <img
                src="${photoPath}"
                alt="Profile photo"
                style="
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: inherit;
                "
            >
        `;

    } else {

        avatarElement.textContent =
            avatarMap[user.avatar] || '🧪';

    }
}
    
    
    
    
    
    
    
    
    
    

});
