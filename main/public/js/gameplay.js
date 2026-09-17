document.addEventListener("DOMContentLoaded", () => {

    /* ============================================================
       DOM REFS
    ============================================================ */

    const cardsGrid   = document.getElementById("cardsGrid");
    const stacksGrid  = document.getElementById("stacksGrid");
    const banner      = document.querySelector(".game-info-banner");
    const progressFill= document.querySelector(".gameplay-progress-fill");
    const progressText= document.querySelector(".gameplay-progress-text");
    const finishLevelBtn = document.getElementById("finishLevelBtn");
    const hintBtn     = document.getElementById("hintBtn");
    const redealBtn   = document.getElementById("redealBtn");
    const nextLevelBtn= document.getElementById("nextLevelBtn");
    const restartBtn  = document.getElementById("restartBtn");
    const shuffleDeckBtn = document.getElementById("shuffleDeckBtn");
    const pointsBadge    = document.getElementById("pointsValueBadge");

    const statValues = document.querySelectorAll(".gameplay-stats .stat-value");
    const scoreElement = statValues[0];
    const movesElement = statValues[1];
    const cardsElement = statValues[2];

    /* ============================================================
       URL PARAMS
    ============================================================ */

    const params     = new URLSearchParams(window.location.search);
    const subject    = params.get("subject")    || "chemistry";
    const deck       = params.get("deck")       || "periodic-table-groups";
    const keyStage   = params.get("key_stage")  || "KS3";
    const difficulty = params.get("difficulty") || "easy";
    const level      = parseInt(params.get("level")) || 1;

    /* ============================================================
       GAME STATE
    ============================================================ */

    const startedAt   = Date.now();
    let selectedCard  = null;
    let score         = 0;
    let moves         = 0;
    let cardsPlaced   = 0;
    let incorrectMatches = 0;
    let hintsUsed     = 0;
    let totalCards    = 0;
    let allCategories = [];
    let unlockedCategoryCount = 2;

    /* ============================================================
       ICON TYPE → SVG MAP
    ============================================================ */

    const iconSVG = {
        element: `<svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
            <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" stroke-width="1.5"/>
            <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" stroke="currentColor" stroke-width="1.5"/>
            <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)" stroke="currentColor" stroke-width="1.5"/>
        </svg>`,

        chemical: `<svg viewBox="0 0 24 24" fill="none">
            <path d="M9 3v8L5 18a2 2 0 001.8 2.9h10.4A2 2 0 0019 18l-4-7V3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 3h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="9" cy="16" r="1" fill="currentColor"/>
            <circle cx="14" cy="14" r="1" fill="currentColor"/>
        </svg>`,

        physical: `<svg viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8"/>
            <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8"/>
            <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8"/>
            <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.8"/>
        </svg>`,

        information: `<svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
            <path d="M12 11v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="8" r="1" fill="currentColor"/>
        </svg>`,

        trends: `<svg viewBox="0 0 24 24" fill="none">
            <path d="M4 18L9 13l4 3 7-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 8h4v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

        uses: `<svg viewBox="0 0 24 24" fill="none">
            <path d="M9.5 2a7 7 0 000 14h5a7 7 0 000-14h-5z" stroke="currentColor" stroke-width="1.8"/>
            <path d="M12 16v6M9 19h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>`,

        compounds: `<svg viewBox="0 0 24 24" fill="none">
            <circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.7"/>
            <circle cx="16" cy="16" r="4" stroke="currentColor" stroke-width="1.7"/>
            <path d="M11.5 11.5l1 1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>`,

        isotopes: `<svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 2"/>
            <circle cx="12" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="21" cy="12" r="1.5" fill="currentColor"/>
        </svg>`,

        production: `<svg viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="4" height="10" rx="1" stroke="currentColor" stroke-width="1.7"/>
            <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" stroke-width="1.7"/>
            <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" stroke-width="1.7"/>
        </svg>`,

        occurrence: `<svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="10" r="6" stroke="currentColor" stroke-width="1.8"/>
            <path d="M12 16v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M4 20c0-3 3.6-4 8-4s8 1 8 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>`,
    };

    /* ============================================================
       CATEGORY COLOUR THEMES
    ============================================================ */

    const categoryThemes = [
        { bg: "#FFF3F3", border: "#FFC5C5", icon: "#FF6B6B", iconBg: "#FFE8E8" },
        { bg: "#EFF6FF", border: "#BFDBFE", icon: "#2563EB", iconBg: "#DBEAFE" },
        { bg: "#F0FDF4", border: "#BBF7D0", icon: "#16A34A", iconBg: "#DCFCE7" },
        { bg: "#FFF8E7", border: "#FDE68A", icon: "#D97706", iconBg: "#FEF3C7" },
    ];

    /* ============================================================
       HELPERS
    ============================================================ */

    function setBanner(text, type = "info") {
        if (!banner) return;
        banner.className = "game-info-banner";
        if (type === "error") banner.style.background = "linear-gradient(90deg,#FFECEC,#FFE0E0)";
        else if (type === "success") banner.style.background = "linear-gradient(90deg,#ECFFF3,#D9FFE8)";
        else banner.style.background = "";
        banner.textContent = text;
    }

    function updateScore() {
        if (scoreElement) scoreElement.textContent = score;
        if (pointsBadge)  pointsBadge.textContent  = score;
    }

    function updateProgress() {
        const pct = totalCards > 0 ? (cardsPlaced / totalCards) * 100 : 0;
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressText) progressText.textContent = `${cardsPlaced}/${totalCards}`;
        if (cardsElement) cardsElement.textContent = totalCards - cardsPlaced;
    }

    function resetHintStates() {
        document.querySelectorAll(".card-hint").forEach(c => c.classList.remove("card-hint"));
        document.querySelectorAll(".stack-hint").forEach(s => s.classList.remove("stack-hint"));
    }

    /* ============================================================
       DIFFICULTY LABEL
    ============================================================ */

    const difficultyLabels = { easy: "Easy", medium: "Medium", hard: "Hard" };

    function updateTopBar() {
        const levelLabel = document.querySelector(".level-label");
        const levelTitle = document.querySelector(".level-title");
        if (levelLabel) levelLabel.textContent = `${keyStage} · ${difficultyLabels[difficulty] || difficulty.toUpperCase()}`;
        if (levelTitle) levelTitle.textContent = "Periodic Table & Groups";
    }

    /* ============================================================
       CARD FLYING ANIMATION
    ============================================================ */

    function flyCardToStack(cardEl, stackEl, onDone) {
        const cardRect  = cardEl.getBoundingClientRect();
        const stackRect = stackEl.getBoundingClientRect();

        const flyEl = cardEl.cloneNode(true);
        flyEl.style.cssText = `
            position: fixed;
            left: ${cardRect.left}px;
            top:  ${cardRect.top}px;
            width: ${cardRect.width}px;
            height: ${cardRect.height}px;
            margin: 0;
            z-index: 9999;
            pointer-events: none;
            transition: left 0.45s cubic-bezier(.25,1,.5,1),
                        top  0.45s cubic-bezier(.25,1,.5,1),
                        transform 0.45s ease,
                        opacity 0.45s ease;
        `;
        document.body.appendChild(flyEl);

        // Make original invisible (but keep space)
        cardEl.style.opacity = "0";
        cardEl.style.pointerEvents = "none";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const tx = stackRect.left + stackRect.width  / 2 - cardRect.width  / 2;
                const ty = stackRect.top  + stackRect.height / 2 - cardRect.height / 2;
                flyEl.style.left      = tx + "px";
                flyEl.style.top       = ty + "px";
                flyEl.style.transform = "scale(0.25) rotate(10deg)";
                flyEl.style.opacity   = "0";
            });
        });

        setTimeout(() => {
            flyEl.remove();
            cardEl.remove();
            if (onDone) onDone();
        }, 480);
    }

    /* ============================================================
       STACK PULSE (on correct match)
    ============================================================ */

    function pulseStack(stackEl) {
        stackEl.classList.add("stack-pulse");
        setTimeout(() => stackEl.classList.remove("stack-pulse"), 500);
    }

    /* ============================================================
       CARD DEAL ANIMATION
    ============================================================ */

    function animateDealCards() {
        const cards = cardsGrid.querySelectorAll(".game-card");
        cards.forEach((card, i) => {
            card.style.opacity   = "0";
            card.style.transform = "translateY(30px) scale(0.92)";
            card.style.transition = "none";
            setTimeout(() => {
                card.style.transition = "opacity 0.35s ease, transform 0.35s ease";
                card.style.opacity    = "1";
                card.style.transform  = "translateY(0) scale(1)";
            }, i * 60);
        });
    }

    /* ============================================================
       ATTACH CARD EVENTS
    ============================================================ */

    function attachCardEvents() {
        cardsGrid.querySelectorAll(".game-card").forEach(card => {
            // Skip if already wired or face-down
            if (card.dataset.eventsAttached) return;
            card.dataset.eventsAttached = "1";

            // — drag start (only face-up cards are draggable) —
            card.addEventListener("dragstart", e => {
                if (card.classList.contains("card-face-down")) { e.preventDefault(); return; }
                resetHintStates();
                deselectAll();
                card.classList.add("card-selected");
                selectedCard = card;
                e.dataTransfer.setData("text/plain", card.dataset.categoryId);

                const name = card.querySelector(".card-name")?.textContent.trim();
                setBanner(`"${name}" selected — drop it on a matching category.`);

                setTimeout(() => card.style.opacity = "0.45", 0);
            });

            card.addEventListener("dragend", () => {
                card.style.opacity = "1";
            });

            // — click —
            card.addEventListener("click", () => {
                if (card.classList.contains("card-face-down")) return;
                resetHintStates();
                const wasSelected = card.classList.contains("card-selected");
                deselectAll();

                if (wasSelected) return; // toggle off

                card.classList.add("card-selected");
                selectedCard = card;

                const name = card.querySelector(".card-name")?.textContent.trim();
                setBanner(`"${name}" selected — now tap a category above.`);
            });
        });
    }

    function deselectAll() {
        selectedCard = null;
        document.querySelectorAll(".game-card").forEach(c => c.classList.remove("card-selected"));
    }

    /* ============================================================
       POSITION CARDS IN A PILE (shared helper)
       idx 0 = bottom, last = top (face-up)
    ============================================================ */

    function positionPileCards(container) {
        const cards = Array.from(container.querySelectorAll(".game-card"));
        const OFFSET = 14; // px each card peeks below the next
        cards.forEach((c, idx) => {
            c.style.top = `${idx * OFFSET}px`;
            c.style.zIndex = String(idx + 1);
            if (idx < cards.length - 1) {
                c.classList.add("card-face-down");
                c.draggable = false;
            } else {
                c.classList.remove("card-face-down");
                c.draggable = true;
            }
        });
        // Give the container enough height to show the whole top card
        if (cards.length > 0) {
            container.style.minHeight = `${(cards.length - 1) * OFFSET + 220}px`;
        }
        attachCardEvents();
    }

    /* ============================================================
       REVEAL TOP CARDS (after a card is played)
    ============================================================ */

    function revealTopCards() {
        // Cover all pile types: card-pile and stock-pile
        cardsGrid.querySelectorAll(".card-pile, .stock-pile").forEach(container => {
            const cards = container.querySelectorAll(".game-card");
            if (cards.length > 0) {
                const topCard = cards[cards.length - 1];
                if (topCard.classList.contains("card-face-down")) {
                    topCard.classList.remove("card-face-down");
                    topCard.draggable = true;
                }
            }
        });
    }

    /* ============================================================
       ATTEMPT MATCH
    ============================================================ */

    function attemptMatch(stackEl) {
        resetHintStates();

        if (!selectedCard) {
            setBanner("Pick a card from the hand below first.", "error");
            return;
        }

        moves++;
        if (movesElement) movesElement.textContent = moves;

        const cardCat  = selectedCard.dataset.categoryId;
        const stackCat = stackEl.dataset.categoryId;

        if (cardCat === stackCat) {
            // ✅ CORRECT
            score += 10;
            cardsPlaced++;
            updateScore();

            // Update stack count
            const countEl = stackEl.querySelector(".stack-current-count");
            if (countEl) countEl.textContent = parseInt(countEl.textContent || "0") + 1;

            const cardName = selectedCard.querySelector(".card-name")?.textContent.trim();
            const cardToRemove = selectedCard;
            selectedCard = null;

            pulseStack(stackEl);

            flyCardToStack(cardToRemove, stackEl, () => {
                updateProgress();
                revealTopCards();
                onCardPlaced(cardName);
            });

        } else {
            // ❌ WRONG
            incorrectMatches++;
            selectedCard.classList.remove("card-selected");
            selectedCard.classList.add("card-shake");
            setTimeout(() => selectedCard?.classList.remove("card-shake"), 600);

            setBanner("Not quite — try a different category.", "error");
            showGamePopup("That card doesn't belong in this category. Give it another try!", "error");
        }
    }

    /* ============================================================
       SUBMIT SCORE + NAVIGATE TO RESULTS
    ============================================================ */

    async function submitAndGoToResults() {
        const timeSpent = Math.floor((Date.now() - startedAt) / 1000);
        const token = localStorage.getItem("auth_token");

        // Always store result locally so results.html can read it even without auth
        const localResult = {
            topic:             deck,
            level,
            score,
            moves,
            correct_matches:   cardsPlaced,
            incorrect_matches: incorrectMatches,
            hints_used:        hintsUsed,
            time_spent:        timeSpent,
            completed:         true,
            difficulty,
            key_stage:         keyStage,
        };
        localStorage.setItem("latest_game_result", JSON.stringify(localResult));

        // Try to persist to the API if logged in
        if (token) {
            try {
                const res = await fetch("/api/gameplay/attempt", {
                    method: "POST",
                    headers: {
                        "Content-Type":  "application/json",
                        "Accept":        "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(localResult),
                });
                if (res.ok) {
                    const result = await res.json();
                    if (result.data) {
                        localStorage.setItem("latest_game_result", JSON.stringify({ ...localResult, ...result.data }));
                    }
                }
            } catch (_) {
                // Silently ignore — we navigate regardless
            }
        }

        window.location.href = "results.html";
    }

    /* ============================================================
       FULL-SCREEN CONGRATULATIONS OVERLAY
    ============================================================ */

    function showCongratsAndRedirect() {
        // Freeze the board
        document.querySelectorAll(".game-card").forEach(c => {
            c.style.pointerEvents = "none";
        });

        const overlay = document.createElement("div");
        overlay.id = "congratsOverlay";
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 99999;
            background: rgba(14, 30, 65, 0.82);
            backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            animation: popupFadeIn 0.35s ease;
        `;

        overlay.innerHTML = `
            <div style="
                background: #FFF;
                border-radius: 28px;
                padding: 44px 36px 36px;
                max-width: 420px; width: 92%;
                text-align: center;
                box-shadow: 0 32px 80px rgba(14,30,65,0.28);
                font-family: Nunito, sans-serif;
                animation: popupSlideUp 0.3s ease;
            ">
                <div style="font-size: 64px; margin-bottom: 16px; line-height: 1;">🎉</div>
                <h2 style="margin: 0 0 10px; color: #14213D; font-size: 26px; font-weight: 900;">
                    Level Complete!
                </h2>
                <p style="margin: 0 0 6px; color: #4B5563; font-size: 15px; font-weight: 600; line-height: 1.5;">
                    You matched all <strong>${cardsPlaced}</strong> cards correctly in <strong>${moves}</strong> moves.
                </p>
                <div style="
                    display: flex; justify-content: center; gap: 28px;
                    margin: 22px 0 28px;
                    padding: 16px 20px;
                    background: #F8FAFF;
                    border-radius: 16px;
                    border: 1px solid #E2EEFF;
                ">
                    <div style="text-align:center;">
                        <div style="font-size: 26px; font-weight: 900; color: #F89E19;">${score}</div>
                        <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Points</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size: 26px; font-weight: 900; color: #2563EB;">${moves}</div>
                        <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Moves</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size: 26px; font-weight: 900; color: #16A34A;">${cardsPlaced}</div>
                        <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px;">Cards</div>
                    </div>
                </div>
                <button id="congratsGoBtn" style="
                    width: 100%; height: 52px;
                    border: none; border-radius: 999px;
                    background: linear-gradient(135deg, #2563EB, #1D4ED8);
                    color: #FFF;
                    font-family: Nunito, sans-serif;
                    font-size: 16px; font-weight: 900;
                    cursor: pointer;
                    box-shadow: 0 8px 20px rgba(37,99,255,0.3);
                    transition: opacity 0.15s;
                ">View My Results →</button>
                <p id="congratsCountdown" style="
                    margin: 12px 0 0;
                    font-size: 12px; font-weight: 700;
                    color: #94A3B8;
                ">Redirecting in 5s…</p>
            </div>
        `;

        document.body.appendChild(overlay);

        // Countdown redirect
        let secs = 5;
        const countdownEl = overlay.querySelector("#congratsCountdown");
        const timer = setInterval(() => {
            secs--;
            if (countdownEl) countdownEl.textContent = `Redirecting in ${secs}s…`;
            if (secs <= 0) {
                clearInterval(timer);
                submitAndGoToResults();
            }
        }, 1000);

        overlay.querySelector("#congratsGoBtn").addEventListener("click", () => {
            clearInterval(timer);
            submitAndGoToResults();
        });
    }

    /* ============================================================
       AFTER A CARD IS PLACED
    ============================================================ */

    function onCardPlaced(cardName) {
        const remaining = cardsGrid.querySelectorAll(".game-card").length;

        if (remaining === 0) {
            // All cards placed — go to results immediately
            setBanner("🎊 All cards matched! Taking you to results…", "success");
            setTimeout(() => showCongratsAndRedirect(), 600);
        } else {
            setBanner(`✓ "${cardName}" placed! ${remaining} card${remaining !== 1 ? "s" : ""} left.`, "success");
        }
    }

    /* ============================================================
       ATTACH STACK EVENTS
    ============================================================ */

    function attachStackEvents() {
        stacksGrid.querySelectorAll(".foundation-stack").forEach(stack => {

            stack.addEventListener("dragover",  e => { e.preventDefault(); stack.classList.add("stack-drag-over"); });
            stack.addEventListener("dragleave", ()  => stack.classList.remove("stack-drag-over"));
            stack.addEventListener("drop", e => {
                e.preventDefault();
                stack.classList.remove("stack-drag-over");
                attemptMatch(stack);
            });

            stack.addEventListener("click", () => attemptMatch(stack));
        });
    }

    /* ============================================================
       BUILD FOUNDATION STACK CARD
    ============================================================ */

    function buildStackCard(category, theme) {
        const icon = iconSVG[category.icon_type] || iconSVG.element;

        const stack = document.createElement("div");
        stack.className           = "foundation-stack";
        stack.dataset.categoryId  = String(category.id);

        stack.innerHTML = `
            <div class="category-card-top" style="background: ${theme.iconBg}; border-bottom-color: ${theme.border};">
                <span class="category-crown">♛</span>
                <div class="category-progress">
                    <span class="stack-current-count">0</span>/${category.cards.length}
                </div>
            </div>

            <div class="category-icon-circle" style="background: ${theme.iconBg}; color: ${theme.icon};">
                ${icon}
            </div>

            <div class="stack-title">${category.name}</div>

            <div class="category-card-divider"></div>

            <div class="category-bottom-badge" style="background: ${theme.iconBg}; color: ${theme.icon};">
                ${category.icon_type.charAt(0).toUpperCase()}
            </div>
        `;

        return stack;
    }

    /* ============================================================
       BUILD GAME CARD
    ============================================================ */

    function buildGameCard(cardText, category) {
        const card = document.createElement("div");
        card.className           = "game-card";
        card.dataset.categoryId  = String(category.id);
        card.dataset.categoryName= category.name;

        // Neutral cream — NO category colour (avoid giving the student a hint)
        card.innerHTML = `
            <span class="card-crown">♥</span>
            <div class="card-name">${cardText}</div>
        `;

        return card;
    }

    /* ============================================================
       RENDER BOARD
    ============================================================ */

    function renderBoard(board, resetGame = true) {
        cardsGrid.innerHTML  = "";
        stacksGrid.innerHTML = "";

        selectedCard  = null;
        cardsPlaced   = 0;
        totalCards    = 0;

        if (resetGame) {
            score = 0;
            moves = 0;
            incorrectMatches = 0;
            hintsUsed = 0;
        }

        allCategories = board.categories;

        const visibleCategories = allCategories.slice(0, unlockedCategoryCount);

        // Collect all cards (no theme colours on cards)
        const allCardEls = [];

        visibleCategories.forEach((category, idx) => {
            const theme = categoryThemes[idx % categoryThemes.length];

            // Foundation stack still uses theme colours — correct placement reveals colours
            const stack = buildStackCard(category, theme);
            stacksGrid.appendChild(stack);

            // Build neutral cards
            category.cards.forEach(cardText => {
                totalCards++;
                const card = buildGameCard(cardText, category);
                allCardEls.push(card);
            });
        });

        // Shuffle all cards
        for (let i = allCardEls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCardEls[i], allCardEls[j]] = [allCardEls[j], allCardEls[i]];
        }

        // Split: first 4 × CARDS_PER_PILE go into the 4 main piles
        // remaining cards go into the stock pile
        const CARDS_PER_PILE = Math.max(1, Math.ceil(allCardEls.length / 5)); // keep some for stock
        const pileCards  = allCardEls.slice(0, CARDS_PER_PILE * 4);
        const stockCards = allCardEls.slice(CARDS_PER_PILE * 4);

        // Create 4 main piles
        const piles = Array.from({ length: 4 }, () => {
            const p = document.createElement("div");
            p.className = "card-pile";
            cardsGrid.appendChild(p);
            return p;
        });

        // Distribute pile cards evenly
        pileCards.forEach((card, idx) => {
            piles[idx % 4].appendChild(card);
        });

        // Apply offsets and face-down to main piles
        piles.forEach(pile => positionPileCards(pile));

        // Create the stock pile (with face-up top card)
        if (stockCards.length > 0) {
            const stockCol = document.createElement("div");
            stockCol.className = "stock-pile";
            stockCol.id = "stockPileEl";
            cardsGrid.appendChild(stockCol);

            stockCards.forEach(card => stockCol.appendChild(card));
            positionPileCards(stockCol);
        }

        // Update stat elements
        updateScore();
        if (movesElement) movesElement.textContent = moves;
        if (finishLevelBtn) finishLevelBtn.disabled = true;
        if (nextLevelBtn)   nextLevelBtn.disabled = true;

        updateProgress();
        updateTopBar();
        attachCardEvents();
        attachStackEvents();

        setBanner("Select a card from the hand below, then tap a category above.");

        // Deal animation
        animateDealCards();
    }

    /* ============================================================
       LOAD BOARD FROM API
    ============================================================ */

    async function loadBoard() {
        if (!cardsGrid || !stacksGrid) return;

        setBanner("Loading chemistry cards…");

        try {
            const url = `/api/${encodeURIComponent(subject)}/board`
                + `?deck=${encodeURIComponent(deck)}`
                + `&key_stage=${encodeURIComponent(keyStage)}`
                + `&difficulty=${encodeURIComponent(difficulty)}`;

            const res    = await fetch(url, { headers: { Accept: "application/json" } });
            const result = await res.json();

            if (!res.ok) throw new Error(result.message || "Unable to load the chemistry board.");

            renderBoard(result.data);

        } catch (err) {
            console.error("Board loading error:", err);
            setBanner(err.message || "Failed to load cards. Please try again.", "error");

            // Offline / dev fallback — build from hardcoded KS3 data
            renderBoard(fallbackBoard(difficulty));
        }
    }

    /* ============================================================
       FALLBACK BOARD (offline / dev)
    ============================================================ */

    function fallbackBoard(diff) {
        const easy = [
            { id: "1", name: "Group 1 Elements",  icon_type: "element",     cards: ["Lithium", "Sodium", "Potassium", "Francium"] },
            { id: "2", name: "Group 7 Elements",  icon_type: "element",     cards: ["Fluorine", "Chlorine", "Bromine", "Iodine"] },
            { id: "3", name: "Group 0 Elements",  icon_type: "element",     cards: ["Helium", "Neon", "Argon", "Krypton"] },
            { id: "4", name: "Periodic Table",    icon_type: "information", cards: ["Groups", "Periods", "Elements", "Metals"] },
        ];
        const medium = [
            { id: "1", name: "Group 1 Physical Props", icon_type: "physical", cards: ["Soft", "Silvery", "Low density", "Low melting point"] },
            { id: "2", name: "Group 7 Physical Props", icon_type: "physical", cards: ["Coloured", "Diatomic", "Non-metal", "Low boiling point"] },
            { id: "3", name: "Group 0 Physical Props", icon_type: "physical", cards: ["Colourless", "Monatomic", "Odourless", "Gases"] },
            { id: "4", name: "Periodic Trends",        icon_type: "trends",   cards: ["Atomic Radius", "Ionisation Energy", "Electronegativity", "Shielding"] },
        ];
        const hard = [
            { id: "1", name: "Group 1 Chem Props",  icon_type: "chemical",  cards: ["Reacts with water", "Produces hydrogen", "Forms +1 ions", "Loses one electron"] },
            { id: "2", name: "Group 7 Chem Props",  icon_type: "chemical",  cards: ["Forms -1 ions", "Gains one electron", "Strong oxidising agents", "Forms salts"] },
            { id: "3", name: "Group 0 Chem Props",  icon_type: "chemical",  cards: ["Very unreactive", "Full outer shell", "Stable", "Non-flammable"] },
            { id: "4", name: "Advanced Vocabulary", icon_type: "information", cards: ["Ionisation energy", "Electronegativity", "Shielding", "Nuclear charge"] },
        ];

        const poolMap = { easy, medium, hard };
        return { difficulty: diff, key_stage: "KS3", categories: poolMap[diff] || easy };
    }

    /* ============================================================
       SHUFFLE (REDEAL) HAND
    ============================================================ */

    function shuffleHand() {
        // Collect all remaining cards from piles AND stock
        const allContainers = Array.from(cardsGrid.querySelectorAll(".card-pile, .stock-pile"));
        const remainingCards = [];
        allContainers.forEach(c => {
            Array.from(c.querySelectorAll(".game-card")).forEach(card => remainingCards.push(card));
        });
        if (remainingCards.length === 0) return;

        // Animate out
        remainingCards.forEach(c => {
            c.style.transition = "opacity 0.2s, transform 0.2s";
            c.style.opacity    = "0";
            c.style.transform  = "scale(0.85)";
        });

        setTimeout(() => {
            // Fisher-Yates shuffle
            for (let i = remainingCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remainingCards[i], remainingCards[j]] = [remainingCards[j], remainingCards[i]];
            }

            const piles = Array.from(cardsGrid.querySelectorAll(".card-pile"));
            let   stock = cardsGrid.querySelector(".stock-pile");

            // Split: most cards go to main piles, overflow to stock
            const CARDS_PER_PILE = Math.max(1, Math.ceil(remainingCards.length / 5));
            const pileCards  = remainingCards.slice(0, CARDS_PER_PILE * piles.length);
            const stockCards = remainingCards.slice(CARDS_PER_PILE * piles.length);

            // Distribute to piles
            piles.forEach(p => { while (p.firstChild) p.removeChild(p.firstChild); });
            pileCards.forEach((c, idx) => piles[idx % piles.length].appendChild(c));
            piles.forEach(p => positionPileCards(p));

            // Handle stock
            if (stockCards.length > 0) {
                if (!stock) {
                    stock = document.createElement("div");
                    stock.className = "stock-pile";
                    stock.id = "stockPileEl";
                    cardsGrid.appendChild(stock);
                } else {
                    while (stock.firstChild) stock.removeChild(stock.firstChild);
                }
                stockCards.forEach(c => stock.appendChild(c));
                positionPileCards(stock);
            } else if (stock) {
                stock.remove();
            }

            // Animate in
            remainingCards.forEach((c, i) => {
                setTimeout(() => {
                    c.style.transition = "opacity 0.3s, transform 0.3s ease";
                    c.style.opacity    = "1";
                    c.style.transform  = "scale(1)";
                }, i * 30);
            });

        }, 220);
    }

    /* ============================================================
       CONTROLS
    ============================================================ */

    if (restartBtn) {
        restartBtn.addEventListener("click", () => window.location.reload());
    }

    if (redealBtn) {
        redealBtn.addEventListener("click", shuffleHand);
    }

    if (shuffleDeckBtn) {
        shuffleDeckBtn.addEventListener("click", shuffleHand);
    }

    if (nextLevelBtn) {
        nextLevelBtn.addEventListener("click", () => {
            const next = level + 1;
            window.location.href =
                `gameplay.html?subject=${subject}&deck=${deck}&key_stage=${keyStage}&difficulty=${difficulty}&level=${next}`;
        });
    }

    if (finishLevelBtn) {
        finishLevelBtn.addEventListener("click", async () => {
            if (cardsPlaced !== totalCards) return;

            const token = localStorage.getItem("auth_token");
            if (!token) { window.location.href = "login.html"; return; }

            const timeSpent = Math.floor((Date.now() - startedAt) / 1000);
            finishLevelBtn.disabled = true;

            try {
                const res = await fetch("/api/gameplay/attempt", {
                    method: "POST",
                    headers: {
                        "Content-Type":  "application/json",
                        "Accept":        "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        topic:             deck,
                        level,
                        score,
                        moves,
                        correct_matches:   cardsPlaced,
                        incorrect_matches: incorrectMatches,
                        hints_used:        hintsUsed,
                        time_spent:        timeSpent,
                        completed:         true,
                    }),
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.message || "Unable to save your result.");

                localStorage.setItem("latest_game_result", JSON.stringify(result.data));
                window.location.href = "results.html";

            } catch (err) {
                alert(err.message);
                finishLevelBtn.disabled = false;
            }
        });
    }

    /* ============================================================
       HINT BUTTON
    ============================================================ */

    if (hintBtn) {
        hintBtn.addEventListener("click", () => {
            resetHintStates();
            const cards  = Array.from(cardsGrid.querySelectorAll(".game-card"));
            const stacks = Array.from(stacksGrid.querySelectorAll(".foundation-stack"));

            if (cards.length === 0) return;

            const card  = cards[Math.floor(Math.random() * cards.length)];
            const stack = stacks.find(s => s.dataset.categoryId === card.dataset.categoryId);

            if (card && stack) {
                card.classList.add("card-hint");
                stack.classList.add("stack-hint");
                hintsUsed++;
                setBanner(`Hint: Try matching "${card.querySelector(".card-name")?.textContent.trim()}" to the highlighted category.`);
            }
        });
    }

    /* ============================================================
       GAME POPUP
    ============================================================ */

    function showGamePopup(message, type = "success") {
        document.getElementById("gamePopup")?.remove();

        const popup = document.createElement("div");
        popup.id = "gamePopup";

        const isError = type === "error";
        const iconBg  = isError ? "#FEECEC" : "#ECFEF5";
        const iconEmoji = isError ? "✕" : "🎉";
        const btnColor  = isError ? "#EF4444" : "#16A34A";

        popup.innerHTML = `
            <div style="
                position:fixed; inset:0;
                background:rgba(20,33,61,0.40);
                backdrop-filter:blur(4px);
                display:flex; align-items:center; justify-content:center;
                z-index:99999; padding:20px;
                animation: popupFadeIn 0.2s ease;
            ">
                <div style="
                    width:100%; max-width:380px;
                    background:#FFF;
                    border-radius:22px;
                    padding:32px 28px;
                    text-align:center;
                    box-shadow:0 20px 60px rgba(20,33,61,0.18);
                    font-family:Nunito,sans-serif;
                    animation: popupSlideUp 0.25s ease;
                ">
                    <div style="
                        width:62px; height:62px;
                        margin:0 auto 18px;
                        border-radius:50%;
                        display:flex; align-items:center; justify-content:center;
                        font-size:30px;
                        background:${iconBg};
                    ">${iconEmoji}</div>

                    <div style="color:#14213D; font-size:18px; font-weight:900; line-height:1.4;">
                        ${message}
                    </div>

                    <button
                        type="button"
                        id="gamePopupClose"
                        style="
                            margin-top:24px;
                            min-width:130px; height:46px;
                            border:0; border-radius:999px;
                            background:${btnColor};
                            color:white;
                            font-family:Nunito,sans-serif;
                            font-size:14px; font-weight:800;
                            cursor:pointer;
                            transition:opacity 0.15s;
                        "
                    >Continue</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
        document.getElementById("gamePopupClose").addEventListener("click", () => popup.remove());
        popup.addEventListener("click", e => { if (e.target === popup.firstElementChild) popup.remove(); });
    }

    /* ============================================================
       TOP-BAR BRIDGE BUTTONS
       (topRedealBtn / topHintBtn wired up in gameplay.html)
    ============================================================ */

    // Expose globally for gameplay.html inline script
    window._gameShuffleHand = shuffleHand;
    window._gameHintClick   = () => hintBtn?.click();

    /* ============================================================
       START
    ============================================================ */

    loadBoard();

});