document.addEventListener("DOMContentLoaded", () => {

    const cardsGrid =
        document.getElementById("cardsGrid");

    const stacksGrid =
        document.getElementById("stacksGrid");

    const banner =
        document.querySelector(".game-info-banner");

    const progressFill =
        document.querySelector(".gameplay-progress-fill");

    const progressText =
        document.querySelector(".gameplay-progress-text");

    const finishLevelBtn =
        document.getElementById("finishLevelBtn");

    const hintBtn =
        document.getElementById("hintBtn");

    const redealBtn =
        document.getElementById("redealBtn");

    const statValues =
        document.querySelectorAll(
            ".gameplay-stats .stat-value"
        );

    const scoreElement = statValues[0];
    const movesElement = statValues[1];
    const cardsElement = statValues[2];

    const params =
        new URLSearchParams(window.location.search);


    /* ========================================
       CURRENT DATASET
    ======================================== */

    const deck = "periodic-table-groups";

    // Current Periodic Table dataset is KS3 only
    const keyStage =
        params.get("key_stage") || "KS3";

    const difficulty =
        params.get("difficulty") || "easy";

    const level =
        parseInt(params.get("level")) || 1;


    const startedAt = Date.now();

    let selectedCard = null;

    let score = 0;
    let moves = 0;
    let cardsPlaced = 0;
    let incorrectMatches = 0;
    let hintsUsed = 0;
    let totalCards = 0;
    let allCategories = [];
    let unlockedCategoryCount = 2;


    /* ========================================
       CATEGORY COLOURS
    ======================================== */

    const categoryStyles = [
        {
            card: "card-pink",
            icon: "icon-pink",
            text: "text-pink"
        },
        {
            card: "card-blue",
            icon: "icon-blue",
            text: "text-blue"
        },
        {
            card: "card-green",
            icon: "icon-green",
            text: "text-green"
        },
        {
            card: "card-pink",
            icon: "icon-pink",
            text: "text-pink"
        }
    ];


    /* ========================================
       GENERIC CHEMISTRY ICON
    ======================================== */

    function chemistryIcon() {

        return `
            <svg viewBox="0 0 24 24" fill="none">
                <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    stroke-width="1.8"
                />

                <ellipse
                    cx="12"
                    cy="12"
                    rx="9"
                    ry="4"
                    stroke="currentColor"
                    stroke-width="1.5"
                />

                <ellipse
                    cx="12"
                    cy="12"
                    rx="9"
                    ry="4"
                    transform="rotate(60 12 12)"
                    stroke="currentColor"
                    stroke-width="1.5"
                />

                <ellipse
                    cx="12"
                    cy="12"
                    rx="9"
                    ry="4"
                    transform="rotate(120 12 12)"
                    stroke="currentColor"
                    stroke-width="1.5"
                />
            </svg>
        `;
    }


    /* ========================================
       UPDATE PROGRESS
    ======================================== */
function updateProgress() {

        const percentage =
            totalCards > 0
                ? (cardsPlaced / totalCards) * 100
                : 0;

        if (progressFill) {
            progressFill.style.width =
                `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent =
                `${cardsPlaced}/${totalCards}`;
        }

        if (cardsElement) {
            cardsElement.textContent =
                totalCards - cardsPlaced;
        }
    }


    /* ========================================
       RESET HINT
    ======================================== */

    function resetHintStates() {

        document
            .querySelectorAll(".card-hint")
            .forEach(card => {
                card.classList.remove("card-hint");
            });

        document
            .querySelectorAll(".stack-hint")
            .forEach(stack => {
                stack.classList.remove("stack-hint");
            });
    }


    /* ========================================
       CARD SELECTION
    ======================================== */

    function attachCardEvents() {

        const cards =
            document.querySelectorAll(".game-card");

        cards.forEach(card => {

            card.addEventListener("click", () => {

                resetHintStates();

                document
                    .querySelectorAll(".game-card")
                    .forEach(item => {
                        item.classList.remove(
                            "card-selected"
                        );
                    });

                card.classList.add(
                    "card-selected"
                );

                selectedCard = card;

                const cardName =
                    card.querySelector(".card-name")
                        ?.textContent
                        .trim();

                if (banner) {

                    banner.className =
                        "game-info-banner";

                    banner.textContent =
                        `${cardName} selected. Now choose a foundation stack.`;
                }

            });

        });
    }


    /* ========================================
       STACK EVENTS
    ======================================== */
function attachStackEvents() {

        const stacks =
            document.querySelectorAll(
                ".foundation-stack"
            );

        stacks.forEach(stack => {

            stack.addEventListener("click", () => {

                resetHintStates();

                if (!selectedCard) {

                    if (banner) {
                        banner.textContent =
                            "Select a chemistry card first.";
                    }

                    return;
                }


                moves++;

                if (movesElement) {
                    movesElement.textContent = moves;
                }


                const cardCategory =
                    selectedCard.dataset.categoryId;

                const stackCategory =
                    stack.dataset.categoryId;


                /* ============================
                   CORRECT MATCH
                ============================ */

                if (
                    cardCategory ===
                    stackCategory
                ) {

                    const cardName =
                        selectedCard
                            .querySelector(".card-name")
                            ?.textContent
                            .trim();

                    score += 10;
                    cardsPlaced++;


                    if (scoreElement) {
                        scoreElement.textContent =
                            score;
                    }


                    const countElement =
                        stack.querySelector(
                            ".stack-current-count"
                        );

                    if (countElement) {

                        const currentCount =
                            parseInt(
                                countElement.textContent
                            ) || 0;

                        countElement.textContent =
                            currentCount + 1;
                    }


                    // === FLYING ANIMATION ===
                    // 1. Get positions
                    const cardRect = selectedCard.getBoundingClientRect();
                    const stackRect = stack.getBoundingClientRect();
                    
                    // 2. Clone the card for animation
                    const flyingCard = selectedCard.cloneNode(true);
                    
                    // 3. Set starting position
                    flyingCard.style.position = 'fixed';
                    flyingCard.style.left = cardRect.left + 'px';
                    flyingCard.style.top = cardRect.top + 'px';
                    flyingCard.style.width = cardRect.width + 'px';
                    flyingCard.style.height = cardRect.height + 'px';
                    flyingCard.style.margin = '0';
                    flyingCard.style.zIndex = '9999';
                    flyingCard.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
                    flyingCard.style.pointerEvents = 'none';
                    
                    document.body.appendChild(flyingCard);
                    
                    // 4. Hide original card immediately so it doesn't leave a gap
                    selectedCard.style.visibility = 'hidden';
                    const cardToRemove = selectedCard;
                    selectedCard = null;

                    // 5. Trigger animation
                    requestAnimationFrame(() => {
                        flyingCard.style.left = (stackRect.left + (stackRect.width / 2) - (cardRect.width / 2)) + 'px';
                        flyingCard.style.top = (stackRect.top + (stackRect.height / 2) - (cardRect.height / 2)) + 'px';
                        flyingCard.style.transform = 'scale(0.3)';
                        flyingCard.style.opacity = '0';
                    });
                    
                    // 6. Cleanup after animation
                    setTimeout(() => {
                        flyingCard.remove();
                        cardToRemove.remove();
                        
                        updateProgress();

                        /* LEVEL COMPLETE */
                        /* ROUND COMPLETE */
                        if (cardsPlaced === totalCards) {
                        
                            if (unlockedCategoryCount < allCategories.length) {
                        
                                unlockedCategoryCount++;
                        
                                if (banner) {
                                    banner.className = "game-info-banner";
                                    banner.textContent =
                                        `Great work! Category ${unlockedCategoryCount} unlocked.`;
                                }
                        
                                setTimeout(() => {
                        
                                    renderBoard(
                                        { categories: allCategories },
                                        false
                                    );
                        
                                }, 900);
                        
                            } else {
                        
                                if (banner) {
                                    banner.className = "game-info-banner";
                                    banner.textContent =
                                        "Excellent! All categories completed 🎉";
                                        
                                        showGamePopup(
                                        "Congratulations! You completed all categories in this level. View your scores to see your progress.",
                                        "success"
                                    );
                                }
                        
                                    if (finishLevelBtn) {
                                    
                                        finishLevelBtn.disabled = false;
                                    
                                        finishLevelBtn.textContent = "View Scores";
                                    
                                        finishLevelBtn.style.display = "flex";
                                    
                                        finishLevelBtn.className =
                                            "bottom-game-btn shuffle-btn";
                                    }
                                    
                                    if (redealBtn) {
                                        redealBtn.style.display = "none";
                                    }
                                    
                                    if (hintBtn) {
                                        hintBtn.style.display = "none";
                                    }
                            }
                        
                        } else {
                            if (banner) {
                                banner.className = "game-info-banner";
                                banner.textContent = `Correct! ${cardName} has been placed successfully.`;
                            }
                        }
                    }, 500);
                }

                /* ============================
                   INCORRECT MATCH
                ============================ */

                else {
                    incorrectMatches++;
                    showGamePopup(
                        "Oops! That card does not belong to this category. Try again.",
                        "error"
                    );
                
                    if (banner) {
                
                        banner.className =
                            "game-info-banner";
                
                        banner.textContent =
                            "Not quite. Try another foundation stack.";
                    }
                }

            });

        });

    }


    /* ========================================
       RENDER BOARD
    ======================================== */
function renderBoard(board, resetGame = true) {

        cardsGrid.innerHTML = "";
        stacksGrid.innerHTML = "";

        selectedCard = null;
        cardsPlaced = 0;
        totalCards = 0;
        if (resetGame) {
            score = 0;
            moves = 0;
            incorrectMatches = 0;
            hintsUsed = 0;
        }


       allCategories = board.categories;
        allCategories
            .slice(0, unlockedCategoryCount)
            .forEach(
                (category, index) => {

                const style =
                    categoryStyles[
                        index %
                        categoryStyles.length
                    ];


                /* ============================
                   FOUNDATION STACK
                ============================ */

                const stack =
                    document.createElement("div");

                stack.className =
                    "foundation-stack";

                stack.dataset.categoryId =
                    String(category.id);
                    
                    

               stack.innerHTML = `
                    <div class="category-card-top">
                
                        <span class="category-crown">
                            ♛
                        </span>
                
                        <div class="category-progress">
                            <span class="stack-current-count">0</span>/<span>${category.cards.length}</span>
                        </div>
                
                    </div>
                
                    <div class="category-icon-circle">
                
                        ${chemistryIcon()}
                
                    </div>
                
                    <div class="stack-title">
                        ${category.name}
                    </div>
                
                    <div class="category-card-divider"></div>
                
                    <div class="category-bottom-badge">
                        ${category.name.charAt(0).toUpperCase()}
                    </div>
                `;

                stacksGrid.appendChild(stack);


                /* ============================
                   CARDS
                ============================ */

                category.cards.forEach(
                    cardText => {

                        totalCards++;

                        const card =
                            document.createElement(
                                "div"
                            );

                        card.className =
                            `game-card ${style.card}`;

                        card.dataset.categoryId =
                            String(category.id);

                        card.dataset.categoryName =
                            category.name;

                        card.innerHTML = `
                                <div class="card-name">
                                    ${cardText}
                                </div>
                            `;

                        cardsGrid.appendChild(card);
                    }
                );

            }
        );


        /* Shuffle all cards together */

        const cards =
            Array.from(cardsGrid.children);

        cards.sort(
            () => Math.random() - 0.5
        );

        cards.forEach(card => {
            cardsGrid.appendChild(card);
        });


        if (scoreElement) {
            scoreElement.textContent = score;
        }

        if (movesElement) {
            movesElement.textContent = moves;
        }

        if (cardsElement) {
            cardsElement.textContent =
                totalCards;
        }

        if (finishLevelBtn) {
            finishLevelBtn.disabled = true;
        }


        updateProgress();

        attachCardEvents();
        attachStackEvents();


        if (banner) {

            banner.className =
                "game-info-banner";

            banner.textContent =
                "Select a card from the deck, then tap a foundation stack.";
        }


        /* Update top title */

        const levelLabel =
            document.querySelector(
                ".level-label"
            );

        const levelTitle =
            document.querySelector(
                ".level-title"
            );

        if (levelLabel) {
            levelLabel.textContent =
                `LEVEL ${level}`;
        }

        if (levelTitle) {
            levelTitle.textContent =
                "Periodic Table & Groups";
        }

    }


    /* ========================================
       LOAD BOARD FROM DATABASE
    ======================================== */

    async function loadBoard() {

        if (!cardsGrid || !stacksGrid) {
            return;
        }


        if (banner) {
            banner.textContent =
                "Loading chemistry cards...";
        }


        try {

            const urlParamsLocal = new URLSearchParams(window.location.search);
            const subject = urlParamsLocal.get('subject') || 'chemistry';

            const url =
                `/api/${encodeURIComponent(subject)}/board` +
                `?deck=${encodeURIComponent(deck)}` +
                `&key_stage=${encodeURIComponent(keyStage)}` +
                `&difficulty=${encodeURIComponent(difficulty)}`;

            const response =
                await fetch(url, {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                });


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Unable to load the chemistry board."
                );
            }


            renderBoard(result.data);


        } catch (error) {

            console.error(
                "Board loading error:",
                error
            );

            if (banner) {

                banner.className =
                    "game-info-banner";

                banner.textContent =
                    error.message;
            }

        }

    }


    /* ========================================
       REDEAL
    ======================================== */
if (redealBtn) {

        redealBtn.addEventListener(
            "click",
            () => {

                resetHintStates();

                const remainingCards =
                    Array.from(
                        cardsGrid.children
                    );

                for (
                    let i =
                        remainingCards.length - 1;
                    i > 0;
                    i--
                ) {

                    const j =
                        Math.floor(
                            Math.random() *
                            (i + 1)
                        );

                    [
                        remainingCards[i],
                        remainingCards[j]
                    ] = [
                        remainingCards[j],
                        remainingCards[i]
                    ];
                }


                remainingCards.forEach(
                    card => {
                        cardsGrid.appendChild(card);
                    }
                );


                if (banner) {

                    banner.className =
                        "game-info-banner";

                    banner.textContent =
                        "Cards redealt. Select a card to continue.";
                }

            }
        );

    }


    /* ========================================
       HINT
    ======================================== */

    if (hintBtn) {

        hintBtn.addEventListener(
            "click",
            () => {

                resetHintStates();

                const availableCards =
                    Array.from(
                        document.querySelectorAll(
                            ".game-card"
                        )
                    );

                if (
                    availableCards.length === 0
                ) {
                    return;
                }


                hintsUsed++;


                const targetCard =
                    selectedCard ||
                    availableCards[0];

                const categoryId =
                    targetCard.dataset.categoryId;

                const categoryName =
                    targetCard.dataset.categoryName;


                const targetStack =
                    document.querySelector(
                        `.foundation-stack[data-category-id="${categoryId}"]`
                    );


                targetCard.classList.add(
                    "card-hint"
                );

                if (targetStack) {
                    targetStack.classList.add(
                        "stack-hint"
                    );
                }


                if (banner) {

                    banner.className =
                        "game-info-banner banner-hint";

                    banner.textContent =
                        `Hint: This card belongs to the ${categoryName} category.`;
                }

            }
        );

    }


    /* ========================================
       SAVE COMPLETED BOARD
    ======================================== */

    if (finishLevelBtn) {

        finishLevelBtn.addEventListener(
            "click",
            async () => {

                if (
                    cardsPlaced !== totalCards
                ) {
                    return;
                }


                const token =
                    localStorage.getItem(
                        "auth_token"
                    );


                if (!token) {

                    window.location.href =
                        "login.html";

                    return;
                }


                const timeSpent =
                    Math.floor(
                        (
                            Date.now() -
                            startedAt
                        ) / 1000
                    );


                finishLevelBtn.disabled =
                    true;


                try {

                    const response =
                        await fetch(
                            "/api/gameplay/attempt",
                            {
                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`
                                },

                                body:
                                    JSON.stringify({

                                        topic:
                                            deck,

                                        level:
                                            level,

                                        score:
                                            score,

                                        moves:
                                            moves,

                                        correct_matches:
                                            cardsPlaced,

                                        incorrect_matches:
                                            incorrectMatches,

                                        hints_used:
                                            hintsUsed,

                                        time_spent:
                                            timeSpent,

                                        retries:
                                            0,

                                        completed:
                                            true
                                    })
                            }
                        );


                    const result =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            result.message ||
                            "Unable to save your result."
                        );
                    }


                    localStorage.setItem(
                        "latest_game_result",
                        JSON.stringify(
                            result.data
                        )
                    );


                    window.location.href =
                        "results.html";


                } catch (error) {

                    alert(error.message);

                    finishLevelBtn.disabled =
                        false;
                }

            }
        );

    }





