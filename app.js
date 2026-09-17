"use strict";

const state = {
    category: "",
    answers: {
        recipient: "",
        budget: "",
        category: "",
        platform: "",
        game: [],
        city: "",
        occasion: "",
        preferences: "",
        search: ""
    },
    questions: [],
    currentQuestion: 0,
    recommendations: []
};

const FAVORITES_KEY = "giftfinder_favorites";
const USER_ID_KEY = "giftfinder_user_id";

function getGiftFinderUserId() {
    let id = localStorage.getItem(USER_ID_KEY);

    if (!id) {
        id =
            window.crypto && crypto.randomUUID
                ? crypto.randomUUID()
                : "gf_" +
                  Math.random().toString(36).slice(2) +
                  Date.now().toString(36);

        localStorage.setItem(USER_ID_KEY, id);
    }

    return id;
}

function apiHeaders() {
    return {
        "Content-Type": "application/json",
        "x-giftfinder-user-id": getGiftFinderUserId()
    };
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   FAVORIS
========================================================= */

function getFavorites() {
    try {
        return JSON.parse(
            localStorage.getItem(FAVORITES_KEY) || "[]"
        );
    } catch {
        return [];
    }
}

function saveFavorites(items) {
    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(items)
    );

    updateFavoritesCount();
    renderFavoritesPreview();
}

function isFavorite(product) {
    return getFavorites().some(
        item =>
            String(item.id || item.name) ===
            String(product.id || product.name)
    );
}

function toggleGiftFinderFavorite(product) {
    let favorites = getFavorites();

    const key = String(product.id || product.name);

    const index = favorites.findIndex(
        item =>
            String(item.id || item.name) === key
    );

    if (index >= 0) {
        favorites.splice(index, 1);
    } else {
        favorites.push(product);
    }

    saveFavorites(favorites);

    renderRecommendations(
        state.recommendations
    );
}

function updateFavoritesCount() {
    const count = getFavorites().length;

    document
        .querySelectorAll("#favoriteCount,#favoritesCount")
        .forEach(element => {
            element.textContent = count;
        });
}

function removeGiftFinderFavorite(product) {
    const key =
        String(product.id || product.name);

    const favorites =
        getFavorites().filter(
            item =>
                String(item.id || item.name) !== key
        );

    saveFavorites(favorites);
}

function renderFavoritesPreview() {
    const container =
        document.getElementById(
            "favoritesPreview"
        );

    if (!container) return;

    const favorites =
        getFavorites();

    if (!favorites.length) {
        container.innerHTML = `
            <div style="
                text-align:center;
                padding:50px 20px;
                border:1px solid #e7e7ee;
                border-radius:22px;
                background:white;
            ">
                <div style="font-size:48px;">♡</div>
                <h3>Aucun favori pour le moment</h3>
                <p style="color:#6f7180;margin-top:8px;">
                    Ajoute des cadeaux à tes favoris pour les retrouver ici.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="results-grid">
            ${favorites.map(product => `
                <article class="result-card">

                    ${
                        product.image
                            ? `
                                <img
                                    src="${escapeHTML(product.image)}"
                                    alt="${escapeHTML(product.name || "Cadeau")}"
                                    loading="lazy"
                                >
                            `
                            : `
                                <div style="
                                    width:150px;
                                    height:150px;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    background:#f5f5f8;
                                    border-radius:13px;
                                    font-size:45px;
                                ">
                                    🎁
                                </div>
                            `
                    }

                    <div class="result-content">

                        <h3>
                            ${escapeHTML(
                                product.name || "Cadeau"
                            )}
                        </h3>

                        ${
                            product.price
                                ? `
                                    <div class="result-price">
                                        ${escapeHTML(product.price)}
                                    </div>
                                `
                                : ""
                        }

                        <button
                            type="button"
                            class="favorite-result-button"
                            data-remove-favorite
                            data-favorite-id="${escapeHTML(
                                String(product.id || product.name)
                            )}"
                        >
                            Retirer
                        </button>

                        ${
                            product.url
                                ? `
                                    <a
                                        class="amazon-link"
                                        href="${escapeHTML(product.url)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Voir le produit
                                    </a>
                                `
                                : ""
                        }

                    </div>
                </article>
            `).join("")}
        </div>
    `;

    container
        .querySelectorAll("[data-remove-favorite]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const id =
                        button.dataset.favoriteId;

                    const updated =
                        getFavorites().filter(
                            item =>
                                String(
                                    item.id ||
                                    item.name
                                ) !== id
                        );

                    saveFavorites(updated);
                }
            );
        });
}


