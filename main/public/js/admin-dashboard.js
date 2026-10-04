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

        // Lazy-load tab-specific data on first visit.
        const lazyLoads = {
    gameplay: loadAdminGameplayOverview,
    datasets: loadAdminDatasets,
    settings: loadAdminDatasets,
    feedback: loadAdminFeedback,
    coins: loadAdminCoins,
    reports: loadAdminReports,
}; 


        const loader = lazyLoads[targetTab];

        if (loader && !targetPanel.dataset.loaded) {
            loader();
        }
    });
});


/* ============================================================
   DATA LOADING HELPERS
============================================================ */

const adminToken = localStorage.getItem("admin_token");

function adminHeaders(extra = {}) {
    return Object.assign(
        {
            Accept: "application/json",
            Authorization: `Bearer ${adminToken}`,
        },
        extra
    );
}

function safeJson(response) {
    return response.json().then((result) => {
        if (!response.ok) {
            console.error("API error:", result);
            return null;
        }
        return result;
    });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? 0;
}


/* ============================================================
   OVERVIEW TAB
============================================================ */

async function loadAdminOverview() {
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/overview`, {
            headers: adminHeaders(),
        });

        const result = await safeJson(response);
        if (!result) return;

        const data = result.data;

        setText("totalUsers", data.total_users);
        setText("totalStudents", data.total_students);
        setText("totalTeachers", data.total_teachers);
        setText("totalAdmins", data.total_admins);
        setText("totalGameplayAttempts", data.total_gameplay_attempts);
        setText("totalCategories", data.total_categories);
        setText("activeStudents7d", data.active_students_7d);
    } catch (error) {
        console.error("Unable to load admin overview:", error);
    }
}

loadAdminOverview();


/* ============================================================
   STUDENTS TAB
============================================================ */

async function loadAdminStudents() {
    const tableBody = document.getElementById("studentsTableBody");

    if (!tableBody) return;

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/students`, {
            headers: adminHeaders(),
        });

        const result = await safeJson(response);
        if (!result) return;

        const students = result.data || [];

        if (students.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8">No students registered yet.</td>
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
                    <td>
                        <button type="button" class="student-activity-btn"
                            data-student-id="${student.id}"
                            data-student-name="${(student.name ?? "Student").replace(/"/g, "&quot;")}"
                            style="padding:6px 10px; border:none; border-radius:8px; background:#0F172A; color:#fff; font-weight:800; cursor:pointer;">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        document.querySelectorAll(".student-activity-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                loadStudentActivity(
                    btn.dataset.studentId,
                    btn.dataset.studentName
                );
            });
        });

    } catch (error) {
        console.error("Unable to load students:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">Unable to load students.</td>
            </tr>
        `;
    }
}

async function loadStudentActivity(studentId, studentName) {
    const panel = document.getElementById("studentActivityPanel");
    const title = document.getElementById("studentActivityTitle");
    const content = document.getElementById("studentActivityContent");

    if (!panel || !content) return;

    panel.style.display = "block";
    title.textContent = `Activity — ${studentName}`;
    content.innerHTML = `<p style="color:#64748B; font-weight:700;">Loading activity…</p>`;

    try {
        const response = await fetch(
            `/api/admin/gameplay/student/${studentId}`,
            { headers: adminHeaders() }
        );

        const result = await safeJson(response);
        if (!result) {
            content.innerHTML = `<p style="color:#DC2626; font-weight:700;">Unable to load activity.</p>`;
            return;
        }

        const attempts = result.data.attempts?.data || [];

        if (attempts.length === 0) {
            content.innerHTML = `<p style="color:#64748B; font-weight:700;">No gameplay attempts recorded for this student.</p>`;
            return;
        }

        content.innerHTML = `
            <div class="admin-table-card">
                <div class="admin-table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Subject</th>
                                <th>Deck</th>
                                <th>Difficulty</th>
                                <th>Level</th>
                                <th>Score</th>
                                <th>Coins</th>
                                <th>Accuracy</th>
                                <th>Time</th>
                                <th>Done</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attempts.map(a => {
                                const total = a.correct_matches + a.incorrect_matches;
                                const accuracy = total > 0
                                    ? Math.round((a.correct_matches / total) * 100)
                                    : 0;
                                const mins = Math.floor((a.time_spent || 0) / 60);
                                const secs = (a.time_spent || 0) % 60;

                                return `
                                    <tr>
                                        <td>${a.created_at ? new Date(a.created_at).toLocaleDateString() : "-"}</td>
                                        <td>${a.subject ?? "-"}</td>
                                        <td>${a.deck ?? "-"}</td>
                                        <td>${a.difficulty ?? "-"}</td>
                                        <td>${a.level ?? "-"}</td>
                                        <td>${a.score ?? 0}</td>
                                        <td>${a.coins_earned ?? 0}</td>
                                        <td>${accuracy}%</td>
                                        <td>${mins}m ${secs}s</td>
                                        <td>${a.completed ? "✓" : "✗"}</td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Unable to load student activity:", error);
        content.innerHTML = `<p style="color:#DC2626; font-weight:700;">Unable to load activity.</p>`;
    }
}

loadAdminStudents();


/* ============================================================
   TEACHERS TAB
============================================================ */

async function loadAdminTeachers() {
    const tableBody = document.getElementById("teachersTableBody");

    if (!tableBody) return;

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/teachers`, {
            headers: adminHeaders(),
        });

        const result = await safeJson(response);
        if (!result) return;

        const teachers = result.data || [];

        if (teachers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">No teachers registered yet.</td>
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
                    <td>${teacher.coin_balance ?? 0}</td>
                    <td>${registeredDate}</td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Unable to load teachers:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">Unable to load teachers.</td>
            </tr>
        `;
    }
}

loadAdminTeachers();


/* ============================================================
   DATASETS TAB
============================================================ */

async function loadAdminDatasets() {
    const token = localStorage.getItem("admin_token");
    const tableBody = document.getElementById("datasetsTableBody");
    const panel = document.getElementById("datasets");

    if (!tableBody || !panel) return;

    panel.dataset.loaded = "1";

    if (!token) {
        window.location.replace("admin-login.html");
        return;
    }

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/datasets`, {
            headers: adminHeaders(),
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

        const datasets = (result.data || []).filter(d =>
        d.available === true || Number(d.loaded) > 0
        );
        const settingsSelect = document.getElementById("settingsDatasetSelect");

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

    const topic = d.topic || d.label || d.dataset;

    return `
        <tr>
            <td style="font-weight:800; color:#0F172A;">${topic}</td>
            <td style="text-transform:capitalize;">${d.subject}</td>
            <td>${d.key_stage}</td>
            <td>${d.country}</td>
            <td>${d.loaded}</td>
            <td>${status}</td>
            <td style="white-space:nowrap;">
                <button type="button" class="dataset-action"
                    data-action="import"
                    data-dataset="${d.dataset}"
                    style="padding:6px 10px; border:none; border-radius:8px; background:#2563EB; color:#fff; font-weight:800; cursor:pointer;">
                    Load
                </button>

                <button type="button" class="dataset-action"
                    data-action="delete"
                    data-dataset="${d.dataset}"
                    style="padding:6px 10px; border:none; border-radius:8px; background:#DC2626; color:#fff; font-weight:800; cursor:pointer;">
                    Delete
                </button>
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
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/datasets`, {
                method: "DELETE",
                headers: adminHeaders({ "Content-Type": "application/json" }),
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
            headers: adminHeaders({ "Content-Type": "application/json" }),
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


/* ============================================================
   GAMEPLAY TAB
============================================================ */

async function loadAdminGameplayOverview() {
    const panel = document.getElementById("gameplay");
    if (!panel) return;
    panel.dataset.loaded = "1";

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/gameplay/overview`, {
            headers: adminHeaders(),
        });

        const result = await safeJson(response);
        if (!result) return;

        const data = result.data;
        const total = data.totals || {};

        const container = document.getElementById("gameplayContent");
        if (!container) return;

        const minutes = Math.floor((total.time_spent_seconds || 0) / 60);
        const hours   = Math.floor(minutes / 60);
        const timeSpentLabel = hours > 0
            ? `${hours}h ${minutes % 60}m`
            : `${minutes}m`;

        container.innerHTML = `
            <div style="padding:20px 0;">
                <h2 style="margin:0 0 8px; font-size:18px; color:#0F172A;">Aggregate session stats</h2>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-top:16px;">
                    <div class="admin-stat-card">
                        <span>Total attempts</span>
                        <strong>${total.attempts ?? 0}</strong>
                    </div>
                    <div class="admin-stat-card">
                        <span>Total score</span>
                        <strong>${total.score ?? 0}</strong>
                    </div>
                    <div class="admin-stat-card">
                        <span>Completed accuracy</span>
                        <strong>${total.accuracy_percent ?? 0}%</strong>
                    </div>
                    <div class="admin-stat-card">
                        <span>Total moves</span>
                        <strong>${total.moves ?? 0}</strong>
                    </div>
                    <div class="admin-stat-card">
                        <span>Time spent</span>
                        <strong>${timeSpentLabel}</strong>
                    </div>
                    <div class="admin-stat-card">
                        <span>Coins earned</span>
                        <strong>${total.coins_earned ?? 0}</strong>
                    </div>
                    <div class="admin-stat-card">
                        <span>Correct matches</span>
                        <strong>${total.correct_matches ?? 0}</strong>
                    </div>
                    <div class="admin-stat-card">
                        <span>Incorrect matches</span>
                        <strong>${total.incorrect_matches ?? 0}</strong>
                    </div>
                </div>

                <h3 style="margin:24px 0 8px; font-size:16px;">Completion rate by deck</h3>
                <div id="adminDeckCompletionList">Loading decks…</div>

                <h3 style="margin:24px 0 8px; font-size:16px;">Accuracy by difficulty</h3>
                <div id="adminDifficultyAccuracyList">Loading difficulties…</div>

                <h3 style="margin:24px 0 8px; font-size:16px;">Top performers</h3>
                <div id="adminLeaderboardList">Loading leaderboard…</div>
            </div>
        `;

        // Decks list
        const deckList = document.getElementById("adminDeckCompletionList");
        if (deckList && data.per_deck) {
            if (data.per_deck.length === 0) {
                deckList.innerHTML = `<p style="color:#64748B;">No attempts recorded yet.</p>`;
            } else {
                deckList.innerHTML = `
                    <div class="admin-table-card">
                        <div class="admin-table-wrapper">
                            <table class="admin-table">
                                <thead><tr><th>Deck</th><th>Attempts</th><th>Avg score</th><th>Coins earned</th></tr></thead>
                                <tbody>
                                    ${data.per_deck.map(d => `
                                        <tr>
                                            <td>${d.deck}</td>
                                            <td>${d.attempts}</td>
                                            <td>${d.avg_score}</td>
                                            <td>${d.coins}</td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        }

        // Difficulty list
        const diffList = document.getElementById("adminDifficultyAccuracyList");
        if (diffList && data.per_difficulty) {
            if (data.per_difficulty.length === 0) {
                diffList.innerHTML = `<p style="color:#64748B;">No attempts recorded yet.</p>`;
            } else {
                diffList.innerHTML = `
                    <div class="admin-table-card">
                        <div class="admin-table-wrapper">
                            <table class="admin-table">
                                <thead><tr><th>Difficulty</th><th>Attempts</th><th>Avg score</th></tr></thead>
                                <tbody>
                                    ${data.per_difficulty.map(d => `
                                        <tr>
                                            <td>${d.difficulty}</td>
                                            <td>${d.attempts}</td>
                                            <td>${d.avg_score}</td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        }

    } catch (error) {
        console.error("Unable to load gameplay overview:", error);
    }

    loadAdminLeaderboard();
}

async function loadAdminLeaderboard() {
    const container = document.getElementById("adminLeaderboardList");
    if (!container) return;

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/gameplay/leaderboard`, {
            headers: adminHeaders(),
        });

        const result = await safeJson(response);
        if (!result) {
            container.innerHTML = `<p style="color:#64748B;">Leaderboard unavailable.</p>`;
            return;
        }

        // The API groups by (user, deck, difficulty); rank students by
        // their aggregate total score so a student appears once.
        const byUser = new Map();

        (result.data.top || []).forEach(row => {
            const existing = byUser.get(row.user_id) || {
                name: row.name,
                total: 0,
                attempts: 0,
                coins: 0,
                best: 0,
            };
            existing.total += row.total_score;
            existing.attempts += row.attempts;
            existing.coins += row.coins;
            existing.best = Math.max(existing.best, row.best_score);
            byUser.set(row.user_id, existing);
        });

        const ranked = [...byUser.values()]
            .sort((a, b) => b.total - a.total)
            .slice(0, 20);

        if (ranked.length === 0) {
            container.innerHTML = `<p style="color:#64748B;">No completed games yet.</p>`;
            return;
        }

        container.innerHTML = `
            <div class="admin-table-card">
                <div class="admin-table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr><th>#</th><th>Student</th><th>Total score</th><th>Best single</th><th>Games</th><th>Coins</th></tr>
                        </thead>
                        <tbody>
                            ${ranked.map((r, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${r.name}</td>
                                    <td>${r.total}</td>
                                    <td>${r.best}</td>
                                    <td>${r.attempts}</td>
                                    <td>${r.coins}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Unable to load leaderboard:", error);
    }
}


/* ============================================================
   FEEDBACK TAB
============================================================ */

async function loadAdminFeedback() {
    const panel = document.getElementById("feedback");
    const summary = document.getElementById("feedbackSummary");
    const list = document.getElementById("feedbackList");

    if (!panel || !list) return;
    panel.dataset.loaded = "1";

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/feedback`, {
            headers: adminHeaders(),
        });

        const result = await safeJson(response);
        if (!result) {
            list.innerHTML = `<p style="color:#DC2626; font-weight:700;">Unable to load feedback.</p>`;
            return;
        }

        const data = result.data;

        if (summary) {
            summary.innerHTML = `
                <div class="admin-stat-card">
                    <span>Total reviews</span>
                    <strong>${data.total}</strong>
                </div>
                <div class="admin-stat-card">
                    <span>Average rating</span>
                    <strong>${data.average_rating} / 5</strong>
                </div>
            `;
        }

        if (!data.reviews || data.reviews.length === 0) {
            list.innerHTML = `<p style="color:#64748B; font-weight:700;">No reviews submitted yet.</p>`;
            return;
        }

        list.innerHTML = `
            <div class="admin-table-card">
                <div class="admin-table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr><th>Name</th><th>Role</th><th>Rating</th><th>Comment</th><th>Date</th><th></th></tr>
                        </thead>
                        <tbody>
                            ${data.reviews.map(r => `
                                <tr>
                                    <td>${r.name || "Unknown user"}</td>
                                    <td>${r.role}</td>
                                    <td>${"★".repeat(Math.max(0, Math.min(5, r.rating)))}</td>
                                    <td style="max-width:360px;">${r.comment}</td>
                                    <td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}</td>
                                    <td style="white-space:nowrap;">
                                    
                                        <button
                                            type="button"
                                            class="review-feature-btn"
                                            data-review-id="${r.id}"
                                            style="
                                                padding:6px 10px;
                                                border:none;
                                                border-radius:8px;
                                                background:${r.is_featured ? "#64748B" : "#2563EB"};
                                                color:#fff;
                                                font-weight:800;
                                                cursor:pointer;
                                                margin-right:6px;
                                            "
                                        >
                                            ${r.is_featured ? "Remove from Homepage" : "Show on Homepage"}
                                        </button>
                                        <button
                                            type="button"
                                            class="review-delete-btn"
                                            data-review-id="${r.id}"
                                            style="
                                                padding:6px 10px;
                                                border:none;
                                                border-radius:8px;
                                                background:#DC2626;
                                                color:#fff;
                                                font-weight:800;
                                                cursor:pointer;
                                            "
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;


        document.querySelectorAll(".review-feature-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
        
                const response = await fetch(
                    `/api/admin/feedback/${btn.dataset.reviewId}/feature`,
                    {
                        method: "POST",
                        headers: adminHeaders()
                    }
                );
        
                if (response.ok) {
                    panel.dataset.loaded = "";
                    loadAdminFeedback();
                }
            });
        });
        
        document.querySelectorAll(".review-delete-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                if (!confirm("Delete this review?")) return;

                const response = await fetch(
                    `/api/admin/feedback/${btn.dataset.reviewId}`,
                    { method: "DELETE", headers: adminHeaders() }
                );

                if (response.ok) {
                    panel.dataset.loaded = "";
                    loadAdminFeedback();
                }
            });
        });

    } catch (error) {
        console.error("Unable to load feedback:", error);
    }
}