function showGamePopup(message, type = "success") {

    const oldPopup =
        document.getElementById("gamePopup");

    if (oldPopup) {
        oldPopup.remove();
    }

    const popup =
        document.createElement("div");

    popup.id = "gamePopup";

    popup.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(20,33,61,0.35);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:99999;
            padding:20px;
        ">

            <div style="
                width:100%;
                max-width:380px;
                background:#FFFFFF;
                border-radius:22px;
                padding:32px 28px;
                text-align:center;
                box-shadow:0 20px 60px rgba(20,33,61,0.18);
                font-family:Nunito,sans-serif;
            ">

                <div style="
                    width:62px;
                    height:62px;
                    margin:0 auto 18px;
                    border-radius:50%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:30px;
                    background:${type === "error" ? "#FEECEC" : "#FFF3C4"};
                ">
                    ${type === "error" ? "✕" : "🎉"}
                </div>

                <div style="
                    color:#14213D;
                    font-size:20px;
                    font-weight:900;
                    line-height:1.3;
                ">
                    ${message}
                </div>

                <button
                    type="button"
                    id="gamePopupClose"
                    style="
                        margin-top:24px;
                        min-width:130px;
                        height:46px;
                        border:0;
                        border-radius:999px;
                        background:#2563FF;
                        color:white;
                        font-family:Nunito,sans-serif;
                        font-size:14px;
                        font-weight:800;
                        cursor:pointer;
                    "
                >
                    Continue
                </button>

            </div>
        </div>
    `;

    document.body.appendChild(popup);

    document
        .getElementById("gamePopupClose")
        .addEventListener("click", () => {
            popup.remove();
        });
}

    /* ========================================
       START
    ======================================== */

    loadBoard();

});