/* =========================================================
   MODAL
========================================================= */

function getModal() {
    return (
        document.getElementById(
            "giftFinderModal"
        ) ||
        document.getElementById(
            "questionnaireModal"
        )
    );
}

function getQuestionContainer() {
    return document.getElementById(
        "questionContainer"
    );
}


/* =========================================================
   QUESTIONS
========================================================= */

function buildQuestions(category) {

    const questions = [

        {
            key: "recipient",
            title: "Pour qui cherches-tu un cadeau ?",
            subtitle: "Choisis la personne à qui tu veux faire plaisir.",
            type: "options",
            options: [
                ["👨","Ami","Un ami"],
                ["👩","Amie","Une amie"],
                ["❤️","Partenaire","Ton/ta partenaire"],
                ["👨‍👩‍👧","Famille","Un membre de ta famille"],
                ["🎓","Collègue","Un collègue"],
                ["🎁","Autre","Une autre personne"]
            ]
        },

        {
            key: "budget",
            title: "Quel est ton budget ?",
            subtitle: "Choisis la tranche qui correspond à ton budget.",
            type: "options",
            options: [
                ["💶","Moins de 20 €","Petit budget"],
                ["💵","20 – 50 €","Budget moyen"],
                ["💳","50 – 100 €","Budget confortable"],
                ["💎","100 € et plus","Budget premium"]
            ]
        },

        {
            key: "occasion",
            title: "Pour quelle occasion ?",
            subtitle: "Le contexte permet d'améliorer les recommandations.",
            type: "options",
            options: [
                ["🎂","Anniversaire",""],
                ["🎄","Noël",""],
                ["❤️","Saint-Valentin",""],
                ["🎓","Diplôme",""],
                ["🎉","Fête",""],
                ["✨","Sans occasion",""]
            ]
        },

        {
            key: "preferences",
            title: "Quels sont ses goûts ?",
            subtitle: "Décris librement ses passions, goûts et envies.",
            type: "text",
            placeholder:
                "Ex : gaming, sport, musique, mode, objets originaux..."
        }
    ];


    if (category === "gaming") {

        questions.splice(2, 0, {
            key: "platform",
            title: "Sur quelle plateforme joue-t-il/elle ?",
            subtitle: "Choisis sa plateforme principale.",
            type: "options",
            options: [
                ["💻","PC",""],
                ["🎮","PlayStation",""],
                ["🟢","Xbox",""],
                ["🔴","Nintendo",""],
                ["📱","Mobile",""],
                ["🎮","Peu importe",""]
            ]
        });

        questions.splice(3, 0, {
            key: "game",
            title: "Quel type de jeu aime-t-il/elle ?",
            subtitle: "Tu peux sélectionner plusieurs réponses.",
            type: "options",
            multiple: true,
            options: [
                ["⚔️","Action",""],
                ["🏎️","Course",""],
                ["⚽","Sport",""],
                ["🧱","Minecraft",""],
                ["🔫","FPS",""],
                ["🎮","Autre",""]
            ]
        });
    }


    if (category === "experience") {

        questions.splice(2, 0, {
            key: "city",
            title: "Dans quelle ville ?",
            subtitle: "Pour trouver des expériences autour de cette ville.",
            type: "text",
            placeholder: "Ex : Paris, Lyon, Mulhouse..."
        });
    }


    return questions;
}


/* =========================================================
   QUESTIONNAIRE
========================================================= */

function openQuestionnaire(category = "") {

    state.category = category;
    state.answers.category = category;
    state.questions = buildQuestions(category);
    state.currentQuestion = 0;

    const modal = getModal();

    if (!modal) {
        alert("Le questionnaire est introuvable.");
        return;
    }

    modal.classList.add("open");
    modal.style.display = "flex";

    renderQuestion();
}

function closeQuestionnaire() {

    const modal = getModal();

    if (!modal) return;

    modal.classList.remove("open");
    modal.style.display = "none";
}

