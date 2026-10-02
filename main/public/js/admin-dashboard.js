const adminNavButtons = document.querySelectorAll(".admin-nav-btn");
const adminTabPanels = document.querySelectorAll(".admin-tab-panel");

adminNavButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const targetTab = button.dataset.tab;

        adminNavButtons.forEach((btn) => {
            btn.classList.remove("active");
        });

        adminTabPanels.forEach((panel) => {
            panel.classList.remove("active");
        });

        button.classList.add("active");

        const targetPanel = document.getElementById(targetTab);

        if (targetPanel) {
            targetPanel.classList.add("active");
        }
    });
});


async function loadAdminOverview() {
    const token = localStorage.getItem("admin_token");

    try {
        const response = await fetch("/api/admin/overview", {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Overview error:", result);
            return;
        }

        const data = result.data;

        document.getElementById("totalUsers").textContent =
            data.total_users ?? 0;

        document.getElementById("totalStudents").textContent =
            data.total_students ?? 0;

        document.getElementById("totalTeachers").textContent =
            data.total_teachers ?? 0;

        document.getElementById("totalGameplayAttempts").textContent =
            data.total_gameplay_attempts ?? 0;

    } catch (error) {
        console.error("Unable to load admin overview:", error);
    }
}
loadAdminOverview();


async function loadAdminStudents() {
    const token = localStorage.getItem("admin_token");
    const tableBody = document.getElementById("studentsTableBody");

    if (!tableBody) return;

    try {
        const response = await fetch("/api/admin/students", {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">Unable to load students.</td>
                </tr>
            `;
            return;
        }

        const students = result.data || [];

        if (students.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">No students registered yet.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = students.map((student) => {
            const registeredDate = student.created_at
                ? new Date(student.created_at).toLocaleDateString()
                : "-";

            return `
                <tr>
                    <td>${student.name ?? "-"}</td>
                    <td>${student.email ?? "-"}</td>
                    <td>${student.country ?? "-"}</td>
                    <td>${student.education_level ?? "-"}</td>
                    <td>${student.key_stage ?? "-"}</td>
                    <td>${student.coin_balance ?? 0}</td>
                    <td>${registeredDate}</td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Unable to load students:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">Unable to load students.</td>
            </tr>
        `;
    }
}
loadAdminStudents();


async function loadAdminTeachers() {
    const token = localStorage.getItem("admin_token");
    const tableBody = document.getElementById("teachersTableBody");

    if (!tableBody) return;

    try {
        const response = await fetch("/api/admin/teachers", {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">Unable to load teachers.</td>
                </tr>
            `;
            return;
        }

        const teachers = result.data || [];

        if (teachers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">No teachers registered yet.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = teachers.map((teacher) => {
            const registeredDate = teacher.created_at
                ? new Date(teacher.created_at).toLocaleDateString()
                : "-";

            return `
                <tr>
                    <td>${teacher.name ?? "-"}</td>
                    <td>${teacher.email ?? "-"}</td>
                    <td>${teacher.country ?? "-"}</td>
                    <td>${registeredDate}</td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Unable to load teachers:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">Unable to load teachers.</td>
            </tr>
        `;
    }
}
loadAdminTeachers();