/* ============================================================
   POINTS & COINS TAB
============================================================ */

async function loadAdminCoins() {
    const panel = document.getElementById("coins");
    const summary = document.getElementById("coinsSummary");
    const holders = document.getElementById("coinsTopHolders");

    if (!panel || !holders) return;
    panel.dataset.loaded = "1";

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/coins`, {
            headers: adminHeaders(),
        });

        const result = await safeJson(response);
        if (!result) return;

        const data = result.data;

        if (summary) {
            summary.innerHTML = `
                <div class="admin-stat-card">
                    <span>Coins in circulation</span>
                    <strong>${data.total_balance_in_circulation}</strong>
                </div>
                <div class="admin-stat-card">
                    <span>Users holding coins</span>
                    <strong>${data.users_holding_coins}</strong>
                </div>
                <div class="admin-stat-card">
                    <span>Coins earned all-time</span>
                    <strong>${data.coins_earned_all_time}</strong>
                </div>
                <div class="admin-stat-card">
                    <span>Avg coins / attempt</span>
                    <strong>${data.average_coins_per_attempt}</strong>
                </div>
            `;
        }

        if (!data.top_holders || data.top_holders.length === 0) {
            holders.innerHTML = `<p style="color:#64748B; font-weight:700;">No coins earned yet.</p>`;
            return;
        }

        holders.innerHTML = `
            <h3 style="margin:24px 0 8px; font-size:16px;">Top holders</h3>
            <div class="admin-table-card">
                <div class="admin-table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Role</th><th>Country</th><th>Balance</th></tr>
                        </thead>
                        <tbody>
                            ${data.top_holders.map(h => `
                                <tr>
                                    <td>${h.name}</td>
                                    <td>${h.email}</td>
                                    <td>${h.role}</td>
                                    <td>${h.country ?? "-"}</td>
                                    <td>${h.coin_balance}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Unable to load coins:", error);
    }
}


/* ============================================================
   REPORTS TAB
============================================================ */

async function loadAdminReports() {
    const panel = document.getElementById("reports");
    const container = document.getElementById("reportsContent");

    if (!panel || !container) return;
    panel.dataset.loaded = "1";

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/reports`, {
            headers: adminHeaders(),
        });

        const result = await safeJson(response);
        if (!result) {
            container.innerHTML = `<p style="color:#DC2626; font-weight:700;">Unable to load reports.</p>`;
            return;
        }

        const d = result.data;

        const table = (title, headers, rows) => `
            <h3 style="margin:24px 0 8px; font-size:16px;">${title}</h3>
            <div class="admin-table-card">
                <div class="admin-table-wrapper">
                    <table class="admin-table">
                        <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
                        <tbody>${rows || `<tr><td colspan="${headers.length}">No data.</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = `
            <div style="padding: 8px 0 0;">
                ${table(
                    "Users by country",
                    ["Country", "Users"],
                    (d.by_country || []).map(r => `<tr><td>${r.country ?? "Unknown"}</td><td>${r.total}</td></tr>`).join("")
                )}

                ${table(
                    "Users by role",
                    ["Role", "Users"],
                    (d.by_role || []).map(r => `<tr><td>${r.role}</td><td>${r.total}</td></tr>`).join("")
                )}

                ${table(
                    "Students by education level",
                    ["Education level", "Key stage", "Students"],
                    (d.by_education_level || []).map(r => `<tr><td>${r.education_level ?? "-"}</td><td>${r.key_stage ?? "-"}</td><td>${r.total}</td></tr>`).join("")
                )}

                ${table(
                    "Dataset coverage (attempts)",
                    ["Deck", "Key stage", "Students", "Attempts"],
                    (d.deck_coverage || []).map(r => `<tr><td>${r.deck ?? "-"}</td><td>${r.key_stage ?? "-"}</td><td>${r.students}</td><td>${r.attempts}</td></tr>`).join("")
                )}

                ${table(
                    "Registrations — last 30 days",
                    ["Day", "New users"],
                    (d.daily_registrations_30d || []).map(r => `<tr><td>${r.day}</td><td>${r.total}</td></tr>`).join("")
                )}

                ${table(
                    "Gameplay attempts — last 30 days",
                    ["Day", "Attempts", "Completed"],
                    (d.daily_attempts_30d || []).map(r => `<tr><td>${r.day}</td><td>${r.total}</td><td>${r.completed ?? 0}</td></tr>`).join("")
                )}
            </div>
        `;

    } catch (error) {
        console.error("Unable to load reports:", error);
    }
}