function renderQuestion() {

    const container =
        getQuestionContainer();

    if (!container) return;

    const question =
        state.questions[
            state.currentQuestion
        ];

    if (!question) return;

    const current =
        state.currentQuestion + 1;

    const total =
        state.questions.length;

    const progress =
        document.getElementById(
            "progressBar"
        );

    const progressText =
        document.getElementById(
            "progressText"
        );

    if (progress) {
        progress.style.width =
            `${current / total * 100}%`;
    }

    if (progressText) {
        progressText.textContent =
            `Question ${current} sur ${total}`;
    }


    let html = `
        <div class="question-title">
            ${escapeHTML(question.title)}
        </div>

        <div class="question-subtitle">
            ${escapeHTML(question.subtitle || "")}
        </div>
    `;


    if (question.type === "options") {

        const selectedValue =
            state.answers[
                question.key
            ];

        html += `
            <div class="option-grid">

                ${question.options.map(
                    option => {

                        const selected =
                            question.multiple
                                ? Array.isArray(
                                    selectedValue
                                  ) &&
                                  selectedValue.includes(
                                      option[1]
                                  )
                                : selectedValue ===
                                  option[1];

                        return `
                            <button
                                type="button"
                                class="option ${selected ? "selected" : ""}"
                                data-option-value="${escapeHTML(option[1])}"
                            >

                                <span class="option-icon">
                                    ${option[0]}
                                </span>

                                <span class="option-content">

                                    <strong>
                                        ${escapeHTML(option[1])}
                                    </strong>

                                    <small>
                                        ${escapeHTML(option[2] || "")}
                                    </small>

                                </span>

                            </button>
                        `;
                    }
                ).join("")}

            </div>
        `;
    }


    if (question.type === "text") {

        html += `
            <input
                id="questionTextInput"
                class="text-input"
                type="text"
                value="${escapeHTML(
                    state.answers[question.key] || ""
                )}"
                placeholder="${escapeHTML(
                    question.placeholder || ""
                )}"
            >
        `;
    }


    container.innerHTML = html;


    container
        .querySelectorAll(".option")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const value =
                        button.dataset.optionValue;

                    if (question.multiple) {

                        if (
                            !Array.isArray(
                                state.answers[
                                    question.key
                                ]
                            )
                        ) {
                            state.answers[
                                question.key
                            ] = [];
                        }

                        const values =
                            state.answers[
                                question.key
                            ];

                        const index =
                            values.indexOf(value);

                        if (index >= 0) {
                            values.splice(
                                index,
                                1
                            );
                        } else {
                            values.push(value);
                        }

                        button.classList.toggle(
                            "selected",
                            values.includes(value)
                        );

                    } else {

                        state.answers[
                            question.key
                        ] = value;

                        container
                            .querySelectorAll(".option")
                            .forEach(
                                option =>
                                    option.classList.remove(
                                        "selected"
                                    )
                            );

                        button.classList.add(
                            "selected"
                        );
                    }
                }
            );
        });


    const previous =
        document.getElementById(
            "previousQuestion"
        );

    if (previous) {
        previous.disabled =
            state.currentQuestion === 0;
    }
}


function validateQuestion() {

    const question =
        state.questions[
            state.currentQuestion
        ];

    if (!question) return true;


    if (question.type === "text") {

        const input =
            document.getElementById(
                "questionTextInput"
            );

        const value =
            input?.value.trim() || "";

        if (!value) {
            alert(
                "Remplis ce champ avant de continuer."
            );

            return false;
        }

        state.answers[
            question.key
        ] = value;

        return true;
    }


    if (question.multiple) {

        const values =
            state.answers[
                question.key
            ];

        if (
            !Array.isArray(values) ||
            !values.length
        ) {
            alert(
                "Sélectionne au moins une réponse."
            );

            return false;
        }

        return true;
    }


    if (!state.answers[question.key]) {

        alert(
            "Sélectionne une réponse pour continuer."
        );

        return false;
    }

    return true;
}


async function goNext() {

    if (!validateQuestion()) {
        return;
    }

    if (
        state.currentQuestion <
        state.questions.length - 1
    ) {

        state.currentQuestion++;

        renderQuestion();

        return;
    }

    await finishQuestionnaire();
}


function goPrevious() {

    if (
        state.currentQuestion <= 0
    ) {
        return;
    }

    state.currentQuestion--;

    renderQuestion();
}


