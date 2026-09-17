"use strict";

/* =========================================================
   GIFT FINDER — APP.JS
========================================================= */

/* =========================================================
   ÉTAT
========================================================= */

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
    questionHistory: [],
    recommendations: []
};

const FAVORITES_KEY = "giftfinder_favorites";
const USER_ID_KEY = "giftfinder_user_id";

/* =========================================================
   IDENTIFIANT UTILISATEUR
========================================================= */

function getGiftFinderUserId() {
    let userId = localStorage.getItem(USER_ID_KEY);

    if (!userId) {
        if (window.crypto && crypto.randomUUID) {
            userId = crypto.randomUUID();
        } else {
            userId =
                "gf_" +
                Math.random().toString(36).slice(2) +
                Date.now().toString(36);
        }

        localStorage.setItem(USER_ID_KEY, userId);
    }

    return userId;
}

function apiHeaders() {
    return {
        "Content-Type": "application/json",
        "x-giftfinder-user-id": getGiftFinderUserId()
    };
}

/* =========================================================
   UTILITAIRES
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getFavorites() {
    try {
        return JSON.parse(
            localStorage.getItem(FAVORITES_KEY) || "[]"
        );
    } catch {
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(favorites)
    );
}

function isFavorite(item) {
    const favorites = getFavorites();

    return favorites.some(
        favorite =>
            favorite.name === item.name &&
            favorite.link === item.link
    );
}

function toggleFavorite(index) {
    const item = state.recommendations[index];

    if (!item) return;

    const favorites = getFavorites();

    const existingIndex = favorites.findIndex(
        favorite =>
            favorite.name === item.name &&
            favorite.link === item.link
    );

    if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push(item);
    }

    saveFavorites(favorites);

    renderRecommendations(state.recommendations);
}

/* =========================================================
   ÉLÉMENTS DOM
========================================================= */

function getModal() {
    return document.getElementById("giftFinderModal");
}

function getQuestionContainer() {
    return (
        document.getElementById("questionContainer") ||
        document.getElementById("questionnaireContent") ||
        document.getElementById("questionsContainer")
    );
}

/* =========================================================
   OUVERTURE QUESTIONNAIRE
========================================================= */

function openQuestionnaire(category = "") {
    state.category = category || "";
    state.answers.category = category || "";
    state.currentQuestion = 0;
    state.questionHistory = [];

    const modal = getModal();

    if (modal) {
        modal.classList.add("active");
        modal.style.display = "flex";
    }

    state.questions = getQuestions();

    renderQuestion();
}

function closeQuestionnaire() {
    const modal = getModal();

    if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
    }
}

/* =========================================================
   QUESTIONS DE BASE
========================================================= */

