document.addEventListener("DOMContentLoaded", () => {
    // Attempt to read the user from localStorage
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        console.error("Error parsing user data", e);
    }

    if (user) {
        // Update user name
        const userNameElements = document.querySelectorAll('.dashboard-user-name, #dashboardUserName');
        userNameElements.forEach(el => {
            el.textContent = user.name || user.firstName || 'User';
        });

        // Update greeting depending on time of day
        const greetingElements = document.querySelectorAll('.dashboard-greeting, #dashboardGreeting');
        const hour = new Date().getHours();
        let greetingText = 'Good evening 👋';
        if (hour < 12) {
            greetingText = 'Good morning 👋';
        } else if (hour < 18) {
            greetingText = 'Good afternoon 👋';
        }
        greetingElements.forEach(el => {
            el.textContent = greetingText;
        });
        
        // Update course / level based on role
        const userCourseElements = document.querySelectorAll('.dashboard-user-course, #dashboardUserCourse');
        userCourseElements.forEach(el => {
            el.textContent = user.role === 'teacher' ? 'Science Teacher' : 'Student Level';
        });
    }
});
