document.addEventListener("DOMContentLoaded", () => {

    const savedResult =
        localStorage.getItem("latest_game_result");

    const savedUser =
        localStorage.getItem("user");

    if (!savedResult) {
        return;
    }

    const result = JSON.parse(savedResult);
    const user = savedUser
        ? JSON.parse(savedUser)
        : null;


    /* USER NAME */

    const displayName =
        user?.display_name ||
        user?.name?.split(" ")[0] ||
        "Student";


    /* RESULT VALUES */

    const score = Number(result.score || 0);
    const correct = Number(result.correct_matches || 0);
    const incorrect = Number(result.incorrect_matches || 0);
    const hints = Number(result.hints_used || 0);
    const timeSpent = Number(result.time_spent || 0);
    const level = Number(result.level || 1);

    const totalAttempts = correct + incorrect;

    const accuracy =
        totalAttempts > 0
            ? Math.round((correct / totalAttempts) * 100)
            : 100;


    /* FORMAT TIME */

    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    const formattedTime =
        `${minutes}m ${seconds}s`;


    /* COINS */

    const matchCoins = correct * 10;
    const completionBonus = result.completed
    ? Math.round((accuracy / 100) * 50)
    : 0;

    const timeBonus = timeSpent < 300 ? 10 : 0;

const coinsEarned =
    Number(result.coins_earned ?? (
        matchCoins +
        completionBonus +
        timeBonus
    ));

const coinBalance =
    Number(result.coin_balance || 0);


    /* HEADER */

    const subtitle =
        document.querySelector(".results-subtitle");

    if (subtitle) {
        subtitle.textContent =
            `Awesome Work, ${displayName}! You completed Level ${level} — Atomic Structure.`;
    }


    /* COINS */

    const coinsAmount =
        document.querySelector(".coins-amount");

    if (coinsAmount) {
        coinsAmount.textContent =
            `+${coinsEarned}`;
    }


    const breakdownValues =
        document.querySelectorAll(".breakdown-value");

    if (breakdownValues[0]) {
        breakdownValues[0].textContent =
            `+${matchCoins}`;
    }

    if (breakdownValues[1]) {
        breakdownValues[1].textContent =
            `+${completionBonus}`;
    }

    if (breakdownValues[2]) {
        breakdownValues[2].textContent =
            `+${timeBonus}`;
    }



const balanceElement =
    document.querySelector(".new-balance-value");

if (balanceElement) {
    balanceElement.innerHTML = `
        <svg class="coin-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8V16M10 10H14M10 14H14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"/>
        </svg>
        ${coinBalance.toLocaleString()}
    `;
}


    /* MAIN STATS */

    const statValues =
        document.querySelectorAll(
            ".stats-boxes .stat-box-value"
        );

    if (statValues[0]) {
        statValues[0].textContent =
            `${score} pts`;
    }

    if (statValues[1]) {
        statValues[1].textContent =
            `${correct} / 12`;
    }

    if (statValues[2]) {
        statValues[2].textContent =
            formattedTime;
    }

    if (statValues[3]) {
        statValues[3].textContent =
            `${hints} ${hints === 1 ? "hint" : "hints"}`;
    }


    /* SUMMARY */

    const summaryValues =
        document.querySelectorAll(".summary-val");

    if (summaryValues[0]) {
        summaryValues[0].textContent =
            `${correct}/12`;
    }

    if (summaryValues[1]) {
        summaryValues[1].textContent =
            `${accuracy}%`;
    }

const summaryCoinsEarned =
    document.getElementById("summaryCoinsEarned");

const summaryCoinBalance =
    document.getElementById("summaryCoinBalance");

if (summaryCoinsEarned) {
    summaryCoinsEarned.textContent =
        `+${coinsEarned}`;
}

if (summaryCoinBalance) {
    summaryCoinBalance.textContent =
        coinBalance.toLocaleString();
}


    /* REPLAY BUTTON */

    const replayLink =
        Array.from(
            document.querySelectorAll(".action-card")
        ).find(link =>
            link.textContent.includes("Deal Level 1 Again")
        );

    if (replayLink) {
        replayLink.href =
            "./gameplay.html?topic=atomic-structure&level=1";
    }

});