function getQuestions() {
    const questions = [
        {
            id: "recipient",
            text: "À qui veux-tu offrir ce cadeau ?",
            type: "choice",
            options: [
                {
                    value: "ami",
                    label: "Un ami / une amie"
                },
                {
                    value: "famille",
                    label: "Un membre de ma famille"
                },
                {
                    value: "partenaire",
                    label: "Mon/ma partenaire"
                },
                {
                    value: "parent",
                    label: "Mon père ou ma mère"
                },
                {
                    value: "enfant",
                    label: "Un enfant"
                },
                {
                    value: "autre",
                    label: "Autre"
                }
            ]
        },
        {
            id: "budget",
            text: "Quel est ton budget ?",
            type: "choice",
            options: [
                {
                    value: "moins_20",
                    label: "Moins de 20 €"
                },
                {
                    value: "20_50",
                    label: "20 – 50 €"
                },
                {
                    value: "50_100",
                    label: "50 – 100 €"
                },
                {
                    value: "100_200",
                    label: "100 – 200 €"
                },
                {
                    value: "plus_200",
                    label: "Plus de 200 €"
                }
            ]
        }
    ];

    const categories =
        window.giftCategories ||
        [
            {
                id: "gaming",
                name: "Gaming / jeux vidéo"
            },
            {
                id: "stickers",
                name: "Stickers"
            },
            {
                id: "tech",
                name: "Électronique / Tech"
            },
            {
                id: "fashion",
                name: "Mode"
            },
            {
                id: "sneakers",
                name: "Sneakers"
            },
            {
                id: "streetwear",
                name: "Streetwear"
            },
            {
                id: "jewelry",
                name: "Bijoux"
            },
            {
                id: "sport",
                name: "Sport"
            },
            {
                id: "food",
                name: "Nourriture"
            },
            {
                id: "drinks",
                name: "Boissons"
            },
            {
                id: "creative",
                name: "Créatif"
            },
            {
                id: "books",
                name: "Livres"
            },
            {
                id: "home",
                name: "Maison"
            },
            {
                id: "beauty",
                name: "Beauté"
            },
            {
                id: "music",
                name: "Musique"
            },
            {
                id: "personalized",
                name: "Personnalisé"
            },
            {
                id: "travel",
                name: "Voyage"
            },
            {
                id: "experience",
                name: "Expérience / activité"
            }
        ];

    questions.push({
        id: "category",
        text: "Quel type de cadeau recherches-tu ?",
        type: "choice",
        options: categories.map(category => ({
            value: category.id || category.name,
            label: category.name || category.label
        }))
    });

    const category =
        state.category ||
        state.answers.category;

    if (category === "gaming") {
        questions.push({
            id: "platform",
            text: "Sur quelle plateforme joue cette personne ?",
            type: "choice",
            options: [
                {
                    value: "pc",
                    label: "PC"
                },
                {
                    value: "playstation",
                    label: "PlayStation"
                },
                {
                    value: "xbox",
                    label: "Xbox"
                },
                {
                    value: "nintendo",
                    label: "Nintendo"
                },
                {
                    value: "mobile",
                    label: "Mobile"
                },
                {
                    value: "peu_importe",
                    label: "Peu importe"
                }
            ]
        });

        questions.push({
            id: "game",
            text: "Quels jeux aime cette personne ?",
            type: "text",
            placeholder:
                "Exemple : Fortnite, Minecraft, EA FC..."
        });
    }

    if (
        category === "experience" ||
        category === "travel" ||
        category === "activity" ||
        category === "place"
    ) {
        questions.push({
            id: "city",
            text: "Dans quelle ville doit se trouver l'expérience ?",
            type: "text",
            placeholder: "Exemple : Paris"
        });
    }

    questions.push({
        id: "occasion",
        text: "Pour quelle occasion ?",
        type: "choice",
        options: [
            {
                value: "anniversaire",
                label: "Anniversaire"
            },
            {
                value: "noel",
                label: "Noël"
            },
            {
                value: "saint_valentin",
                label: "Saint-Valentin"
            },
            {
                value: "fete",
                label: "Fête"
            },
            {
                value: "remerciement",
                label: "Remerciement"
            },
            {
                value: "autre",
                label: "Autre"
            }
        ]
    });

    questions.push({
        id: "preferences",
        text: "Quels sont ses goûts, passions ou préférences ?",
        type: "textarea",
        placeholder:
            "Exemple : aime le sport, le football, les voitures, le noir, les objets originaux..."
    });

    return questions;
}

/* =========================================================
   AFFICHAGE QUESTION
========================================================= */

