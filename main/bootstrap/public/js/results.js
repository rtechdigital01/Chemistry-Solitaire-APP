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
    const retries = Number(result.retries || 0);

    /* LEVEL / DECK CONTEXT — everything needed to build a correct
       "play again" / "next level" link back into gameplay.html. */
    const subject    = result.subject    || "chemistry";
    const deck       = result.deck       || result.topic || "periodic-table-groups";
    const keyStage   = result.key_stage  || "KS3";
    const difficulty = result.difficulty || "easy";

    // The total card count for THIS level (varies per board — never
    // assume a fixed number). Fall back to correct+incorrect only if
    // the server/local payload genuinely didn't carry it.
    const totalCards = Number(result.total_cards || (correct + incorrect) || correct || 1);

    const MAX_LEVELS_PER_DIFFICULTY = Number(result.max_levels_per_difficulty || 10);
    const DIFFICULTY_ORDER = ["easy", "medium", "hard"];

    function buildGameplayUrl(diff, lvl) {
        return `gameplay.html?subject=${encodeURIComponent(subject)}`
            + `&deck=${encodeURIComponent(deck)}`
            + `&key_stage=${encodeURIComponent(keyStage)}`
            + `&difficulty=${encodeURIComponent(diff)}`
            + `&level=${lvl}`;
    }

    function capitalize(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    function deckTitle(slug) {
        return slug
            .split("-")
            .map(capitalize)
            .join(" ");
    }

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
            `Awesome Work, ${displayName}! You completed Level ${level} — ${deckTitle(deck)}.`;
    }

    const matchBreakdownLabel = document.getElementById("matchBreakdownLabel");
    if (matchBreakdownLabel) {
        matchBreakdownLabel.textContent = `Correct matches (${correct} × 10)`;
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
            `${correct} / ${totalCards}`;
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
            `${correct}/${totalCards}`;
    }

    const summaryTitle = document.getElementById("summaryTitle");
    if (summaryTitle) {
        summaryTitle.textContent = `Level ${level} Complete`;
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


    /* REPLAY — same level, same deck/difficulty, just re-dealt */

    const replayCard    = document.getElementById("replayCard");
    const replayHeading = document.getElementById("replayHeading");

    if (replayCard) {
        replayCard.href = buildGameplayUrl(difficulty, level);
    }
    if (replayHeading) {
        replayHeading.textContent = retries > 0
            ? `Play Level ${level} Again (Attempt ${retries + 1})`
            : `Play Level ${level} Again`;
    }


    /* NEXT LEVEL — a real, working action instead of a hardcoded
       "coming soon" lock. Every difficulty tier supports up to
       MAX_LEVELS_PER_DIFFICULTY levels (the dataset has far more
       categories than that; the cap just keeps progression sane).
       Three real states:
         1. More levels left at this difficulty  -> go to level + 1.
         2. This difficulty maxed, a harder tier exists -> offer it.
         3. Every tier maxed -> genuine "all levels complete" state.
    */

    const nextLevelCard        = document.getElementById("nextLevelCard");
    const nextLevelIcon        = document.getElementById("nextLevelIcon");
    const nextLevelHeading     = document.getElementById("nextLevelHeading");
    const nextLevelSubheading  = document.getElementById("nextLevelSubheading");
    const nextLevelArrow       = document.getElementById("nextLevelArrow");

    if (nextLevelCard) {
        const tierIndex = DIFFICULTY_ORDER.indexOf(difficulty);

        if (level < MAX_LEVELS_PER_DIFFICULTY) {
            // 1. More levels left at this difficulty.
            nextLevelCard.href = buildGameplayUrl(difficulty, level + 1);
            if (nextLevelHeading) nextLevelHeading.textContent = `Next: Level ${level + 1}`;
            if (nextLevelSubheading) nextLevelSubheading.textContent =
                `Continue at ${capitalize(difficulty)} difficulty`;

        } else if (tierIndex >= 0 && tierIndex < DIFFICULTY_ORDER.length - 1) {
            // 2. Difficulty maxed — offer the next tier, fresh at level 1.
            const nextDifficulty = DIFFICULTY_ORDER[tierIndex + 1];
            nextLevelCard.href = buildGameplayUrl(nextDifficulty, 1);
            if (nextLevelHeading) nextLevelHeading.textContent = `Try ${capitalize(nextDifficulty)} Difficulty`;
            if (nextLevelSubheading) nextLevelSubheading.textContent =
                `You've completed all ${MAX_LEVELS_PER_DIFFICULTY} ${capitalize(difficulty)} levels!`;

        } else {
            // 3. Every tier maxed — a genuine "no more levels" state,
            // not a permanent placeholder lock.
            nextLevelCard.removeAttribute("href");
            nextLevelCard.classList.remove("action-primary");
            nextLevelCard.classList.add("action-locked");
            if (nextLevelIcon) {
                nextLevelIcon.classList.remove("bg-blue");
                nextLevelIcon.classList.add("bg-gray-locked");
            }
            if (nextLevelHeading) nextLevelHeading.textContent = "All Levels Complete!";
            if (nextLevelSubheading) nextLevelSubheading.textContent =
                "You've mastered every difficulty — amazing work!";
            if (nextLevelArrow) {
                nextLevelArrow.style.display = "none";
                const badge = document.createElement("div");
                badge.className = "action-badge";
                badge.textContent = "Mastered";
                nextLevelArrow.after(badge);
            }
        }
    }

});