/* ============================================================
   SETTINGS TAB — Upload CSV to replace a dataset
============================================================ */

const settingsUploadBtn = document.getElementById("settingsUploadBtn");

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
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/admin/datasets/upload`, {
                method: "POST",
                headers: adminHeaders(),
                body: formData,
            });

            const result = await response.json();

            msg.textContent = result.message ||
                (response.ok ? "Uploaded." : "Upload failed.");
            msg.style.color = response.ok ? "#16A34A" : "#DC2626";

            if (response.ok) {
                const datasetsPanel = document.getElementById("datasets");
                if (datasetsPanel) datasetsPanel.dataset.loaded = "";
                loadAdminDatasets();
            }

        } catch (error) {
            msg.textContent = "Upload failed. Please try again.";
            msg.style.color = "#DC2626";
        }
    });
}


/* ============================================================
   CREATE TOPIC DATASET
============================================================ */

const topicCountry = document.getElementById("topicCountry");
const topicLevel = document.getElementById("topicLevel");
const createTopicDatasetBtn = document.getElementById("createTopicDatasetBtn");

if (topicCountry && topicLevel) {
    topicCountry.addEventListener("change", () => {
        const country = topicCountry.value;

        let levels = [];

        if (country === "Nigeria") {
            levels = ["SS1", "SS2", "SS3"];
        }

        if (country === "UK") {
            levels = ["KS3", "KS4", "KS5"];
        }

        topicLevel.innerHTML = `
            <option value="">Select level</option>
            ${levels.map(level => `
                <option value="${level}">${level}</option>
            `).join("")}
        `;
    });
}

if (createTopicDatasetBtn) {
    createTopicDatasetBtn.addEventListener("click", async () => {

        const country = document.getElementById("topicCountry")?.value;
        const keyStage = document.getElementById("topicLevel")?.value;
        const subject = document.getElementById("topicSubject")?.value;
        const topic = document.getElementById("topicName")?.value.trim();
        const file = document.getElementById("topicDatasetFile")?.files?.[0];
        const message = document.getElementById("createTopicDatasetMessage");

        if (!country || !keyStage || !subject || !topic || !file) {
            message.textContent = "Complete all fields and choose a CSV file.";
            message.style.color = "#DC2626";
            return;
        }

        const formData = new FormData();

        formData.append("country", country);
        formData.append("key_stage", keyStage);
        formData.append("subject", subject);
        formData.append("topic", topic);
        formData.append("file", file);

        message.textContent = "Creating topic dataset…";
        message.style.color = "#64748B";

        try {
            const response = await fetch(
                `${window.APP_CONFIG.API_BASE_URL}/admin/datasets/topic`,
                {
                    method: "POST",
                    headers: adminHeaders(),
                    body: formData,
                }
            );

            const result = await response.json();

            if (!response.ok) {
                message.textContent =
                    result.message || "Unable to create topic dataset.";

                message.style.color = "#DC2626";
                return;
            }

            message.textContent =
                result.message || "Topic dataset created successfully.";

            message.style.color = "#16A34A";

            document.getElementById("topicName").value = "";
            document.getElementById("topicDatasetFile").value = "";

            const datasetsPanel = document.getElementById("datasets");

            if (datasetsPanel) {
                datasetsPanel.dataset.loaded = "";
            }

            loadAdminDatasets();

        } catch (error) {
            console.error("Create topic dataset error:", error);

            message.textContent = "Unable to create topic dataset.";
            message.style.color = "#DC2626";
        }
    });
}



document
    .getElementById("openDatasetUploadModal")
    ?.addEventListener("click", function () {

        document.getElementById("datasetUploadModal").style.display = "flex";

    });

document
    .getElementById("closeDatasetUploadModal")
    ?.addEventListener("click", function () {

        document.getElementById("datasetUploadModal").style.display = "none";

    });