function renderQuestion() {
    const container = getQuestionContainer();

    if (!container) {
        console.error(
            "❌ Conteneur du questionnaire introuvable."
        );
        return;
    }

    if (
        state.currentQuestion >=
        state.questions.length
    ) {
        finishQuestionnaire();
        return;
    }

    const question =
        state.questions[
            state.currentQuestion
        ];

    let html = `
        <div class="question-step">
            <div class="question-progress">
                Question ${state.currentQuestion + 1}
                sur ${state.questions.length}
            </div>

            <h2>
                ${escapeHTML(question.text)}
            </h2>
    `;

    if (question.type === "choice") {
        html += `
            <div class="question-options">
        `;

        question.options.forEach(option => {
            const currentValue =
                state.answers[question.id];

            const selected =
                Array.isArray(currentValue)
                    ? currentValue.includes(option.value)
                    : currentValue === option.value;

            html += `
                <button
                    type="button"
                    class="question-option ${
                        selected ? "selected" : ""
                    }"
                    data-question-id="${escapeHTML(
                        question.id
                    )}"
                    data-value="${escapeHTML(
                        option.value
                    )}"
                >
                    ${escapeHTML(option.label)}
                </button>
            `;
        });

        html += `
            </div>
        `;
    }

    if (question.type === "text") {
        html += `
            <input
                id="questionInput"
                class="question-input"
                type="text"
                placeholder="${escapeHTML(
                    question.placeholder || ""
                )}"
                value="${escapeHTML(
                    state.answers[question.id] || ""
                )}"
                autocomplete="off"
            >
        `;
    }

    if (question.type === "textarea") {
        html += `
            <textarea
                id="questionInput"
                class="question-input"
                rows="5"
                placeholder="${escapeHTML(
                    question.placeholder || ""
                )}"
            >${escapeHTML(
                state.answers[question.id] || ""
            )}</textarea>
        `;
    }

    html += `
            <div
                id="questionError"
                class="question-error"
                style="display:none;"
            ></div>

            <div class="question-navigation">
                ${
                    state.currentQuestion > 0
                        ? `
                            <button
                                type="button"
                                id="previousQuestion"
                            >
                                Retour
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    id="nextQuestion"
                >
                    ${
                        state.currentQuestion ===
                        state.questions.length - 1
                            ? "Voir les cadeaux"
                            : "Continuer"
                    }
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;

    document
        .querySelectorAll(".question-option")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const questionId =
                        button.dataset.questionId;

                    const value =
                        button.dataset.value;

                    state.answers[
                        questionId
                    ] = value;

                    document
                        .querySelectorAll(
                            ".question-option"
                        )
                        .forEach(optionButton => {
                            optionButton.classList.remove(
                                "selected"
                            );
                        });

                    button.classList.add(
                        "selected"
                    );
                }
            );
        });

    const nextButton =
        document.getElementById(
            "nextQuestion"
        );

    if (nextButton) {
        nextButton.addEventListener(
            "click",
            goNext
        );
    }

    const previousButton =
        document.getElementById(
            "previousQuestion"
        );

    if (previousButton) {
        previousButton.addEventListener(
            "click",
            goPrevious
        );
    }
}

/* =========================================================
   VALIDATION
========================================================= */

function validateQuestion() {
    const question =
        state.questions[
            state.currentQuestion
        ];

    if (!question) {
        return true;
    }

    if (
        question.type === "choice" &&
        !state.answers[question.id]
    ) {
        showQuestionError(
            "Choisis une réponse pour continuer."
        );

        return false;
    }

    if (
        question.type === "text" ||
        question.type === "textarea"
    ) {
        const input =
            document.getElementById(
                "questionInput"
            );

        const value =
            input?.value?.trim() || "";

        if (!value) {
            showQuestionError(
                "Remplis ce champ pour continuer."
            );

            return false;
        }

        state.answers[
            question.id
        ] = value;
    }

    return true;
}

function showQuestionError(message) {
    const error =
        document.getElementById(
            "questionError"
        );

    if (!error) return;

    error.textContent = message;
    error.style.display = "block";
}

/* =========================================================
   QUESTION SUIVANTE
========================================================= */

async function goNext() {
    if (!validateQuestion()) {
        return;
    }

    const question =
        state.questions[
            state.currentQuestion
        ];

    state.questionHistory.push({
        id: question.id,
        question: question.text,
        answer: state.answers[question.id]
    });

    state.currentQuestion++;

    if (
        state.currentQuestion >=
        state.questions.length
    ) {
        await finishQuestionnaire();
        return;
    }

    renderQuestion();

    /*
     * L'IA peut analyser les réponses
     * et éventuellement proposer une question
     * supplémentaire.
     */
    await askAIForNextQuestion();
}

/* =========================================================
   QUESTION PRÉCÉDENTE
========================================================= */

