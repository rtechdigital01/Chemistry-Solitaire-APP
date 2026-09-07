document.addEventListener("DOMContentLoaded", () => {
    
    // API Configuration
    const API_BASE_URL = '/api';

    // Route Protection
    const protectedPages = ['dashboard.html', 'profile-setup.html', 'gameplay.html', 'gameplay-states.html', 'results.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (protectedPages.includes(currentPage)) {
        if (!localStorage.getItem('auth_token')) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Redirect logged-in users away from auth pages
    const authPages = ['login.html', 'signup.html', 'forgot-password.html'];
    if (authPages.includes(currentPage) && localStorage.getItem('auth_token')) {
        window.location.href = 'dashboard.html';
        return;
    }

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
    if (loginForm && window.location.pathname.includes('login.html')) {
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
    const signupForm = document.querySelector('form[action="check-email.html"]');
    if (signupForm && window.location.pathname.includes('signup.html')) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop standard redirect
            clearFormError(signupForm);
            
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = "Creating Account...";
            submitBtn.disabled = true;

            // Map frontend fields to backend DTO
            const firstName = signupForm.querySelector('#firstName').value;
            const email = signupForm.querySelector('#email').value;
            const password = signupForm.querySelector('#password').value;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ 
                        name: firstName, 
                        email: email, 
                        password: password,
                        password_confirmation: password // Auto-confirm since UI only has one field
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    // Extract validation errors if any
                    let errorMsg = result.message || 'Signup failed.';
                    if (result.errors) {
                        const firstErrorKey = Object.keys(result.errors)[0];
                        errorMsg = result.errors[firstErrorKey][0];
                    }
                    throw new Error(errorMsg);
                }

                // Save token and redirect
                localStorage.setItem('auth_token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                window.location.href = 'check-email.html';

            } catch (error) {
                showFormError(signupForm, error.message);
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

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
            window.location.href = 'index.html';
        });
    }

    /* ========================================
       FORGOT PASSWORD FORM HANDLER
    ======================================== */
    const forgotPasswordForm = document.querySelector('form[action="login.html"]');
    if (forgotPasswordForm && window.location.pathname.includes('forgot-password.html')) {
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

});