/* =========================================================
   RECHERCHE / CRÉDIT
========================================================= */

async function startGiftSearchWithCredit() {

    try {

        const response =
            await fetch(
                "/api/start-search",
                {
                    method: "POST",
                    headers: apiHeaders()
                }
            );

        const data =
            await response.json();


        if (!response.ok) {

            if (
                response.status === 402
            ) {
                openPaymentModal();
                return false;
            }

            throw new Error(
                data.error ||
                "Impossible de lancer la recherche."
            );
        }


        updateAccountUI(data);

        return true;

    } catch (error) {

        console.error(error);

        alert(error.message);

        return false;
    }
}


async function finishQuestionnaire() {

    const allowed =
        await startGiftSearchWithCredit();

    if (!allowed) {
        return;
    }

    closeQuestionnaire();

    const results =
        document.getElementById(
            "giftResults"
        );

    if (results) {
        results.style.display = "block";

        results.scrollIntoView({
            behavior: "smooth"
        });
    }

    await generateResults();
}


async function startGiftSearch() {
    await finishQuestionnaire();
}


/* =========================================================
   RÉSULTATS IA
========================================================= */

async function generateResults() {

    const grid =
        document.getElementById(
            "resultsGrid"
        );

    if (!grid) return;


    grid.innerHTML = `
        <div style="
            text-align:center;
            padding:50px 20px;
        ">

            <div style="font-size:50px;">
                🎁
            </div>

            <strong>
                Recherche des meilleurs cadeaux...
            </strong>

            <p style="
                color:#6f7180;
                margin-top:8px;
            ">
                GiftFinder analyse tes critères.
            </p>

        </div>
    `;


    try {

        const response =
            await fetch(
                "/api/recommendations",
                {
                    method: "POST",
                    headers: apiHeaders(),
                    body: JSON.stringify({
                        answers: state.answers
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.error ||
                "Impossible de générer les recommandations."
            );
        }


        state.recommendations =
            Array.isArray(
                data.recommendations
            )
                ? data.recommendations
                : Array.isArray(data)
                    ? data
                    : [];


        renderRecommendations(
            state.recommendations
        );

    } catch (error) {

        console.error(error);

        grid.innerHTML = `
            <div style="
                text-align:center;
                padding:40px;
            ">

                <strong>
                    Une erreur est survenue.
                </strong>

                <p style="
                    color:#6f7180;
                    margin-top:8px;
                ">
                    ${escapeHTML(error.message)}
                </p>

                <button
                    type="button"
                    class="primary-button"
                    style="margin-top:15px;"
                    onclick="window.generateResults()"
                >
                    Réessayer
                </button>

            </div>
        `;
    }
}


function renderRecommendations(products) {

    const grid =
        document.getElementById(
            "resultsGrid"
        );

    if (!grid) return;


    if (!products.length) {

        grid.innerHTML = `
            <div style="
                text-align:center;
                padding:40px;
            ">
                Aucun cadeau trouvé.
            </div>
        `;

        return;
    }


    grid.innerHTML =
        products.map(
            product => {

                const favorite =
                    isFavorite(product);


                const safeProduct =
                    JSON.stringify(
                        product
                    )
                    .replace(
                        /</g,
                        "\\u003c"
                    );


                return `
                    <article class="result-card">

                        ${
                            product.image
                                ? `
                                    <img
                                        src="${escapeHTML(product.image)}"
                                        alt="${escapeHTML(product.name || "Cadeau")}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div style="
                                        width:150px;
                                        height:150px;
                                        flex-shrink:0;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        background:#f5f5f8;
                                        border-radius:13px;
                                        font-size:45px;
                                    ">
                                        🎁
                                    </div>
                                `
                        }


                        <div class="result-content">

                            <h3>
                                ${escapeHTML(
                                    product.name ||
                                    "Cadeau"
                                )}
                            </h3>


                            ${
                                product.price
                                    ? `
                                        <div class="result-price">
                                            ${escapeHTML(
                                                product.price
                                            )}
                                        </div>
                                    `
                                    : ""
                            }


                            <button
                                type="button"
                                class="favorite-result-button"
                                data-product='${safeProduct}'
                            >
                                ${
                                    favorite
                                        ? "♥ Retirer"
                                        : "♡ Favori"
                                }
                            </button>


                            ${
                                product.url
                                    ? `
                                        <a
                                            class="amazon-link"
                                            href="${escapeHTML(product.url)}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Voir le produit
                                        </a>
                                    `
                                    : ""
                            }

                        </div>

                    </article>
                `;
            }
        ).join("");


    grid
        .querySelectorAll(
            "[data-product]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    try {

                        const product =
                            JSON.parse(
                                button.dataset.product
                            );

                        toggleGiftFinderFavorite(
                            product
                        );

                    } catch (error) {
                        console.error(error);
                    }
                }
            );
        });
}