function goPrevious() {
    if (state.currentQuestion <= 0) {
        return;
    }

    state.currentQuestion--;

    renderQuestion();
}

/* =========================================================
   IA — QUESTION SUPPLÉMENTAIRE
========================================================= */

async function askAIForNextQuestion() {
    try {
        const response = await fetch(
            "/api/analyze-answer",
            {
                method: "POST",
                headers: apiHeaders(),
                body: JSON.stringify({
                    answers: state.answers,
                    lastAnswer:
                        state.answers[
                            state.questions[
                                state.currentQuestion - 1
                            ]?.id
                        ],
                    questionHistory:
                        state.questionHistory
                })
            }
        );

        if (!response.ok) {
            return;
        }

        const result =
            await response.json();

        if (
            result.shouldContinue &&
            result.nextQuestion
        ) {
            const question =
                result.nextQuestion;

            if (
                question.id &&
                question.text &&
                question.type
            ) {
                /*
                 * Évite les doublons.
                 */
                const alreadyExists =
                    state.questions.some(
                        existing =>
                            existing.id ===
                            question.id
                    );

                if (!alreadyExists) {
                    state.questions.push(
                        question
                    );
                }
            }
        }
    } catch (error) {
        console.warn(
            "⚠️ Analyse IA indisponible :",
            error
        );
    }
}

/* =========================================================
   FIN DU QUESTIONNAIRE
========================================================= */

async function finishQuestionnaire() {
    const container =
        getQuestionContainer();

    if (container) {
        container.innerHTML = `
            <div class="question-loading">
                <div class="loading-spinner"></div>
                <h2>Recherche des meilleurs cadeaux...</h2>
                <p>
                    GiftFinder analyse tes réponses.
                </p>
            </div>
        `;
    }

    await generateResults();
}

/* =========================================================
   DÉMARRER UNE RECHERCHE
========================================================= */

async function startGiftSearchWithCredit(
    category = ""
) {
    try {
        const response = await fetch(
            "/api/start-search",
            {
                method: "POST",
                headers: apiHeaders(),
                body: JSON.stringify({
                    category
                })
            }
        );

        const data =
            await response.json();

        if (response.status === 402) {
            openPaymentModal();
            return false;
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                    "Impossible de démarrer la recherche."
            );
        }

        return true;
    } catch (error) {
        console.error(
            "❌ Recherche impossible :",
            error
        );

        alert(
            error.message ||
                "Une erreur est survenue."
        );

        return false;
    }
}

/* =========================================================
   OUVRIR UNE RECHERCHE AVEC LE SYSTÈME DE CRÉDITS
========================================================= */

async function startGiftSearch(
    category = ""
) {
    const allowed =
        await startGiftSearchWithCredit(
            category
        );

    if (!allowed) {
        return;
    }

    openQuestionnaire(category);
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
                    headers: {
                        "x-giftfinder-user-id":
                            getGiftFinderUserId()
                    }
                }
            );

        if (!response.ok) {
            return null;
        }

        const account =
            await response.json();

        updateAccountUI(account);

        return account;
    } catch (error) {
        console.warn(
            "⚠️ Impossible de récupérer le compte :",
            error
        );

        return null;
    }
}

function updateAccountUI(account) {
    if (!account) return;

    const creditElements =
        document.querySelectorAll(
            "[data-giftfinder-credits]"
        );

    creditElements.forEach(element => {
        element.textContent =
            account.premium
                ? "Premium"
                : String(
                      account.credits || 0
                  );
    });

    const premiumElements =
        document.querySelectorAll(
            "[data-giftfinder-premium]"
        );

    premiumElements.forEach(element => {
        element.textContent =
            account.premium
                ? "Premium actif"
                : "Compte gratuit";
    });
}

/* =========================================================
   MODAL PAIEMENT
========================================================= */

