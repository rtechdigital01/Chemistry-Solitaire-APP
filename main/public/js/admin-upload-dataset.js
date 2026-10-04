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

const topicCountry = document.getElementById("topicCountry");
const topicLevel = document.getElementById("topicLevel");
const createTopicDatasetBtn = document.getElementById("createTopicDatasetBtn");

if (topicCountry && topicLevel) {
    topicCountry.addEventListener("change", () => {
        let levels = [];

        if (topicCountry.value === "Nigeria") {
            levels = ["SS1", "SS2", "SS3"];
        }

        if (topicCountry.value === "UK") {
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

        message.textContent = "Creating and uploading dataset…";
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
                    result.message || "Unable to create dataset.";

                message.style.color = "#DC2626";
                return;
            }

            message.textContent =
                result.message || "Dataset created successfully.";

            message.style.color = "#16A34A";

            setTimeout(() => {
                window.location.href = "admin-dashboard.html";
            }, 900);

        } catch (error) {
            console.error("Create topic dataset error:", error);

            message.textContent = "Unable to create dataset.";
            message.style.color = "#DC2626";
        }
    });
}