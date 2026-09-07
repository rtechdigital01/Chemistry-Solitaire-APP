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
                        if (cardsPlaced === totalCards) {
                            if (banner) {
                                banner.className = "game-info-banner";
                                banner.textContent = "Excellent! Board completed 🎉";
                            }
                            if (finishLevelBtn) {
                                finishLevelBtn.disabled = false;
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
function renderBoard(board) {

        cardsGrid.innerHTML = "";
        stacksGrid.innerHTML = "";

        selectedCard = null;

        score = 0;
        moves = 0;
        cardsPlaced = 0;
        incorrectMatches = 0;

        totalCards = 0;


        board.categories.forEach(
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
                    <div class="stack-title">
                        ${category.name}
                    </div>

                    <div class="stack-count ${style.text}">
                        <span class="stack-current-count">
                            0
                        </span>

                        <span class="count-total">
                            /${category.cards.length}
                        </span>
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
                            <div class="card-icon-top">
                                ${chemistryIcon()}
                            </div>

                            <div class="card-icon-center ${style.icon}">
                                ${chemistryIcon()}
                            </div>

                            <div class="card-name">
                                ${cardText}
                            </div>

                            <div class="card-category ${style.text}">
                                ${category.name.toUpperCase()}
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
            scoreElement.textContent = "0";
        }

        if (movesElement) {
            movesElement.textContent = "0";
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


    /* ========================================
       START
    ======================================== */

    loadBoard();

});