function openPaymentModal() {
    let modal =
        document.getElementById(
            "giftFinderPaymentModal"
        );

    if (!modal) {
        modal =
            document.createElement("div");

        modal.id =
            "giftFinderPaymentModal";

        modal.innerHTML = `
            <div class="giftfinder-payment-overlay">
                <div class="giftfinder-payment-box">

                    <button
                        type="button"
                        id="closePaymentModal"
                        class="giftfinder-payment-close"
                    >
                        ×
                    </button>

                    <h2>
                        Continue avec GiftFinder
                    </h2>

                    <p>
                        Tu as utilisé ta recherche
                        gratuite du jour.
                    </p>

                    <div class="giftfinder-payment-options">

                        <button
                            type="button"
                            class="giftfinder-payment-option"
                            data-payment-product="premium"
                        >
                            <strong>
                                Premium
                            </strong>

                            <span>
                                3,99 € / mois
                            </span>

                            <small>
                                Recherches illimitées
                            </small>
                        </button>

                        <button
                            type="button"
                            class="giftfinder-payment-option"
                            data-payment-product="pack10"
                        >
                            <strong>
                                Pack 10
                            </strong>

                            <span>
                                4,99 €
                            </span>

                            <small>
                                10 recherches
                            </small>
                        </button>

                        <button
                            type="button"
                            class="giftfinder-payment-option"
                            data-payment-product="pack30"
                        >
                            <strong>
                                Pack 30
                            </strong>

                            <span>
                                9,99 €
                            </span>

                            <small>
                                30 recherches
                            </small>
                        </button>

                    </div>

                    <div
                        id="paymentError"
                        style="
                            display:none;
                            margin-top:15px;
                        "
                    ></div>

                    <div
                        id="paymentLoading"
                        style="
                            display:none;
                            margin-top:15px;
                        "
                    >
                        Redirection vers Stripe...
                    </div>

                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeButton =
            document.getElementById(
                "closePaymentModal"
            );

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                closePaymentModal
            );
        }

        modal
            .querySelectorAll(
                "[data-payment-product]"
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        createCheckoutSession(
                            button.dataset
                                .paymentProduct
                        );
                    }
                );
            });
    }

    modal.style.display = "flex";
    modal.classList.add("active");

    loadAccount();
}

function closePaymentModal() {
    const modal =
        document.getElementById(
            "giftFinderPaymentModal"
        );

    if (!modal) return;

    modal.classList.remove("active");
    modal.style.display = "none";
}

/* =========================================================
   STRIPE CHECKOUT
========================================================= */

async function createCheckoutSession(
    product
) {
    const loading =
        document.getElementById(
            "paymentLoading"
        );

    const errorBox =
        document.getElementById(
            "paymentError"
        );

    if (loading) {
        loading.style.display =
            "block";
    }

    if (errorBox) {
        errorBox.style.display =
            "none";
        errorBox.textContent = "";
    }

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

        if (!data.url) {
            throw new Error(
                "Stripe n'a pas fourni de lien de paiement."
            );
        }

        /*
         * Redirection vers Stripe Checkout.
         */
        window.location.href =
            data.url;
    } catch (error) {
        console.error(
            "❌ Erreur Stripe :",
            error
        );

        if (loading) {
            loading.style.display =
                "none";
        }

        if (errorBox) {
            errorBox.textContent =
                error.message ||
                "Impossible d'ouvrir le paiement.";

            errorBox.style.display =
                "block";
        }
    }
}

/* =========================================================
   RECOMMANDATIONS
========================================================= */

async function generateResults() {
    try {
        const response =
            await fetch(
                "/api/recommendations",
                {
                    method: "POST",
                    headers: apiHeaders(),
                    body: JSON.stringify(
                        state.answers
                    )
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                    "Impossible de générer les cadeaux."
            );
        }

        state.recommendations =
            Array.isArray(
                data.recommendations
            )
                ? data.recommendations
                : [];

        closeQuestionnaire();

        renderRecommendations(
            state.recommendations
        );

        await loadAccount();
    } catch (error) {
        console.error(
            "❌ Erreur recommandations :",
            error
        );

        const container =
            getQuestionContainer();

        if (container) {
            container.innerHTML = `
                <div class="question-error">
                    <h2>
                        Une erreur est survenue
                    </h2>

                    <p>
                        ${escapeHTML(
                            error.message ||
                                "Impossible de générer les recommandations."
                        )}
                    </p>

                    <button
                        type="button"
                        onclick="closeQuestionnaire()"
                    >
                        Fermer
                    </button>
                </div>
            `;
        } else {
            alert(
                error.message ||
                    "Impossible de générer les recommandations."
            );
        }
    }
}

/* =========================================================
   AFFICHAGE DES RÉSULTATS
========================================================= */

function renderRecommendations(
    recommendations
) {
    const container =
        document.getElementById(
            "recommendations"
        ) ||
        document.getElementById(
            "results"
        ) ||
        document.getElementById(
            "giftResults"
        );

    if (!container) {
        console.warn(
            "⚠️ Conteneur des recommandations introuvable."
        );

        return;
    }

    if (
        !recommendations ||
        recommendations.length === 0
    ) {
        container.innerHTML = `
            <div class="no-results">
                <h2>
                    Aucun cadeau trouvé
                </h2>

                <p>
                    Essaie avec d'autres préférences.
                </p>
            </div>
        `;

        return;
    }

    let html = `
        <div class="gift-results-header">
            <h2>
                Voici des idées pour toi 🎁
            </h2>

            <p>
                ${recommendations.length}
                recommandations
            </p>
        </div>

        <div class="gift-results-list">
    `;

    recommendations.forEach(
        (item, index) => {
            const favorite =
                isFavorite(item);

            const image =
                item.image ||
                item.imageUrl ||
                item.thumbnail ||
                "";

            const name =
                item.name ||
                "Cadeau";

            const description =
                item.description ||
                "";

            const reason =
                item.reason ||
                "";

            const price =
                item.price ||
                item.estimatedPrice ||
                "";

            const link =
                item.link ||
                item.url ||
                "#";

            html += `
                <article
                    class="gift-card"
                    data-index="${index}"
                >

                    <div class="gift-card-image">

                        ${
                            image
                                ? `
                                    <img
                                        src="${escapeHTML(
                                            image
                                        )}"
                                        alt="${escapeHTML(
                                            name
                                        )}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div class="gift-card-no-image">
                                        🎁
                                    </div>
                                `
                        }

                    </div>

                    <div class="gift-card-content">

                        <h3>
                            ${escapeHTML(
                                name
                            )}
                        </h3>

                        ${
                            price
                                ? `
                                    <div class="gift-card-price">
                                        ${escapeHTML(
                                            price
                                        )}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            description
                                ? `
                                    <p class="gift-card-description">
                                        ${escapeHTML(
                                            description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        ${
                            reason
                                ? `
                                    <p class="gift-card-reason">
                                        ${escapeHTML(
                                            reason
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        <div class="gift-card-actions">

                            ${
                                link &&
                                link !== "#"
                                    ? `
                                        <a
                                            href="${escapeHTML(
                                                link
                                            )}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="gift-card-buy"
                                        >
                                            Voir le cadeau
                                        </a>
                                    `
                                    : ""
                            }

                            <button
                                type="button"
                                class="gift-card-favorite ${
                                    favorite
                                        ? "active"
                                        : ""
                                }"
                                data-favorite-index="${index}"
                                aria-label="${
                                    favorite
                                        ? "Retirer des favoris"
                                        : "Ajouter aux favoris"
                                }"
                            >
                                ${
                                    favorite
                                        ? "♥"
                                        : "♡"
                                }
                            </button>

                        </div>

                    </div>

                </article>
            `;
        }
    );

    html += `
        </div>
    `;

    container.innerHTML = html;

    container
        .querySelectorAll(
            "[data-favorite-index]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const index =
                        Number(
                            button.dataset
                                .favoriteIndex
                        );

                    toggleFavorite(index);
                }
            );
        });
}

