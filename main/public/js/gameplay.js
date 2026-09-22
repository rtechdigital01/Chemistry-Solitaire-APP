document.addEventListener("DOMContentLoaded", () => {

    /* ============================================================
       DOM REFS
    ============================================================ */

    const cardsGrid   = document.getElementById("cardsGrid");
    const stacksGrid  = document.getElementById("stacksGrid");
    const lockedSlotsEl = document.getElementById("lockedCategorySlots");
    const banner      = document.querySelector(".game-info-banner");
    const progressFill= document.querySelector(".gameplay-progress-fill");
    const progressText= document.querySelector(".gameplay-progress-text");
    const finishLevelBtn = document.getElementById("finishLevelBtn");
    const hintBtn     = document.getElementById("hintBtn");
    const redealBtn   = document.getElementById("redealBtn");
    const nextLevelBtn= document.getElementById("nextLevelBtn");
    const restartBtn  = document.getElementById("restartBtn");
    const shuffleDeckBtn   = document.getElementById("shuffleDeckBtn");
    const shuffleDeckCount = document.getElementById("shuffleDeckCount");
    const shuffleRevealPile= document.getElementById("shuffleRevealPile");
    const movesBadge  = document.getElementById("movesValueBadge");
    const topHintBtn  = document.getElementById("topHintBtn");
    const topHintLabel= document.getElementById("topHintLabel");

    const statValues = document.querySelectorAll(".gameplay-stats .stat-value");
    const scoreElement = statValues[0];
    const movesElement = statValues[1];
    const cardsElement = statValues[2];

    /* ============================================================
       URL PARAMS
    ============================================================ */

    const params      = new URLSearchParams(window.location.search);
    const subject     = params.get("subject")    || "chemistry";
    const deck        = params.get("deck")       || "periodic-table-groups";
    const keyStage    = params.get("key_stage")  || "KS3";
    const difficulty  = params.get("difficulty") || "easy";
    const level       = parseInt(params.get("level")) || 1;
    const categoryCount = parseInt(params.get("categories")) || 5;

    /* ============================================================
       GAME STATE
       ------------------------------------------------------------
       A level is a closed universe: `allCategories` is the frozen,
       server-selected set of category definitions for this level.
       Every playable card is generated only from that set and tagged
       with its parent category's id — matching is always by id, never
       by text. Cards live in exactly one zone at a time:
         pile          - one of the 4 "Game Cards" working piles
         reveal        - the active, playable card in the Shuffle
                          "hand" pile (peeked cards behind it are
                          preview-only, not yet playable)
         (shuffle deck) - not yet dealt; held only as data in
                          `shuffleDeckCards`, not attached to the DOM
       A card is only ever "completed" when it lands in its correct
       Category stack — being stacked in Game Cards or sitting in the
       reveal pile never counts as a match.
    ============================================================ */

    const GAME_PILE_COUNT   = 4;
    const INITIAL_PILE_SIZE = 3;
    const PILE_OFFSET_PX    = 16;
    const MAX_HINTS_PER_LEVEL = 3;

    /*
     * Only this many of the level's categories start as real, playable
     * stacks. The rest stay hidden — their pool cards are dealt into
     * the deck like normal, but with no stack to drop them on until
     * the player finds and plays that category's own "base" card,
     * which is shuffled into the deck as a special card.
     */
    const INITIAL_VISIBLE_CATEGORIES = 2;

    /*
     * How many levels THIS difficulty tier can actually support, given
     * how many categories the dataset has for it. Not a guessed
     * constant — the server computes it from the real category count
     * (e.g. 52 Easy / 62 Medium / 70 Hard categories ÷ 5 per level),
     * so Easy, Medium and Hard each get their own real ceiling. Set
     * once the board loads; 1 is just a safe pre-load default.
     */
    let maxLevelsForDifficulty = 1;

    /*
     * Retries: how many times this exact level (same subject/deck/
     * key stage/difficulty/level number) has been restarted. Kept in
     * sessionStorage because a Restart reloads the page, wiping all
     * in-memory state — the counter needs to survive that reload.
     */
    const retryStorageKey = `retries:${subject}:${deck}:${keyStage}:${difficulty}:${level}`;
    const retries = parseInt(sessionStorage.getItem(retryStorageKey) || "0", 10);

    const startedAt   = Date.now();
    let selectedCard  = null;
    let score         = 0;
    let moves         = 0;
    let cardsPlaced   = 0;
    let incorrectMatches = 0;
    let hintsUsed     = 0;
    let totalCards    = 0;

    /*
     * The Moves badge is a countdown, not an open-ended tally — it
     * starts from a static budget (set once the level's card count
     * is known) and counts down as moves are made. It floors at 0
     * and never blocks further play; `moves` itself keeps counting
     * up in the background for scoring/results.
     */
    let movesBudget   = 0;
    let allCategories = [];
    let pendingCategories = []; // categories not yet unlocked into a stack

    let shuffleDeckCards = []; // .game-card elements, not yet dealt

    /* ============================================================
       ICON TYPE → SVG MAP
       Keys are lowercase to match the normalized `icon_type` the API
       now sends (and the dataset's Icon Type column, case-folded).
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
            <path d="M12 3c3 4 6 7.5 6 11a6 6 0 11-12 0c0-3.5 3-7 6-11z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
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

        reactions: `<svg viewBox="0 0 24 24" fill="none">
            <circle cx="7" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/>
            <circle cx="17" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M4 5l3 3-3 3M20 19l-3-3 3-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

        shell: `<svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 2"/>
            <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 2"/>
        </svg>`,
    };

    /* ============================================================
       CATEGORY COLOUR THEMES
       Solid, saturated icon-circle colours, cycling across the
       selected categories.
    ============================================================ */

    const categoryThemes = [
        { solid: "#22C55E" }, // green
        { solid: "#8B5CF6" }, // purple
        { solid: "#F97316" }, // orange
        { solid: "#3B82F6" }, // blue
        { solid: "#EF4444" }, // red
    ];

    /* ============================================================
       CROWN ICON
       A real vector icon (matching the Figma mark) in place of a
       text glyph — sized via the parent's font-size (1em) and
       coloured via the parent's `color`, so every existing crown
       context (card corner, category header, locked slot) keeps
       working unchanged.
    ============================================================ */

    const CROWN_SVG = `<svg viewBox="0 0 24 18" fill="none">
        <path d="M2 6.2L6.6 9.3L12 2L17.4 9.3L22 6.2L19.6 15.4H4.4L2 6.2Z" fill="currentColor"/>
        <rect x="4" y="15.4" width="16" height="2" rx="1" fill="currentColor"/>
    </svg>`;

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
    }

    function updateMovesBadge() {
        const remaining = Math.max(0, movesBudget - moves);
        if (movesElement) movesElement.textContent = remaining;
        if (movesBadge) {
            movesBadge.textContent = remaining;
            movesBadge.classList.remove("bump");
            // eslint-disable-next-line no-unused-expressions
            void movesBadge.offsetWidth; // restart the animation
            movesBadge.classList.add("bump");
        }
    }

    function updateShuffleDeckBadge() {
        if (shuffleDeckCount) shuffleDeckCount.textContent = shuffleDeckCards.length;
        if (shuffleDeckBtn) shuffleDeckBtn.classList.toggle("deck-empty", shuffleDeckCards.length === 0);
    }

    function updateHintUI() {
        const remaining = Math.max(0, MAX_HINTS_PER_LEVEL - hintsUsed);
        const exhausted = remaining === 0;

        if (hintBtn) hintBtn.disabled = exhausted;
        if (topHintBtn) topHintBtn.disabled = exhausted;
        if (topHintLabel) topHintLabel.textContent = exhausted ? "No Hints" : `Hint (${remaining})`;
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
       Wires drag/click on any `.game-card` inside the given container
       (defaults to document) that hasn't been wired yet. Cards are
       reused across zones, so wiring only happens once per element.
    ============================================================ */

    function attachCardEvents(scope = document) {
        scope.querySelectorAll(".game-card").forEach(card => {
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
                setBanner(card.dataset.baseCard
                    ? `"${name}" selected — drop it on an empty locked slot to unlock it.`
                    : `"${name}" selected — drop it on a matching category.`);

                setTimeout(() => card.style.opacity = "0.45", 0);
            });

            card.addEventListener("dragend", () => {
                card.style.opacity = "1";
            });

            // — click —
            card.addEventListener("click", () => {
                if (card.classList.contains("card-face-down")) return;
                resetHintStates();

                // A card already selected from the shuffle pile, clicked
                // onto a different Game Cards pile's top card — try
                // organizing it there instead of reselecting.
                if (selectedCard && selectedCard !== card && selectedCard.classList.contains("reveal-main-card")) {
                    const targetPile = card.closest(".card-pile");
                    if (targetPile) {
                        attemptPlaceOnPile(targetPile);
                        return;
                    }
                }

                const wasSelected = card.classList.contains("card-selected");
                deselectAll();

                if (wasSelected) return; // toggle off

                card.classList.add("card-selected");
                selectedCard = card;

                const name = card.querySelector(".card-name")?.textContent.trim();
                setBanner(card.dataset.baseCard
                    ? `"${name}" selected — now tap an empty locked slot to unlock it.`
                    : `"${name}" selected — now tap a category above.`);
            });
        });
    }

    function deselectAll() {
        selectedCard = null;
        document.querySelectorAll(".game-card").forEach(c => c.classList.remove("card-selected"));
    }

    /* ============================================================
       POSITION CARDS IN A PILE (shared helper — Game Cards piles and
       the shuffle reveal pile alike)
       idx 0 = bottom, last = top (face-up).
    ============================================================ */

    function positionPileCards(container) {
        const cards = Array.from(container.querySelectorAll(".game-card"));
        cards.forEach((c, idx) => {
            c.style.top = `${idx * PILE_OFFSET_PX}px`;
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
        container.style.minHeight = cards.length > 0
            ? `${(cards.length - 1) * PILE_OFFSET_PX + 220}px`
            : "0px";
        attachCardEvents(container);
    }

    /* ============================================================
       ORGANIZE — move a card from the shuffle pile onto a Game
       Cards pile. Not a match: no score/progress change, just
       reorganizing your hand. Only allowed when the target pile's
       current top card shares the same category.
    ============================================================ */

    function attemptPlaceOnPile(pileEl) {
        resetHintStates();

        if (!selectedCard) {
            setBanner("Pick a card from the hand below first.", "error");
            return;
        }

        if (!selectedCard.classList.contains("reveal-main-card")) {
            return;
        }

        const cards = Array.from(pileEl.querySelectorAll(".game-card"));
        const topCard = cards[cards.length - 1];

        if (!topCard || topCard.dataset.categoryId !== selectedCard.dataset.categoryId) {
            setBanner("That card doesn't match this pile's category.", "error");
            return;
        }

        const cardToMove = selectedCard;
        selectedCard = null;
        cardToMove.classList.remove("card-selected");

        pileEl.appendChild(cardToMove);
        positionPileCards(pileEl);
        renderShuffleRevealPile();

        const name = cardToMove.querySelector(".card-name")?.textContent.trim();
        setBanner(`"${name}" moved into the matching pile.`, "success");
    }

    function attachPileDropEvents(pileEl) {
        if (pileEl.dataset.dropEventsAttached) return;
        pileEl.dataset.dropEventsAttached = "1";

        pileEl.addEventListener("dragover",  e => { e.preventDefault(); pileEl.classList.add("stack-drag-over"); });
        pileEl.addEventListener("dragleave", ()  => pileEl.classList.remove("stack-drag-over"));
        pileEl.addEventListener("drop", e => {
            e.preventDefault();
            pileEl.classList.remove("stack-drag-over");
            attemptPlaceOnPile(pileEl);
        });
    }

    /* ============================================================
       REVEAL TOP CARD OF A GAME-CARDS PILE (after a card is played)
    ============================================================ */

    function revealTopCards() {
        cardsGrid.querySelectorAll(".card-pile").forEach(container => {
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
       SHUFFLE REVEAL PILE
       A real stack — every card dealt into it is a genuine, matchable
       `.game-card`, in DOM order (last child = top). Only the top
       card is ever shown full-size and playable; up to 2 of the
       cards just beneath it are previewed as thin fanned strips to
       its right (name only), and the rest stay hidden underneath.
       Matching the top card exposes the one below it, exactly like
       a Game Cards pile.
    ============================================================ */

    function renderShuffleRevealPile() {
        if (!shuffleRevealPile) return;

        shuffleRevealPile.querySelectorAll(".reveal-peek-card").forEach(p => p.remove());

        const cards = Array.from(shuffleRevealPile.querySelectorAll(".game-card"));
        if (cards.length === 0) return;

        const main = cards[cards.length - 1];
        cards.forEach(c => {
            c.style.left = "0px";
            c.style.top  = "0px";
            if (c === main) {
                c.classList.remove("card-face-down");
                c.classList.add("reveal-main-card");
                c.draggable = true;
                c.style.zIndex = "3";
            } else {
                c.classList.add("card-face-down");
                c.classList.remove("reveal-main-card");
                c.draggable = false;
                c.style.zIndex = "0";
            }
        });

        cards.slice(0, -1).slice(-2).reverse().forEach((cardEl, i) => {
            const peek = document.createElement("div");
            peek.className = "reveal-peek-card";
            peek.style.left = `${105 + i * 38}px`;
            peek.style.zIndex = String(2 - i);
            const span = document.createElement("span");
            span.textContent = cardEl.querySelector(".card-name")?.textContent.trim() || "";
            peek.appendChild(span);
            shuffleRevealPile.appendChild(peek);
        });

        attachCardEvents(shuffleRevealPile);
    }

    /* ============================================================
       SHUFFLE DECK — draw pile
       Tapping the deck moves its top card onto the reveal pile,
       covering whatever was already on top (which stays put,
       face-down, underneath — same pile mechanic as Game Cards).
       Once the deck itself runs dry, tapping it again recycles
       whatever is still stuck in the reveal pile — reshuffled back
       into the deck — so the player is never permanently stuck
       behind an unplayable top card.
    ============================================================ */

    function drawFromShuffleDeck() {
        if (!shuffleRevealPile) return;

        if (shuffleDeckCards.length > 0) {
            const card = shuffleDeckCards.shift();
            shuffleRevealPile.appendChild(card);
            renderShuffleRevealPile();
            updateShuffleDeckBadge();
            return;
        }

        const stranded = Array.from(shuffleRevealPile.querySelectorAll(".game-card"));
        if (stranded.length === 0) {
            setBanner("No cards left to shuffle.", "error");
            return;
        }

        for (let i = stranded.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [stranded[i], stranded[j]] = [stranded[j], stranded[i]];
        }

        while (shuffleRevealPile.firstChild) shuffleRevealPile.removeChild(shuffleRevealPile.firstChild);
        shuffleDeckCards = stranded;
        updateShuffleDeckBadge();
        setBanner("Deck reshuffled! Tap Shuffle again to draw a new card.", "success");
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

        if (selectedCard.dataset.baseCard) {
            setBanner("That's a category card — drop it on an empty locked slot below, not here.", "error");
            return;
        }

        moves++;
        updateMovesBadge();

        const cardCat  = selectedCard.dataset.categoryId;
        const stackCat = stackEl.dataset.categoryId;

        if (cardCat === stackCat) {
            // ✅ CORRECT — only a category-stack placement ever completes a card
            score += 10;
            cardsPlaced++;
            updateScore();

            const countEl = stackEl.querySelector(".stack-current-count");
            const newCount = countEl ? parseInt(countEl.textContent || "0") + 1 : 0;
            if (countEl) countEl.textContent = newCount;

            const cardName = selectedCard.querySelector(".card-name")?.textContent.trim();
            const cardToRemove = selectedCard;
            selectedCard = null;

            pulseStack(stackEl);

            flyCardToStack(cardToRemove, stackEl, () => {
                updateProgress();
                revealTopCards();
                renderShuffleRevealPile();
                onCardPlaced(cardName, stackEl, newCount);
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

        const localResult = {
            topic:             deck,
            subject,
            deck,
            level,
            score,
            moves,
            correct_matches:   cardsPlaced,
            incorrect_matches: incorrectMatches,
            hints_used:        hintsUsed,
            total_cards:       totalCards,
            retries,
            time_spent:        timeSpent,
            completed:         true,
            difficulty,
            key_stage:         keyStage,
            max_levels_per_difficulty: maxLevelsForDifficulty,
        };
        localStorage.setItem("latest_game_result", JSON.stringify(localResult));

        // This attempt is settled — a future replay of this same level
        // number starts its retry count fresh.
        sessionStorage.removeItem(retryStorageKey);

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

    function onCardPlaced(cardName, stackEl, count) {
        const remaining = totalCards - cardsPlaced;

        const totalForStack = stackEl ? parseInt(stackEl.dataset.totalCount || "0", 10) : 0;
        const categoryComplete = !!stackEl && totalForStack > 0 && count >= totalForStack;

        if (categoryComplete) {
            const categoryTitle = stackEl.querySelector(".category-tab")?.textContent.trim() || "This category";
            setBanner(`🏆 "${categoryTitle}" complete! Great matching.`, "success");
            setTimeout(() => {
                stackEl.classList.add("stack-complete-hide");
                setTimeout(() => stackEl.remove(), 700);
            }, 700);
        }

        if (remaining === 0) {
            setBanner("🎊 All cards matched! Taking you to results…", "success");
            setTimeout(() => showCongratsAndRedirect(), categoryComplete ? 1500 : 600);
        } else if (!categoryComplete) {
            setBanner(`✓ "${cardName}" placed! ${remaining} card${remaining !== 1 ? "s" : ""} left.`, "success");
        }
    }

    /* ============================================================
       ATTACH STACK EVENTS
    ============================================================ */

    function attachStackEvents() {
        stacksGrid.querySelectorAll(".foundation-stack").forEach(stack => {
            if (stack.dataset.eventsAttached) return;
            stack.dataset.eventsAttached = "1";

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
        const iconType = String(category.icon_type || "element").toLowerCase();
        const icon     = iconSVG[iconType] || iconSVG.element;

        const stack = document.createElement("div");
        stack.className           = "foundation-stack";
        stack.dataset.categoryId  = String(category.id);
        stack.dataset.totalCount  = String(category.cards.length);

        stack.innerHTML = `
            <div class="category-tab">${category.name}</div>

            <div class="category-card-top">
                <span class="category-crown">${CROWN_SVG}</span>
                <div class="category-progress">
                    <span class="stack-current-count">0</span>/${category.cards.length}
                </div>
            </div>

            <div class="category-icon-circle" style="background: ${theme.solid}; color: #FFFFFF;">
                ${icon}
            </div>

            <div class="stack-title">${category.name}</div>
        `;

        return stack;
    }

    /* ============================================================
       BUILD CATEGORY BASE CARD
       A special playable card representing a still-hidden category.
       Dealt into the deck exactly like a normal pool card, but it
       doesn't match any stack — instead it unlocks a fresh, empty
       locked slot into that category's real stack.
    ============================================================ */

    function buildCategoryBaseCard(category) {
        const card = document.createElement("div");
        card.className            = "game-card category-base-card";
        card.dataset.categoryId   = String(category.id);
        card.dataset.categoryName = category.name;
        card.dataset.baseCard     = "1";

        card.innerHTML = `
            <span class="card-crown">${CROWN_SVG}</span>
            <div class="card-category-count">0/${category.cards.length}</div>
            <div class="card-name">${category.name}</div>
        `;

        return card;
    }

    /* ============================================================
       BUILD GAME CARD
       Cards are neutral (no category colour shown to the player) and
       carry the category id — matching is always id-based, never
       inferred from the card's text.
    ============================================================ */

    function buildGameCard(cardText, category) {
        const card = document.createElement("div");
        card.className           = "game-card";
        card.dataset.categoryId  = String(category.id);
        card.dataset.categoryName= category.name;

        card.innerHTML = `
            <span class="card-crown">${CROWN_SVG}</span>
            <div class="card-name">${cardText}</div>
        `;

        return card;
    }

    /* ============================================================
       BUILD THE LOGICAL DECK
       One card per pool item, per selected category. The category
       base itself is not a playable card — it's the completion
       target rendered in the Category section.
    ============================================================ */

    function buildLogicalDeck(categories, hiddenIds = new Set()) {
        const deck = [];
        categories.forEach(category => {
            category.cards.forEach(cardText => {
                totalCards++;
                deck.push(buildGameCard(cardText, category));
            });
            if (hiddenIds.has(String(category.id))) {
                deck.push(buildCategoryBaseCard(category));
            }
        });
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    /* ============================================================
       LOCKED CATEGORY SLOTS
       One dashed placeholder per still-hidden category. Dropping a
       matching base card (picked up from the hand) onto any slot
       unlocks that category into a real, playable stack.
    ============================================================ */

    function renderLockedSlots() {
        if (!lockedSlotsEl) return;
        lockedSlotsEl.innerHTML = "";

        pendingCategories.forEach(() => {
            const slot = document.createElement("div");
            slot.className = "locked-category-card";
            slot.innerHTML = `<span>${CROWN_SVG}</span>`;

            slot.addEventListener("dragover",  e => { e.preventDefault(); slot.classList.add("stack-drag-over"); });
            slot.addEventListener("dragleave", ()  => slot.classList.remove("stack-drag-over"));
            slot.addEventListener("drop", e => {
                e.preventDefault();
                slot.classList.remove("stack-drag-over");
                attemptPlaceCategoryBase(slot);
            });
            slot.addEventListener("click", () => attemptPlaceCategoryBase(slot));

            lockedSlotsEl.appendChild(slot);
        });
    }

    function attemptPlaceCategoryBase(slotEl) {
        resetHintStates();

        if (!selectedCard) {
            setBanner("Pick a category card from the hand below first.", "error");
            return;
        }

        if (!selectedCard.dataset.baseCard) {
            setBanner("That's not a category card — drop it on an unlocked category above instead.", "error");
            return;
        }

        moves++;
        updateMovesBadge();

        const categoryId = selectedCard.dataset.categoryId;
        const category = pendingCategories.find(c => String(c.id) === categoryId);
        if (!category) return;

        const cardToRemove = selectedCard;
        selectedCard = null;

        flyCardToStack(cardToRemove, slotEl, () => {
            pendingCategories = pendingCategories.filter(c => String(c.id) !== categoryId);

            const themeIdx = allCategories.findIndex(c => String(c.id) === categoryId);
            const theme    = categoryThemes[themeIdx % categoryThemes.length];
            stacksGrid.appendChild(buildStackCard(category, theme));
            attachStackEvents();
            renderLockedSlots();
            revealTopCards();
            renderShuffleRevealPile();

            setBanner(`🔓 "${category.name}" unlocked! Start matching its cards.`, "success");
        });
    }

    /* ============================================================
       RENDER BOARD
    ============================================================ */

    function renderBoard(board, resetGame = true) {
        cardsGrid.innerHTML  = "";
        stacksGrid.innerHTML = "";
        if (lockedSlotsEl) lockedSlotsEl.innerHTML = "";
        if (shuffleRevealPile) shuffleRevealPile.innerHTML = "";

        selectedCard   = null;
        cardsPlaced    = 0;
        totalCards     = 0;
        shuffleDeckCards = [];
        pendingCategories = [];

        if (resetGame) {
            score = 0;
            moves = 0;
            incorrectMatches = 0;
            hintsUsed = 0;
        }

        // Freeze the level's category selection — nothing outside this
        // set may ever enter the deck, the shuffle pile, or the stacks.
        allCategories = board.categories;

        // The dataset-derived cap for this difficulty tier (falls back
        // to a value computed from what actually got selected, for the
        // offline/dev fallback board which has no server-computed cap).
        maxLevelsForDifficulty = board.max_levels
            || Math.max(1, Math.floor(allCategories.length / categoryCount));

        // Only the first few categories start as real, playable
        // stacks. The rest stay hidden until their own base card is
        // drawn and played onto an empty locked slot.
        const visibleCategories = allCategories.slice(0, INITIAL_VISIBLE_CATEGORIES);
        pendingCategories        = allCategories.slice(INITIAL_VISIBLE_CATEGORIES);
        const hiddenIds = new Set(pendingCategories.map(c => String(c.id)));

        visibleCategories.forEach(category => {
            const idx   = allCategories.findIndex(c => c.id === category.id);
            const theme = categoryThemes[idx % categoryThemes.length];
            stacksGrid.appendChild(buildStackCard(category, theme));
        });

        renderLockedSlots();

        let deck = buildLogicalDeck(allCategories, hiddenIds);

        // A static budget set once per level load, sized to the level's
        // own card count so it scales fairly across levels.
        movesBudget = Math.max(20, totalCards * 2);

        // Deal the opening hand into the 4 Game Cards piles.
        const piles = Array.from({ length: GAME_PILE_COUNT }, () => {
            const p = document.createElement("div");
            p.className = "card-pile";
            cardsGrid.appendChild(p);
            return p;
        });

        const pileTarget = Math.min(deck.length, GAME_PILE_COUNT * INITIAL_PILE_SIZE);
        for (let i = 0; i < pileTarget; i++) {
            piles[i % GAME_PILE_COUNT].appendChild(deck[i]);
        }
        piles.forEach(pile => { positionPileCards(pile); attachPileDropEvents(pile); });
        deck = deck.slice(pileTarget);

        // Deal a starting stack into the shuffle reveal pile too.
        // Whatever's left waits in the shuffle deck, drawn one at a
        // time onto this pile as the player taps it.
        if (shuffleRevealPile) {
            const revealTarget = Math.min(deck.length, INITIAL_PILE_SIZE);
            for (let i = 0; i < revealTarget; i++) {
                shuffleRevealPile.appendChild(deck[i]);
            }
            renderShuffleRevealPile();
            deck = deck.slice(revealTarget);
        }
        shuffleDeckCards = deck;

        updateShuffleDeckBadge();

        updateScore();
        updateMovesBadge();
        updateHintUI();
        if (finishLevelBtn) finishLevelBtn.disabled = true;
        if (nextLevelBtn)   nextLevelBtn.disabled = true;

        updateProgress();
        updateTopBar();
        attachCardEvents(cardsGrid);
        attachStackEvents();

        setBanner("Select a card from the hand below, then tap a category above.");

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
                + `&difficulty=${encodeURIComponent(difficulty)}`
                + `&categories=${encodeURIComponent(categoryCount)}`;

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
            { id: "1", name: "Group 1 Elements",  icon_type: "element",     cards: ["Lithium", "Sodium", "Potassium", "Rubidium", "Caesium", "Francium"] },
            { id: "2", name: "Group 7 Elements",  icon_type: "element",     cards: ["Fluorine", "Chlorine", "Bromine", "Iodine", "Astatine"] },
            { id: "3", name: "Group 0 Elements",  icon_type: "element",     cards: ["Helium", "Neon", "Argon", "Krypton"] },
            { id: "4", name: "Periodic Table",    icon_type: "information", cards: ["Groups", "Periods", "Elements", "Metals"] },
            { id: "5", name: "Periodic Trends",   icon_type: "trends",      cards: ["Atomic Radius", "Ionisation Energy", "Electronegativity", "Shielding"] },
        ];
        const medium = [
            { id: "1", name: "Group 1 Physical Props", icon_type: "physical", cards: ["Soft", "Silvery", "Low density", "Low melting point"] },
            { id: "2", name: "Group 7 Physical Props", icon_type: "physical", cards: ["Coloured", "Diatomic", "Non-metal", "Low boiling point"] },
            { id: "3", name: "Group 0 Physical Props", icon_type: "physical", cards: ["Colourless", "Monatomic", "Odourless", "Gases"] },
            { id: "4", name: "Group 1 Uses",           icon_type: "uses",     cards: ["Lithium batteries", "Sodium street lamps", "Potassium fertilisers", "Caesium atomic clocks"] },
            { id: "5", name: "Group 1 Reactions",      icon_type: "reactions",cards: ["Fizzing", "Floating", "Hydrogen gas", "Heat released"] },
        ];
        const hard = [
            { id: "1", name: "Group 1 Chem Props",  icon_type: "chemical",  cards: ["Reacts with water", "Produces hydrogen", "Forms +1 ions", "Loses one electron"] },
            { id: "2", name: "Group 7 Chem Props",  icon_type: "chemical",  cards: ["Forms -1 ions", "Gains one electron", "Strong oxidising agents", "Forms salts"] },
            { id: "3", name: "Group 0 Chem Props",  icon_type: "chemical",  cards: ["Very unreactive", "Full outer shell", "Stable", "Non-flammable"] },
            { id: "4", name: "Advanced Vocabulary", icon_type: "information", cards: ["Ionisation energy", "Electronegativity", "Shielding", "Nuclear charge"] },
            { id: "5", name: "Group 7 Trends",      icon_type: "trends",    cards: ["Reactivity decreases", "Melting point increases", "Boiling point increases", "Atomic radius increases"] },
        ];

        const poolMap = { easy, medium, hard };
        return { difficulty: diff, key_stage: "KS3", categories: poolMap[diff] || easy };
    }

    /* ============================================================
       SHUFFLE — full reshuffle of every remaining card across every
       pile (Game Cards ×4, the reveal pile, and the shuffle deck)
       and a fresh re-deal. Category ownership never changes — only
       order does. This is the top-bar utility button; the shuffle
       deck itself (bottom-right) is drawn from one card at a time
       via drawFromShuffleDeck().
    ============================================================ */

    function shuffleHand() {
        const pileEls   = Array.from(cardsGrid.querySelectorAll(".card-pile .game-card"));
        const revealEls = shuffleRevealPile ? Array.from(shuffleRevealPile.querySelectorAll(".game-card")) : [];
        const allCards  = [...pileEls, ...revealEls, ...shuffleDeckCards];
        if (allCards.length === 0) return;

        const visibleCards = [...pileEls, ...revealEls].filter(c => !c.classList.contains("card-face-down"));
        visibleCards.forEach(c => {
            c.style.transition = "opacity 0.2s, transform 0.2s";
            c.style.opacity    = "0";
            c.style.transform  = "scale(0.85)";
        });

        setTimeout(() => {
            for (let i = allCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
            }

            const piles = Array.from(cardsGrid.querySelectorAll(".card-pile"));
            piles.forEach(p => { while (p.firstChild) p.removeChild(p.firstChild); });
            if (shuffleRevealPile) { while (shuffleRevealPile.firstChild) shuffleRevealPile.removeChild(shuffleRevealPile.firstChild); }

            let idx = 0;
            const pileTarget = Math.min(allCards.length, GAME_PILE_COUNT * INITIAL_PILE_SIZE);
            for (; idx < pileTarget; idx++) {
                piles[idx % GAME_PILE_COUNT].appendChild(allCards[idx]);
            }
            piles.forEach(p => positionPileCards(p));

            if (shuffleRevealPile) {
                const revealTarget = Math.min(allCards.length - idx, INITIAL_PILE_SIZE);
                for (let i = 0; i < revealTarget; i++, idx++) {
                    shuffleRevealPile.appendChild(allCards[idx]);
                }
                renderShuffleRevealPile();
            }
            shuffleDeckCards = allCards.slice(idx);

            updateShuffleDeckBadge();

            const nowVisible = [
                ...piles.flatMap(p => Array.from(p.querySelectorAll(".game-card"))),
                ...(shuffleRevealPile ? Array.from(shuffleRevealPile.querySelectorAll(".game-card")) : []),
            ].filter(c => !c.classList.contains("card-face-down"));
            nowVisible.forEach((c, i) => {
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
        restartBtn.addEventListener("click", () => {
            sessionStorage.setItem(retryStorageKey, String(retries + 1));
            window.location.reload();
        });
    }

    if (redealBtn) {
        redealBtn.addEventListener("click", shuffleHand);
    }

    if (shuffleDeckBtn) {
        shuffleDeckBtn.addEventListener("click", drawFromShuffleDeck);
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
            if (hintsUsed >= MAX_HINTS_PER_LEVEL) {
                setBanner(`No hints left for this level (max ${MAX_HINTS_PER_LEVEL}).`, "error");
                return;
            }

            resetHintStates();
            const stacks = Array.from(stacksGrid.querySelectorAll(".foundation-stack"));
            const unlockedIds = new Set(stacks.map(s => s.dataset.categoryId));

            const cards = Array.from(document.querySelectorAll("#cardsGrid .game-card, #shuffleRevealPile .game-card"))
                .filter(c => !c.classList.contains("card-face-down"))
                .filter(c => !c.dataset.baseCard)
                .filter(c => unlockedIds.has(c.dataset.categoryId));

            if (cards.length === 0) {
                setBanner("No hintable cards right now — try unlocking a new category first.", "error");
                return;
            }

            const card  = cards[Math.floor(Math.random() * cards.length)];
            const stack = stacks.find(s => s.dataset.categoryId === card.dataset.categoryId);

            if (card && stack) {
                card.classList.add("card-hint");
                stack.classList.add("stack-hint");
                hintsUsed++;
                updateHintUI();
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

    window._gameShuffleHand = shuffleHand;
    window._gameHintClick   = () => hintBtn?.click();

    /* ============================================================
       START
    ============================================================ */

    loadBoard();

});
