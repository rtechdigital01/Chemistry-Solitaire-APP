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


/* ============================================================
   DATASET MANAGEMENT
============================================================ */

const DATASET_NAMES = [];

async function loadAdminDatasets() {
    const token = localStorage.getItem("admin_token");
    const tableBody = document.getElementById("datasetsTableBody");

    if (!tableBody) return;

    try {
        const response = await fetch("/api/admin/datasets", {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 401) {
            window.location.replace("admin-login.html");
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            tableBody.innerHTML = `
                <tr><td colspan="8">Unable to load datasets.</td></tr>
            `;
            return;
        }

        const datasets = result.data || [];

        // Populate the Settings upload selector.
        const settingsSelect =
            document.getElementById("settingsDatasetSelect");

        if (settingsSelect) {
            settingsSelect.innerHTML = datasets.map(
                d => `<option value="${d.dataset}">${d.label}</option>`
            ).join("");
        }

        if (datasets.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="8">No datasets registered.</td></tr>
            `;
            return;
        }

        tableBody.innerHTML = datasets.map(d => {
            const inSync =
                d.loaded === d.source_rows && d.source_rows > 0;
            const status = d.available
                ? (inSync
                    ? `<span style="color:#16A34A; font-weight:800;">In sync</span>`
                    : `<span style="color:#D97706; font-weight:800;">${d.loaded} / ${d.source_rows}</span>`)
                : `<span style="color:#DC2626; font-weight:800;">CSV missing</span>`;

            return `
                <tr>
                    <td>${d.dataset}</td>
                    <td>${d.label}</td>
                    <td>${d.country}</td>
                    <td>${d.key_stage}</td>
                    <td>${d.subject}</td>
                    <td>${d.loaded}</td>
                    <td>${d.source_rows}</td>
                    <td>${status}</td>
                    <td style="white-space:nowrap;">
                        <button type="button" class="dataset-action"
                            data-action="import" data-dataset="${d.dataset}"
                            style="padding:6px 10px; border:none; border-radius:8px; background:#2563EB; color:#fff; font-weight:800; cursor:pointer;">Load</button>
                        <button type="button" class="dataset-action"
                            data-action="replace" data-dataset="${d.dataset}"
                            style="padding:6px 10px; border:none; border-radius:8px; background:#D97706; color:#fff; font-weight:800; cursor:pointer;">Replace</button>
                        <button type="button" class="dataset-action"
                            data-action="delete" data-dataset="${d.dataset}"
                            style="padding:6px 10px; border:none; border-radius:8px; background:#DC2626; color:#fff; font-weight:800; cursor:pointer;">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");

        document.querySelectorAll(".dataset-action").forEach(btn => {
            btn.addEventListener("click", () => runDatasetAction(btn));
        });

    } catch (error) {
        console.error("Unable to load datasets:", error);

        tableBody.innerHTML = `
            <tr><td colspan="8">Unable to load datasets.</td></tr>
        `;
    }
}

async function runDatasetAction(btn) {
    const dataset  = btn.dataset.dataset;
    const action   = btn.dataset.action;
    const token    = localStorage.getItem("admin_token");
    const message  = document.getElementById("datasetActionMessage");

    const urls = {
        import:  { url: "/api/admin/datasets/import",  method: "POST" },
        replace: { url: "/api/admin/datasets/replace", method: "POST" },
    };

    if (action === "delete") {
        if (!confirm(`Delete all loaded categories for ${dataset}? Students will no longer see this dataset until you load it again.`)) {
            return;
        }

        try {
            const response = await fetch("/api/admin/datasets", {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ dataset }),
            });

            const result = await response.json();

            message.textContent = result.message || "Deleted.";
            message.style.color = response.ok ? "#16A34A" : "#DC2626";

            loadAdminDatasets();
        } catch (error) {
            message.textContent = "Delete failed.";
        }
        return;
    }

    const target = urls[action];
    if (!target) return;

    if (action === "replace") {
        const ok = confirm(
            `Replace ${dataset}? This deletes the currently loaded categories and re-imports from the CSV on disk.`
        );
        if (!ok) return;
    }

    message.textContent = `${action[0].toUpperCase() + action.slice(1)}ing ${dataset}…`;
    message.style.color = "#64748B";

    try {
        const response = await fetch(target.url, {
            method: target.method,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ dataset }),
        });

        const result = await response.json();

        if (response.status === 401) {
            window.location.replace("admin-login.html");
            return;
        }

        message.textContent = result.message || (response.ok ? "Done." : "Failed.");
        message.style.color = response.ok ? "#16A34A" : "#DC2626";

        loadAdminDatasets();

    } catch (error) {
        console.error("Dataset action error:", error);

        message.textContent = "Action failed. Please try again.";
        message.style.color = "#DC2626";
    }
}

const settingsUploadBtn =
    document.getElementById("settingsUploadBtn");

if (settingsUploadBtn) {
    settingsUploadBtn.addEventListener("click", async () => {
        const token = localStorage.getItem("admin_token");
        const select = document.getElementById("settingsDatasetSelect");
        const fileInput = document.getElementById("settingsDatasetFile");
        const msg = document.getElementById("settingsUploadMessage");

        const dataset = select?.value;
        const file = fileInput?.files?.[0];

        if (!dataset || !file) {
            msg.textContent = "Choose a dataset and a CSV file first.";
            msg.style.color = "#DC2626";
            return;
        }

        const formData = new FormData();
        formData.append("dataset", dataset);
        formData.append("file", file);

        msg.textContent = "Uploading…";
        msg.style.color = "#64748B";

        try {
            const response = await fetch("/api/admin/datasets/upload", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();

            msg.textContent = result.message ||
                (response.ok ? "Uploaded." : "Upload failed.");
            msg.style.color = response.ok ? "#16A34A" : "#DC2626";

            loadAdminDatasets();

        } catch (error) {
            msg.textContent = "Upload failed. Please try again.";
            msg.style.color = "#DC2626";
        }
    });
}

loadAdminDatasets();