/* =========================================================
   BOUTONS DE PAIEMENT EXISTANTS DANS LE HTML
========================================================= */

function setupPaymentButtons() {
    /*
     * Permet d'utiliser directement :
     *
     * data-payment-product="premium"
     * data-payment-product="pack10"
     * data-payment-product="pack30"
     */

    document
        .querySelectorAll(
            "[data-payment-product]"
        )
        .forEach(button => {
            /*
             * Évite de brancher deux fois
             * le même bouton.
             */
            if (
                button.dataset
                    .giftfinderStripeReady ===
                "true"
            ) {
                return;
            }

            button.dataset
                .giftfinderStripeReady =
                "true";

            button.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    createCheckoutSession(
                        button.dataset
                            .paymentProduct
                    );
                }
            );
        });

    /*
     * IDs possibles pour les boutons
     * si ton HTML utilise ces noms.
     */

    const mappings = [
        [
            "premiumButton",
            "premium"
        ],
        [
            "premium-btn",
            "premium"
        ],
        [
            "pack10Button",
            "pack10"
        ],
        [
            "pack10-btn",
            "pack10"
        ],
        [
            "pack30Button",
            "pack30"
        ],
        [
            "pack30-btn",
            "pack30"
        ]
    ];

    mappings.forEach(
        ([id, product]) => {
            const button =
                document.getElementById(
                    id
                );

            if (!button) return;

            if (
                button.dataset
                    .giftfinderStripeReady ===
                "true"
            ) {
                return;
            }

            button.dataset
                .giftfinderStripeReady =
                "true";

            button.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    createCheckoutSession(
                        product
                    );
                }
            );
        }
    );
}

