const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginMessage = document.getElementById("adminLoginMessage");

adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    adminLoginMessage.textContent = "Signing in...";

    try {
        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                email: adminEmail.value.trim(),
                password: adminPassword.value,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            adminLoginMessage.textContent =
                result.message || "Invalid admin credentials.";
            return;
        }

        localStorage.setItem(
            "admin_token",
            result.data.token
        );

        localStorage.setItem(
            "admin_user",
            JSON.stringify(result.data.user)
        );

        window.location.href = "admin-dashboard.html";

    } catch (error) {
        console.error("Admin login error:", error);

        adminLoginMessage.textContent =
            "Unable to connect. Please try again.";
    }
});