/* =========================================================
   COMPTE
========================================================= */

async function loadAccount() {

    try {

        const response =
            await fetch(
                "/api/account",
                {
                    headers: apiHeaders()
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        updateAccountUI(data);

    } catch (error) {

        console.error(
            "Compte :",
            error
        );
    }
}


function updateAccountUI(data) {

    if (!data) return;


    let remaining;


    if (data.premium) {
        remaining = "∞";
    } else if (
        Number.isFinite(
            Number(data.credits)
        )
    ) {
        remaining =
            Number(data.credits);
    } else {
        remaining =
            data.canSearch
                ? 1
                : 0;
    }


    document
        .querySelectorAll(
            "#headerSearchesRemaining,#searchesRemaining"
        )
        .forEach(element => {
            element.textContent =
                remaining;
        });


    const status =
        document.getElementById(
            "searchesStatus"
        );

    if (status) {

        status.textContent =
            data.premium
                ? "recherches illimitées"
                : Number(remaining) > 1
                    ? "recherches restantes"
                    : "recherche restante";
    }


    const renewal =
        document.getElementById(
            "searchesRenewal"
        );

    if (renewal) {

        renewal.textContent =
            data.premium
                ? "Premium actif : recherches illimitées."
                : "Recherche gratuite disponible, sans cumul.";
    }


    const premium =
        document.getElementById(
            "premiumStatus"
        );

    if (premium) {

        premium.textContent =
            data.premium
                ? "Premium actif"
                : "Premium non activé";
    }
}


/* =========================================================
   STRIPE
========================================================= */

async function createCheckoutSession(
    product
) {

    try {

        const response =
            await fetch(
                "/api/create-checkout-session",
                {
                    method: "POST",
                    headers: apiHeaders(),
                    body: JSON.stringify({
                        product
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Impossible de créer le paiement."
            );
        }


        if (data.url) {

            window.location.href =
                data.url;
        }

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}


function openPaymentModal() {

    let modal =
        document.getElementById(
            "giftFinderPaymentModal"
        );


    if (!modal) {

        modal =
            document.createElement(
                "div"
            );

        modal.id =
            "giftFinderPaymentModal";

        modal.className =
            "questionnaire-modal";


        modal.innerHTML = `

            <div
                class="questionnaire"
                style="max-width:520px;"
            >

                <button
                    type="button"
                    class="close-button"
                    id="closePaymentModal"
                >
                    ×
                </button>

                <div class="section-label">
                    GIFT FINDER
                </div>

                <h2 style="margin-bottom:10px;">
                    Continue ta recherche
                </h2>

                <p style="
                    color:#6f7180;
                    margin-bottom:25px;
                ">
                    Choisis une formule pour continuer.
                </p>


                <div style="
                    display:grid;
                    gap:12px;
                ">

                    <button
                        type="button"
                        class="premium-button"
                        data-payment-product="premium"
                    >
                        Premium — 3,99 €/mois
                    </button>

                    <button
                        type="button"
                        class="premium-button"
                        data-payment-product="pack10"
                    >
                        Pack 10 recherches — 4,99 €
                    </button>

                    <button
                        type="button"
                        class="premium-button"
                        data-payment-product="pack30"
                    >
                        Pack 30 recherches — 9,99 €
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "closePaymentModal"
            )
            .addEventListener(
                "click",
                closePaymentModal
            );


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {
                    closePaymentModal();
                }
            }
        );


        setupPaymentButtons(
            modal
        );
    }


    modal.classList.add(
        "open"
    );

    modal.style.display =
        "flex";
}


function closePaymentModal() {

    const modal =
        document.getElementById(
            "giftFinderPaymentModal"
        );

    if (!modal) return;

    modal.classList.remove(
        "open"
    );

    modal.style.display =
        "none";
}


function setupPaymentButtons(
    root = document
) {

    root
        .querySelectorAll(
            "[data-payment-product]"
        )
        .forEach(button => {

            if (
                button.dataset.ready === "1"
            ) {
                return;
            }

            button.dataset.ready =
                "1";


            button.addEventListener(
                "click",
                async () => {

                    await createCheckoutSession(
                        button.dataset.paymentProduct
                    );
                }
            );
        });


    const premium =
        document.getElementById(
            "demoPremiumButton"
        );


    if (
        premium &&
        premium.dataset.ready !== "1"
    ) {

        premium.dataset.ready =
            "1";

        premium.addEventListener(
            "click",
            event => {

                event.preventDefault();

                openPaymentModal();
            }
        );
    }


    document
        .querySelectorAll(
            ".pack-button"
        )
        .forEach(button => {

            if (
                button.dataset.ready === "1"
            ) {
                return;
            }

            button.dataset.ready =
                "1";


            button.addEventListener(
                "click",
                () => {

                    const pack =
                        button.dataset.pack;

                    if (
                        pack === "10"
                    ) {
                        createCheckoutSession(
                            "pack10"
                        );
                    }

                    if (
                        pack === "30"
                    ) {
                        createCheckoutSession(
                            "pack30"
                        );
                    }
                }
            );
        });
}


/* =========================================================
   RECHERCHE DIRECTE
========================================================= */

function setupSearchButtons() {

    const input =
        document.getElementById(
            "giftSearchInput"
        );

    const button =
        document.getElementById(
            "giftSearchButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            () => {

                state.answers.search =
                    input?.value.trim() || "";

                state.answers.preferences =
                    state.answers.search;

                openQuestionnaire();
            }
        );
    }


    document
        .querySelectorAll(
            "[data-open-questionnaire]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openQuestionnaire(
                        button.dataset.category ||
                        ""
                    );
                }
            );
        });
}


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        getGiftFinderUserId();

        setupSearchButtons();

        setupPaymentButtons();

        updateFavoritesCount();

        renderFavoritesPreview();

        loadAccount();


        const next =
            document.getElementById(
                "nextQuestion"
            );

        const previous =
            document.getElementById(
                "previousQuestion"
            );


        if (next) {
            next.addEventListener(
                "click",
                goNext
            );
        }


        if (previous) {
            previous.addEventListener(
                "click",
                goPrevious
            );
        }


        document
            .querySelectorAll(
                "[data-close-questionnaire]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    closeQuestionnaire
                );
            });


        const modal =
            getModal();


        if (modal) {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {
                        closeQuestionnaire();
                    }
                }
            );
        }


        const menu =
            document.getElementById(
                "mobileMenuButton"
            );

        const nav =
            document.getElementById(
                "mainNav"
            );


        if (
            menu &&
            nav
        ) {

            menu.addEventListener(
                "click",
                () => {
                    nav.classList.toggle(
                        "open"
                    );
                }
            );
        }


        document
            .querySelectorAll(
                "#mainNav a"
            )
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {
                        nav?.classList.remove(
                            "open"
                        );
                    }
                );
            });


        const params =
            new URLSearchParams(
                window.location.search
            );


        if (
            params.get("payment") ===
            "success"
        ) {

            alert(
                "Paiement confirmé ! Ton compte GiftFinder va être mis à jour."
            );

            loadAccount();

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }


        if (
            params.get("payment") ===
            "cancelled"
        ) {

            alert(
                "Paiement annulé."
            );

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }
);


/* =========================================================
   EXPORTS
========================================================= */

window.openQuestionnaire =
    openQuestionnaire;

window.closeQuestionnaire =
    closeQuestionnaire;

window.generateResults =
    generateResults;

window.renderRecommendations =
    renderRecommendations;

window.startGiftSearch =
    startGiftSearch;

window.openGiftFinder =
    openQuestionnaire;

window.openGiftFinderQuestionnaire =
    openQuestionnaire;

window.createCheckoutSession =
    createCheckoutSession;

window.openPaymentModal =
    openPaymentModal;

window.closePaymentModal =
    closePaymentModal;

window.loadGiftFinderAccount =
    loadAccount;

window.toggleGiftFinderFavorite =
    toggleGiftFinderFavorite;

window.removeGiftFinderFavorite =
    removeGiftFinderFavorite;