/* =========================================================
   BOUTONS DE RECHERCHE EXISTANTS
========================================================= */

function setupSearchButtons() {
    /*
     * Boutons utilisant :
     * data-giftfinder-search
     */

    document
        .querySelectorAll(
            "[data-giftfinder-search]"
        )
        .forEach(button => {
            if (
                button.dataset
                    .giftfinderSearchReady ===
                "true"
            ) {
                return;
            }

            button.dataset
                .giftfinderSearchReady =
                "true";

            button.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    const category =
                        button.dataset
                            .giftfinderCategory ||
                        "";

                    startGiftSearch(
                        category
                    );
                }
            );
        });
}

/* =========================================================
   ÉVÉNEMENTS GLOBAUX
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        getGiftFinderUserId();

        setupPaymentButtons();
        setupSearchButtons();

        loadAccount();

        /*
         * Fermer le modal questionnaire
         * en cliquant sur l'extérieur.
         */
        document.addEventListener(
            "click",
            event => {
                const modal =
                    getModal();

                if (
                    modal &&
                    event.target ===
                        modal
                ) {
                    closeQuestionnaire();
                }
            }
        );

        /*
         * Paiement après retour de Stripe.
         */
        const params =
            new URLSearchParams(
                window.location.search
            );

        const payment =
            params.get(
                "payment"
            );

        if (
            payment ===
            "success"
        ) {
            /*
             * Le webhook Stripe peut prendre
             * quelques instants.
             */
            setTimeout(
                loadAccount,
                1500
            );

            /*
             * Nettoie l'URL.
             */
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }

        if (
            payment ===
            "cancelled"
        ) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }
);

/* =========================================================
   FONCTIONS GLOBALES
========================================================= */

window.openQuestionnaire =
    openQuestionnaire;

window.closeQuestionnaire =
    closeQuestionnaire;

window.generateResults =
    generateResults;

window.renderRecommendations =
    renderRecommendations;

/*
 * Ces fonctions démarrent maintenant
 * une recherche avec vérification du crédit.
 */
window.openGiftFinder =
    startGiftSearch;

window.startGiftSearch =
    startGiftSearch;

window.openGiftFinderQuestionnaire =
    startGiftSearch;

/*
 * Stripe.
 */
window.createCheckoutSession =
    createCheckoutSession;

window.openPaymentModal =
    openPaymentModal;

window.closePaymentModal =
    closePaymentModal;

/*
 * Compte.
 */
window.loadGiftFinderAccount =
    loadAccount;
