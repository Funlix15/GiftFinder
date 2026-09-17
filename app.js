/* =========================================================
   GIFTFINDER — APP.JS
   Questionnaire + IA + résultats + Stripe
========================================================= */

"use strict";

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
    }
};

let currentQuestion = 0;
let isStartingSearch = false;
let account = {
    userId: "",
    credits: 0,
    premium: false,
    canSearch: true,
    freeSearchAvailable: true
};

/* =========================================================
   OUTILS
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/*
   Identifiant stable pour cet utilisateur.

   IMPORTANT :
   Ce n'est PAS une clé Stripe.
*/
function getGiftFinderUserId() {
    let id = localStorage.getItem("giftfinder_user_id");

    if (!id) {
        if (window.crypto && crypto.randomUUID) {
            id = crypto.randomUUID();
        } else {
            id =
                Date.now().toString(36) +
                Math.random().toString(36).slice(2);
        }

        localStorage.setItem(
            "giftfinder_user_id",
            id
        );
    }

    return id;
}

function apiHeaders(extra = {}) {
    return {
        "Content-Type": "application/json",
        "x-giftfinder-user-id":
            getGiftFinderUserId(),
        ...extra
    };
}

function getCategoryName(category) {
    if (Array.isArray(window.giftCategories)) {
        const found = window.giftCategories.find(
            item =>
                item.id === category ||
                item.value === category
        );

        if (found) {
            return (
                found.name ||
                found.label ||
                category
            );
        }
    }

    return category;
}

/* =========================================================
   COMPTE / CRÉDITS
========================================================= */

async function refreshAccount() {
    try {
        const response = await fetch(
            "/api/account",
            {
                method: "GET",
                headers: apiHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Impossible de récupérer le compte."
            );
        }

        account = {
            ...account,
            ...data
        };

        updateAccountUI();

        return account;
    } catch (error) {
        console.error(
            "Erreur compte GiftFinder :",
            error
        );

        return account;
    }
}

function updateAccountUI() {
    const creditsElements =
        document.querySelectorAll(
            "[data-credits], #creditsCount"
        );

    creditsElements.forEach(element => {
        element.textContent =
            String(account.credits ?? 0);
    });

    const premiumElements =
        document.querySelectorAll(
            "[data-premium-status], #premiumStatus"
        );

    premiumElements.forEach(element => {
        element.textContent =
            account.premium
                ? "Premium actif"
                : "Compte gratuit";
    });
}

/* =========================================================
   STRIPE — POPUP BOUTIQUE
========================================================= */

function injectStripeStyles() {
    if (
        document.getElementById(
            "giftfinder-stripe-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "giftfinder-stripe-styles";

    style.textContent = `
        .giftfinder-store-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
            background: rgba(0,0,0,.6);
            backdrop-filter: blur(8px);
        }

        .giftfinder-store-overlay.is-open {
            display: flex;
        }

        .giftfinder-store {
            position: relative;
            width: min(760px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            box-sizing: border-box;
            padding: 30px;
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 25px 80px rgba(0,0,0,.25);
        }

        .giftfinder-store-close {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 40px;
            height: 40px;
            border: 0;
            border-radius: 50%;
            background: #f1f1f1;
            font-size: 22px;
            cursor: pointer;
        }

        .giftfinder-store-header {
            text-align: center;
            margin-bottom: 25px;
        }

        .giftfinder-store-header h2 {
            margin: 0 0 8px;
            font-size: 30px;
        }

        .giftfinder-store-header p {
            margin: 0;
            color: #666;
        }

        .giftfinder-store-products {
            display: grid;
            grid-template-columns:
                repeat(3, minmax(0, 1fr));
            gap: 15px;
        }

        .giftfinder-product {
            padding: 22px;
            border: 2px solid #e5e7eb;
            border-radius: 18px;
            text-align: center;
            background: #fff;
        }

        .giftfinder-product.featured {
            border-color: #111;
        }

        .giftfinder-product h3 {
            margin: 0 0 10px;
        }

        .giftfinder-product-price {
            margin: 10px 0;
            font-size: 25px;
            font-weight: 900;
        }

        .giftfinder-product-description {
            min-height: 45px;
            margin-bottom: 18px;
            color: #666;
            font-size: 14px;
            line-height: 1.4;
        }

        .giftfinder-buy-button {
            width: 100%;
            min-height: 46px;
            border: 0;
            border-radius: 12px;
            background: #111;
            color: #fff;
            font: inherit;
            font-weight: 800;
            cursor: pointer;
        }

        .giftfinder-buy-button:hover {
            opacity: .88;
        }

        .giftfinder-buy-button:disabled {
            opacity: .5;
            cursor: wait;
        }

        .giftfinder-store-note {
            margin-top: 20px;
            text-align: center;
            color: #777;
            font-size: 12px;
        }

        @media (max-width: 700px) {
            .giftfinder-store {
                padding: 22px;
            }

            .giftfinder-store-products {
                grid-template-columns: 1fr;
            }

            .giftfinder-product-description {
                min-height: auto;
            }
        }
    `;

    document.head.appendChild(style);
}

function createStoreModal() {
    injectStripeStyles();

    let modal =
        document.getElementById(
            "giftfinderStoreModal"
        );

    if (modal) {
        return modal;
    }

    modal =
        document.createElement("div");

    modal.id =
        "giftfinderStoreModal";

    modal.className =
        "giftfinder-store-overlay";

    modal.innerHTML = `
        <div
            class="giftfinder-store"
            role="dialog"
            aria-modal="true"
            aria-labelledby="giftfinderStoreTitle"
        >

            <button
                type="button"
                class="giftfinder-store-close"
                id="giftfinderStoreClose"
                aria-label="Fermer"
            >
                ×
            </button>

            <div class="giftfinder-store-header">

                <h2 id="giftfinderStoreTitle">
                    Continue ta recherche 🎁
                </h2>

                <p>
                    Tu as utilisé ta recherche gratuite.
                    Choisis une offre pour continuer.
                </p>

            </div>

            <div class="giftfinder-store-products">

                <div class="giftfinder-product featured">

                    <h3>Premium</h3>

                    <div class="giftfinder-product-price">
                        3,99 € / mois
                    </div>

                    <div class="giftfinder-product-description">
                        Recherches illimitées avec GiftFinder.
                    </div>

                    <button
                        type="button"
                        class="giftfinder-buy-button"
                        data-stripe-product="premium"
                    >
                        Passer Premium
                    </button>

                </div>

                <div class="giftfinder-product">

                    <h3>Pack 10</h3>

                    <div class="giftfinder-product-price">
                        4,99 €
                    </div>

                    <div class="giftfinder-product-description">
                        10 recherches supplémentaires.
                    </div>

                    <button
                        type="button"
                        class="giftfinder-buy-button"
                        data-stripe-product="pack10"
                    >
                        Acheter 10 recherches
                    </button>

                </div>

                <div class="giftfinder-product">

                    <h3>Pack 30</h3>

                    <div class="giftfinder-product-price">
                        9,99 €
                    </div>

                    <div class="giftfinder-product-description">
                        30 recherches supplémentaires.
                    </div>

                    <button
                        type="button"
                        class="giftfinder-buy-button"
                        data-stripe-product="pack30"
                    >
                        Acheter 30 recherches
                    </button>

                </div>

            </div>

            <div class="giftfinder-store-note">
                Paiement sécurisé via Stripe.
            </div>

        </div>
    `;

    document.body.appendChild(modal);

    const closeButton =
        modal.querySelector(
            "#giftfinderStoreClose"
        );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeStoreModal
        );
    }

    modal.addEventListener(
        "click",
        event => {
            if (event.target === modal) {
                closeStoreModal();
            }
        }
    );

    return modal;
}

function openStoreModal() {
    const modal =
        createStoreModal();

    modal.classList.add("is-open");

    document.body.style.overflow =
        "hidden";
}

function closeStoreModal() {
    const modal =
        document.getElementById(
            "giftfinderStoreModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "is-open"
    );

    document.body.style.overflow =
        "";
}

/* =========================================================
   ACHAT STRIPE
========================================================= */

async function createCheckoutSession(product) {
    const allowedProducts = [
        "premium",
        "pack10",
        "pack30"
    ];

    if (
        !allowedProducts.includes(
            product
        )
    ) {
        console.error(
            "Produit Stripe invalide :",
            product
        );
        return;
    }

    const buttons =
        document.querySelectorAll(
            "[data-stripe-product]"
        );

    buttons.forEach(button => {
        button.disabled = true;
    });

    try {
        const response =
            await fetch(
                "/api/create-checkout-session",
                {
                    method: "POST",

                    headers:
                        apiHeaders(),

                    body:
                        JSON.stringify({
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
                "Stripe n'a pas retourné de lien de paiement."
            );
        }

        /*
         * Redirection vers Stripe Checkout.
         */
        window.location.href =
            data.url;

    } catch (error) {
        console.error(
            "Erreur Stripe :",
            error
        );

        alert(
            error.message ||
            "Une erreur est survenue avec le paiement."
        );

        buttons.forEach(button => {
            button.disabled = false;
        });
    }
}

/* =========================================================
   DÉMARRER UNE RECHERCHE
========================================================= */

async function startSearch(
    category = "",
    search = ""
) {
    if (isStartingSearch) {
        return;
    }

    isStartingSearch = true;

    try {
        const response =
            await fetch(
                "/api/start-search",
                {
                    method: "POST",
                    headers: apiHeaders(),
                    body: JSON.stringify({})
                }
            );

        let data = {};

        try {
            data =
                await response.json();
        } catch {
            data = {};
        }

        /*
         * 402 = aucune recherche disponible.
         */
        if (response.status === 402) {
            await refreshAccount();

            openStoreModal();

            return;
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Impossible de démarrer la recherche."
            );
        }

        /*
         * Recherche autorisée.
         * On ouvre ensuite le questionnaire.
         */
        await refreshAccount();

        openQuestionnaire(
            category,
            search
        );

    } catch (error) {
        console.error(
            "Erreur démarrage recherche :",
            error
        );

        alert(
            error.message ||
            "Impossible de démarrer la recherche."
        );
    } finally {
        isStartingSearch = false;
    }
}

/* =========================================================
   STYLES QUESTIONNAIRE + RÉSULTATS
========================================================= */

function injectGiftFinderStyles() {
    if (
        document.getElementById(
            "giftfinder-app-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "giftfinder-app-styles";

    style.textContent = `

        .questionnaire-modal {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: none;
        }

        .questionnaire-modal.is-open {
            display: block;
        }

        .questionnaire-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,.55);
            backdrop-filter: blur(8px);
        }

        .questionnaire-box {
            position: relative;
            z-index: 2;
            width: min(720px,calc(100% - 30px));
            max-height: calc(100vh - 30px);
            overflow-y: auto;
            margin: 15px auto;
            padding: 30px;
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 25px 80px rgba(0,0,0,.25);
        }

        .questionnaire-close {
            position: absolute;
            top: 18px;
            right: 18px;
            width: 40px;
            height: 40px;
            border: 0;
            border-radius: 50%;
            background: #f2f2f2;
            font-size: 25px;
            cursor: pointer;
        }

        .questionnaire-progress {
            width: 100%;
            height: 7px;
            overflow: hidden;
            background: #eee;
            border-radius: 999px;
        }

        .questionnaire-progress-bar {
            width: 0;
            height: 100%;
            background: #111;
            border-radius: 999px;
            transition: width .3s ease;
        }

        #progressText {
            margin: 10px 0 25px;
            color: #777;
            font-size: 14px;
        }

        .question-container h2 {
            margin: 0 0 10px;
            font-size: 28px;
            line-height: 1.2;
        }

        .question-description {
            margin: 0 0 25px;
            color: #777;
            line-height: 1.5;
        }

        .question-options {
            display: grid;
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 12px;
        }

        .question-option {
            padding: 18px;
            border: 2px solid #eee;
            border-radius: 16px;
            background: #fff;
            cursor: pointer;
            text-align: left;
            transition: .2s ease;
        }

        .question-option:hover {
            border-color: #bbb;
            transform: translateY(-1px);
        }

        .question-option.selected {
            border-color: #111;
            background: #f5f5f5;
        }

        .question-option-title {
            display: block;
            margin-bottom: 5px;
            font-weight: 700;
        }

        .question-option-description {
            display: block;
            color: #777;
            font-size: 14px;
        }

        .question-input,
        .question-textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 16px;
            border: 2px solid #eee;
            border-radius: 15px;
            outline: none;
            font: inherit;
        }

        .question-input:focus,
        .question-textarea:focus {
            border-color: #111;
        }

        .question-textarea {
            min-height: 140px;
            resize: vertical;
        }

        .questionnaire-actions {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 30px;
        }

        .questionnaire-primary,
        .questionnaire-secondary {
            min-height: 50px;
            padding: 0 22px;
            border: 0;
            border-radius: 13px;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
        }

        .questionnaire-primary {
            background: #111;
            color: #fff;
        }

        .questionnaire-secondary {
            background: #eee;
            color: #111;
        }

        .question-error {
            margin-top: 12px;
            padding: 12px 15px;
            border-radius: 12px;
            background: #fff1f1;
            color: #b00020;
            font-size: 14px;
        }

        #giftResults {
            width: 100%;
            padding: 55px 20px;
            box-sizing: border-box;
            background: #f8fafc;
        }

        .results-header {
            max-width: 1000px;
            margin: 0 auto 25px;
        }

        .results-label {
            display: inline-block;
            margin-bottom: 8px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: .12em;
            color: #777;
        }

        .results-header h2 {
            margin: 0 0 8px;
            font-size: 34px;
            color: #111827;
        }

        .results-header p {
            margin: 0;
            color: #777;
        }

        .gift-results-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 1000px;
            margin: 0 auto;
        }

        .gift-card {
            width: 100%;
            min-height: 150px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            gap: 22px;
            padding: 16px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }

        .gift-card-image {
            flex: 0 0 150px;
            width: 150px;
            height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border-radius: 8px;
            background: #f8fafc;
        }

        .gift-card-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .gift-image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f3f4f6;
            font-size: 3rem;
        }

        .gift-card-content {
            flex: 1;
            min-width: 0;
        }

        .gift-card h3 {
            margin: 0 0 12px;
            color: #111827;
            font-size: 1.15rem;
        }

        .gift-description,
        .gift-reason {
            color: #6b7280;
            line-height: 1.5;
        }

        .gift-price {
            margin: 0 0 15px;
            color: #111827;
            font-size: 1.25rem;
            font-weight: 900;
        }

        .gift-amazon-link {
            display: inline-flex;
            padding: 10px 15px;
            border-radius: 8px;
            background: #2563eb;
            color: #fff;
            text-decoration: none;
            font-size: .9rem;
            font-weight: 800;
        }

        .gift-favorite-button {
            margin-left: 8px;
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #fff;
            cursor: pointer;
            font-weight: 700;
        }

        .ai-loading-screen {
            min-height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .ai-loading-content {
            max-width: 500px;
        }

        .ai-loading-icon {
            display: block;
            font-size: 60px;
            margin-bottom: 20px;
            animation: giftPulse 1.5s infinite;
        }

        @keyframes giftPulse {
            0%,100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.08);
            }
        }

        .ai-loading-dots {
            display: flex;
            justify-content: center;
            gap: 7px;
            margin-top: 25px;
        }

        .ai-loading-dots span {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: currentColor;
            animation: loadingDot 1.2s infinite;
        }

        .ai-loading-dots span:nth-child(2) {
            animation-delay: .15s;
        }

        .ai-loading-dots span:nth-child(3) {
            animation-delay: .3s;
        }

        @keyframes loadingDot {
            0%,80%,100% {
                opacity: .25;
                transform: translateY(0);
            }
            40% {
                opacity: 1;
                transform: translateY(-5px);
            }
        }

        .ai-error {
            max-width: 600px;
            margin: 60px auto;
            padding: 40px 20px;
            text-align: center;
        }

        @media (max-width:700px) {

            .questionnaire-box {
                width: calc(100% - 20px);
                max-height: calc(100vh - 20px);
                margin: 10px auto;
                padding: 22px;
            }

            .question-options {
                grid-template-columns: 1fr;
            }

            .questionnaire-actions {
                flex-direction: column-reverse;
            }

            .questionnaire-primary,
            .questionnaire-secondary {
                width: 100%;
            }

            .gift-card {
                gap: 14px;
                padding: 12px;
            }

            .gift-card-image {
                flex: 0 0 105px;
                width: 105px;
                height: 105px;
            }

            .gift-description,
            .gift-reason {
                display: none;
            }

            .gift-card h3 {
                font-size: 1rem;
            }

            .gift-price {
                font-size: 1.1rem;
            }
        }
    `;

    document.head.appendChild(style);
}

/* =========================================================
   QUESTIONNAIRE
========================================================= */

function openQuestionnaire(
    category = "",
    search = ""
) {
    injectGiftFinderStyles();

    const modal =
        document.getElementById(
            "questionnaireModal"
        );

    if (!modal) {
        console.error(
            "Questionnaire introuvable dans index.html"
        );
        return;
    }

    state.category =
        category || "";

    state.answers = {
        recipient: "",
        budget: "",
        category:
            category || "",
        platform: "",
        game: [],
        city: "",
        occasion: "",
        preferences: "",
        search:
            search || ""
    };

    currentQuestion = 0;

    modal.classList.add(
        "is-open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    renderQuestion();
}

function closeQuestionnaire() {
    const modal =
        document.getElementById(
            "questionnaireModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "is-open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}

/* =========================================================
   QUESTIONS
========================================================= */

function getQuestions() {
    const questions = [];

    questions.push({
        id: "recipient",
        type: "options",
        title:
            "Pour qui cherches-tu un cadeau ?",
        description:
            "Choisis la personne qui va recevoir le cadeau.",
        options: [
            {
                value: "friend",
                label: "Un ami",
                description:
                    "Ami(e), meilleur ami(e)..."
            },
            {
                value: "family",
                label: "Famille",
                description:
                    "Parent, frère, sœur..."
            },
            {
                value: "partner",
                label: "Mon/ma partenaire",
                description:
                    "Petit(e) ami(e), conjoint(e)..."
            },
            {
                value: "child",
                label: "Un enfant",
                description:
                    "Enfant, neveu, nièce..."
            },
            {
                value: "colleague",
                label: "Un collègue",
                description:
                    "Cadeau professionnel."
            },
            {
                value: "self",
                label: "Pour moi",
                description:
                    "Une idée pour te faire plaisir."
            },
            {
                value: "other",
                label: "Autre",
                description:
                    "Une autre personne."
            }
        ]
    });

    questions.push({
        id: "budget",
        type: "options",
        title:
            "Quel est ton budget ?",
        description:
            "Choisis la tranche de prix qui te convient.",
        options: [
            {
                value: "under20",
                label: "Moins de 20 €",
                description:
                    "Petit budget"
            },
            {
                value: "20to50",
                label: "20 à 50 €",
                description:
                    "Budget moyen"
            },
            {
                value: "50to100",
                label: "50 à 100 €",
                description:
                    "Budget confortable"
            },
            {
                value: "100to250",
                label: "100 à 250 €",
                description:
                    "Cadeau important"
            },
            {
                value: "250plus",
                label: "250 € et plus",
                description:
                    "Budget élevé"
            }
        ]
    });

    let categoryOptions = [];

    if (
        Array.isArray(
            window.giftCategories
        )
    ) {
        categoryOptions =
            window.giftCategories.map(
                category => ({
                    value:
                        category.id ||
                        category.value,
                    label:
                        category.name ||
                        category.label ||
                        category.id,
                    description:
                        category.description ||
                        ""
                })
            );
    }

    if (
        categoryOptions.length === 0
    ) {
        categoryOptions = [
            ["gaming", "Gaming"],
            ["stickers", "Stickers"],
            ["tech", "Tech"],
            ["fashion", "Mode"],
            ["sneakers", "Sneakers"],
            ["streetwear", "Streetwear"],
            ["jewelry", "Bijoux"],
            ["sport", "Sport"],
            ["food", "Food"],
            ["drinks", "Boissons"],
            ["creative", "Créatif"],
            ["books", "Livres"],
            ["home", "Maison"],
            ["beauty", "Beauté"],
            ["music", "Musique"],
            ["personalized", "Personnalisé"],
            ["travel", "Voyage"],
            ["experience", "Expérience"]
        ].map(item => ({
            value: item[0],
            label: item[1],
            description: ""
        }));
    }

    questions.push({
        id: "category",
        type: "options",
        title:
            "Quel type de cadeau recherches-tu ?",
        description:
            "Choisis la catégorie qui t'intéresse.",
        options: categoryOptions
    });

    const selectedCategory =
        state.answers.category ||
        state.category ||
        "";

    if (
        selectedCategory ===
        "gaming"
    ) {
        questions.push({
            id: "platform",
            type: "options",
            title:
                "Sur quelle plateforme joue-t-il/elle ?",
            description:
                "Cela permettra d'affiner les recommandations.",
            options: [
                {
                    value: "pc",
                    label: "PC",
                    description:
                        "Ordinateur"
                },
                {
                    value: "playstation",
                    label: "PlayStation",
                    description:
                        "PS4 ou PS5"
                },
                {
                    value: "xbox",
                    label: "Xbox",
                    description:
                        "Xbox One ou Series"
                },
                {
                    value: "nintendo",
                    label: "Nintendo",
                    description:
                        "Switch et consoles Nintendo"
                },
                {
                    value: "mobile",
                    label: "Mobile",
                    description:
                        "Smartphone ou tablette"
                },
                {
                    value: "any",
                    label: "Peu importe",
                    description:
                        "Toutes les plateformes"
                }
            ]
        });

        questions.push({
            id: "game",
            type: "multiOptions",
            title:
                "À quels jeux joue-t-il/elle ?",
            description:
                "Tu peux sélectionner plusieurs jeux.",
            options: [
                {
                    value: "minecraft",
                    label: "Minecraft"
                },
                {
                    value: "fortnite",
                    label: "Fortnite"
                },
                {
                    value: "roblox",
                    label: "Roblox"
                },
                {
                    value: "gta",
                    label: "GTA"
                },
                {
                    value: "callofduty",
                    label: "Call of Duty"
                },
                {
                    value: "fc",
                    label: "EA Sports FC"
                },
                {
                    value: "pokemon",
                    label: "Pokémon"
                },
                {
                    value: "other",
                    label: "Autre"
                }
            ]
        });
    }

    if (
        selectedCategory === "experience" ||
        selectedCategory === "travel" ||
        selectedCategory === "activity" ||
        selectedCategory === "place"
    ) {
        questions.push({
            id: "city",
            type: "input",
            title:
                "Dans quelle ville ?",
            description:
                "Nous pourrons rechercher des expériences dans cette zone.",
            placeholder:
                "Exemple : Paris, Lyon, Mulhouse..."
        });
    }

    questions.push({
        id: "preferences",
        type: "textarea",
        title:
            "As-tu des préférences particulières ?",
        description:
            "Plus tu donnes de détails, plus l'IA pourra personnaliser les idées.",
        placeholder:
            "Exemple : Il aime le streetwear, les couleurs sombres et les objets originaux..."
    });

    questions.push({
        id: "occasion",
        type: "options",
        title:
            "Pour quelle occasion ?",
        description:
            "Cela aide à adapter le style du cadeau.",
        options: [
            {
                value: "birthday",
                label: "Anniversaire"
            },
            {
                value: "christmas",
                label: "Noël"
            },
            {
                value: "valentine",
                label: "Saint-Valentin"
            },
            {
                value: "wedding",
                label: "Mariage"
            },
            {
                value: "thankyou",
                label: "Remerciement"
            },
            {
                value: "other",
                label: "Autre"
            }
        ]
    });

    return questions;
}

/* =========================================================
   AFFICHER QUESTION
========================================================= */

function renderQuestion() {
    const container =
        document.getElementById(
            "questionContainer"
        );

    const progressBar =
        document.getElementById(
            "progressBar"
        );

    const progressText =
        document.getElementById(
            "progressText"
        );

    const previousButton =
        document.getElementById(
            "previousQuestion"
        );

    const nextButton =
        document.getElementById(
            "nextQuestion"
        );

    if (!container || !nextButton) {
        return;
    }

    const questions =
        getQuestions();

    const question =
        questions[currentQuestion];

    if (!question) {
        return;
    }

    const total =
        questions.length;

    const progress =
        ((currentQuestion + 1) /
            total) *
        100;

    if (progressBar) {
        progressBar.style.width =
            `${progress}%`;
    }

    if (progressText) {
        progressText.textContent =
            `Question ${
                currentQuestion + 1
            } sur ${total}`;
    }

    if (previousButton) {
        previousButton.style.display =
            currentQuestion === 0
                ? "none"
                : "";
    }

    let html = `
        <h2>
            ${escapeHTML(
                question.title
            )}
        </h2>

        <p class="question-description">
            ${escapeHTML(
                question.description || ""
            )}
        </p>
    `;

    if (
        question.type === "options" ||
        question.type === "multiOptions"
    ) {
        const currentValue =
            state.answers[
                question.id
            ];

        html += `
            <div class="question-options">
                ${
                    question.options
                        .map(option => {
                            const selected =
                                question.type ===
                                "multiOptions"
                                    ? Array.isArray(
                                          currentValue
                                      ) &&
                                      currentValue.includes(
                                          option.value
                                      )
                                    : currentValue ===
                                      option.value;

                            return `
                                <button
                                    type="button"
                                    class="question-option ${
                                        selected
                                            ? "selected"
                                            : ""
                                    }"
                                    data-question-option="${escapeHTML(
                                        option.value
                                    )}"
                                >
                                    <span class="question-option-title">
                                        ${escapeHTML(
                                            option.label
                                        )}
                                    </span>

                                    ${
                                        option.description
                                            ? `
                                                <span class="question-option-description">
                                                    ${escapeHTML(
                                                        option.description
                                                    )}
                                                </span>
                                            `
                                            : ""
                                    }
                                </button>
                            `;
                        })
                        .join("")
                }
            </div>
        `;
    }

    if (
        question.type === "input"
    ) {
        html += `
            <input
                type="text"
                class="question-input"
                id="currentQuestionInput"
                placeholder="${escapeHTML(
                    question.placeholder || ""
                )}"
                value="${escapeHTML(
                    state.answers[
                        question.id
                    ] || ""
                )}"
            />
        `;
    }

    if (
        question.type === "textarea"
    ) {
        html += `
            <textarea
                class="question-textarea"
                id="currentQuestionTextarea"
                placeholder="${escapeHTML(
                    question.placeholder || ""
                )}"
            >${escapeHTML(
                state.answers[
                    question.id
                ] || ""
            )}</textarea>
        `;
    }

    container.innerHTML =
        html;

    const optionButtons =
        container.querySelectorAll(
            "[data-question-option]"
        );

    optionButtons.forEach(
        button => {
            button.addEventListener(
                "click",
                () => {
                    const value =
                        button.dataset
                            .questionOption;

                    if (
                        question.type ===
                        "multiOptions"
                    ) {
                        if (
                            !Array.isArray(
                                state.answers[
                                    question.id
                                ]
                            )
                        ) {
                            state.answers[
                                question.id
                            ] = [];
                        }

                        const values =
                            state.answers[
                                question.id
                            ];

                        if (
                            values.includes(
                                value
                            )
                        ) {
                            state.answers[
                                question.id
                            ] =
                                values.filter(
                                    item =>
                                        item !==
                                        value
                                );
                        } else {
                            state.answers[
                                question.id
                            ] = [
                                ...values,
                                value
                            ];
                        }

                        renderQuestion();
                        return;
                    }

                    state.answers[
                        question.id
                    ] = value;

                    renderQuestion();
                }
            );
        }
    );

    const input =
        container.querySelector(
            "#currentQuestionInput"
        );

    if (input) {
        input.addEventListener(
            "input",
            event => {
                state.answers[
                    question.id
                ] =
                    event.target.value;
            }
        );
    }

    const textarea =
        container.querySelector(
            "#currentQuestionTextarea"
        );

    if (textarea) {
        textarea.addEventListener(
            "input",
            event => {
                state.answers[
                    question.id
                ] =
                    event.target.value;
            }
        );
    }

    if (
        currentQuestion ===
        total - 1
    ) {
        nextButton.textContent =
            "Voir les cadeaux 🎁";
    } else if (
        question.type ===
        "multiOptions"
    ) {
        nextButton.textContent =
            "Valider ✓";
    } else {
        nextButton.textContent =
            "Valider →";
    }
}

/* =========================================================
   VALIDATION
========================================================= */

function showQuestionError(
    message
) {
    const container =
        document.getElementById(
            "questionContainer"
        );

    if (!container) {
        return;
    }

    const oldError =
        container.querySelector(
            ".question-error"
        );

    if (oldError) {
        oldError.remove();
    }

    const error =
        document.createElement(
            "div"
        );

    error.className =
        "question-error";

    error.textContent =
        message;

    container.appendChild(
        error
    );
}

function validateQuestion() {
    const questions =
        getQuestions();

    const question =
        questions[currentQuestion];

    if (!question) {
        return false;
    }

    const value =
        state.answers[
            question.id
        ];

    if (
        question.type ===
        "multiOptions"
    ) {
        if (
            !Array.isArray(value) ||
            value.length === 0
        ) {
            showQuestionError(
                "Sélectionne au moins une option pour continuer."
            );

            return false;
        }

        return true;
    }

    if (
        question.type === "input" ||
        question.type === "textarea"
    ) {
        if (
            !String(
                value || ""
            ).trim()
        ) {
            showQuestionError(
                "Remplis ce champ avant de continuer."
            );

            return false;
        }

        return true;
    }

    if (!value) {
        showQuestionError(
            "Sélectionne une réponse avant de continuer."
        );

        return false;
    }

    return true;
}

/* =========================================================
   NAVIGATION
========================================================= */

async function goNext() {
    if (!validateQuestion()) {
        return;
    }

    const questions =
        getQuestions();

    if (
        currentQuestion <
        questions.length - 1
    ) {
        currentQuestion++;

        renderQuestion();

        return;
    }

    closeQuestionnaire();

    await generateResults();
}

function goPrevious() {
    if (
        currentQuestion <= 0
    ) {
        return;
    }

    currentQuestion--;

    renderQuestion();
}

/* =========================================================
   RÉSULTATS IA
========================================================= */

async function generateResults() {
    injectGiftFinderStyles();

    let resultsSection =
        document.getElementById(
            "giftResults"
        );

    if (!resultsSection) {
        resultsSection =
            document.createElement(
                "section"
            );

        resultsSection.id =
            "giftResults";

        document.body.appendChild(
            resultsSection
        );
    }

    resultsSection.innerHTML = `
        <div class="ai-loading-screen">

            <div class="ai-loading-content">

                <span class="ai-loading-icon">
                    🎁
                </span>

                <h2>
                    GiftFinder cherche pour toi...
                </h2>

                <p>
                    Notre IA analyse tes réponses
                    et prépare tes idées de cadeaux.
                </p>

                <div class="ai-loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

            </div>

        </div>
    `;

    resultsSection.style.display =
        "block";

    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    try {
        const response =
            await fetch(
                "/api/recommendations",
                {
                    method: "POST",
                    headers:
                        apiHeaders(),
                    body:
                        JSON.stringify(
                            state.answers
                        )
                }
            );

        let data;

        try {
            data =
                await response.json();
        } catch {
            throw new Error(
                "Le serveur a retourné une réponse invalide."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Impossible de contacter l'IA."
            );
        }

        if (
            !Array.isArray(
                data.recommendations
            )
        ) {
            throw new Error(
                "L'IA n'a retourné aucune recommandation valide."
            );
        }

        if (
            data.recommendations.length ===
            0
        ) {
            throw new Error(
                "L'IA n'a trouvé aucune idée de cadeau."
            );
        }

        renderRecommendations(
            data.recommendations
        );

    } catch (error) {
        console.error(
            "Erreur recommandations :",
            error
        );

        resultsSection.innerHTML = `
            <div class="ai-error">

                <div style="font-size:50px">
                    ⚠️
                </div>

                <h2>
                    La recherche n'a pas fonctionné
                </h2>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Une erreur inconnue est survenue."
                    )}
                </p>

                <button
                    type="button"
                    class="questionnaire-primary"
                    id="retryAIButton"
                >
                    Réessayer
                </button>

            </div>
        `;

        const retry =
            document.getElementById(
                "retryAIButton"
            );

        if (retry) {
            retry.addEventListener(
                "click",
                generateResults
            );
        }
    }
}

/* =========================================================
   FAVORIS
========================================================= */

function getFavorites() {
    try {
        const favorites =
            localStorage.getItem(
                "giftfinder_favorites"
            );

        return favorites
            ? JSON.parse(favorites)
            : [];
    } catch {
        return [];
    }
}

function saveFavorites(
    favorites
) {
    try {
        localStorage.setItem(
            "giftfinder_favorites",
            JSON.stringify(
                favorites
            )
        );
    } catch (error) {
        console.error(
            "Impossible de sauvegarder les favoris.",
            error
        );
    }
}

function isFavorite(gift) {
    const favorites =
        getFavorites();

    return favorites.some(
        item =>
            String(
                item?.name || ""
            ) ===
            String(
                gift?.name || ""
            )
    );
}

function toggleFavorite(
    gift
) {
    if (!gift) {
        return false;
    }

    let favorites =
        getFavorites();

    const index =
        favorites.findIndex(
            item =>
                String(
                    item?.name || ""
                ) ===
                String(
                    gift?.name || ""
                )
        );

    if (index >= 0) {
        favorites.splice(
            index,
            1
        );
    } else {
        favorites.push(
            gift
        );
    }

    saveFavorites(
        favorites
    );

    updateFavoritesCount();

    return index < 0;
}

function updateFavoritesCount() {
    const element =
        document.getElementById(
            "favoritesCount"
        );

    if (!element) {
        return;
    }

    element.textContent =
        getFavorites().length;
}

/* =========================================================
   AFFICHAGE DES CADEAUX
========================================================= */

function renderRecommendations(
    recommendations
) {
    const resultsSection =
        document.getElementById(
            "giftResults"
        );

    if (!resultsSection) {
        return;
    }

    resultsSection.style.display =
        "block";

    resultsSection.innerHTML = `
        <div class="results-header">

            <span class="results-label">
                RECOMMANDATIONS IA
            </span>

            <h2>
                Voici ce que GiftFinder a trouvé 🎁
            </h2>

            <p>
                ${
                    recommendations.length
                }
                idées personnalisées selon tes réponses.
            </p>

        </div>

        <div class="gift-results-grid">

            ${
                recommendations
                    .map(
                        (gift, index) => {

                            const image =
                                gift.image ||
                                gift.imageUrl ||
                                gift.thumbnail ||
                                "";

                            const productUrl =
                                gift.amazonUrl ||
                                gift.url ||
                                gift.link ||
                                "";

                            const favorite =
                                isFavorite(
                                    gift
                                );

                            return `
                                <article
                                    class="gift-card"
                                >

                                    <div
                                        class="gift-card-image"
                                    >

                                        ${
                                            image
                                                ? `
                                                    <img
                                                        src="${escapeHTML(
                                                            image
                                                        )}"
                                                        alt="${escapeHTML(
                                                            gift.name ||
                                                            "Cadeau"
                                                        )}"
                                                        loading="lazy"
                                                    >
                                                `
                                                : `
                                                    <div class="gift-image-placeholder">
                                                        🎁
                                                    </div>
                                                `
                                        }

                                    </div>

                                    <div
                                        class="gift-card-content"
                                    >

                                        <h3>
                                            ${escapeHTML(
                                                gift.name ||
                                                "Idée cadeau"
                                            )}
                                        </h3>

                                        ${
                                            gift.description
                                                ? `
                                                    <p class="gift-description">
                                                        ${escapeHTML(
                                                            gift.description
                                                        )}
                                                    </p>
                                                `
                                                : ""
                                        }

                                        ${
                                            gift.reason
                                                ? `
                                                    <div class="gift-reason">
                                                        <strong>
                                                            Pourquoi cette idée ?
                                                        </strong>
                                                        ${escapeHTML(
                                                            gift.reason
                                                        )}
                                                    </div>
                                                `
                                                : ""
                                        }

                                        <div class="gift-price">
                                            ${escapeHTML(
                                                gift.price ||
                                                gift.estimatedPrice ||
                                                "Prix à vérifier"
                                            )}
                                        </div>

                                        ${
                                            productUrl
                                                ? `
                                                    <a
                                                        href="${escapeHTML(
                                                            productUrl
                                                        )}"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="gift-amazon-link"
                                                    >
                                                        🔗 Voir le produit
                                                    </a>
                                                `
                                                : `
                                                    <span
                                                        class="gift-amazon-link"
                                                        style="opacity:.55"
                                                    >
                                                        🔗 Lien bientôt disponible
                                                    </span>
                                                `
                                        }

                                        <button
                                            type="button"
                                            class="gift-favorite-button"
                                            data-favorite-index="${index}"
                                        >
                                            ${
                                                favorite
                                                    ? "❤️ Favori"
                                                    : "♡ Ajouter aux favoris"
                                            }
                                        </button>

                                    </div>

                                </article>
                            `;
                        }
                    )
                    .join("")
            }

        </div>
    `;

    const buttons =
        resultsSection.querySelectorAll(
            "[data-favorite-index]"
        );

    buttons.forEach(button => {
        button.addEventListener(
            "click",
            () => {
                const index =
                    Number(
                        button.dataset
                            .favoriteIndex
                    );

                const gift =
                    recommendations[
                        index
                    ];

                const nowFavorite =
                    toggleFavorite(
                        gift
                    );

                button.textContent =
                    nowFavorite
                        ? "❤️ Favori"
                        : "♡ Ajouter aux favoris";
            }
        );
    });

    updateFavoritesCount();
}

/* =========================================================
   BOUTONS DE RECHERCHE
========================================================= */

function handleQuestionnaireButton(
    element
) {
    if (!element) {
        return false;
    }

    /*
     * On ne traite PAS les boutons Stripe ici.
     */
    if (
        element.hasAttribute(
            "data-stripe-product"
        )
    ) {
        return false;
    }

    const hasOpenAttribute =
        element.hasAttribute(
            "data-open-questionnaire"
        );

    const category =
        element.dataset.category ||
        element.dataset.categoryId ||
        element.dataset.giftCategory ||
        "";

    const search =
        element.dataset.search ||
        "";

    if (
        hasOpenAttribute ||
        category
    ) {
        startSearch(
            category,
            search
        );

        return true;
    }

    return false;
}

/* =========================================================
   INITIALISATION
========================================================= */

function initializeGiftFinder() {
    injectGiftFinderStyles();
    injectStripeStyles();

    updateFavoritesCount();

    /*
     * Récupère le compte au chargement.
     */
    refreshAccount();

    /*
     * Gestion globale des clics.
     */
    document.addEventListener(
        "click",
        event => {
            const element =
                event.target.closest(
                    "button, a, [role='button']"
                );

            if (!element) {
                return;
            }

            /*
             * STRIPE
             */
            const stripeProduct =
                element.dataset
                    .stripeProduct;

            if (
                stripeProduct
            ) {
                event.preventDefault();

                createCheckoutSession(
                    stripeProduct
                );

                return;
            }

            /*
             * QUESTIONNAIRE
             */
            if (
                handleQuestionnaireButton(
                    element
                )
            ) {
                event.preventDefault();
                return;
            }
        }
    );

    /*
     * Fermeture questionnaire.
     */
    document.addEventListener(
        "click",
        event => {
            const closeButton =
                event.target.closest(
                    "[data-close-questionnaire]"
                );

            if (closeButton) {
                event.preventDefault();

                closeQuestionnaire();
            }
        }
    );

    /*
     * Overlay questionnaire.
     */
    const questionnaireModal =
        document.getElementById(
            "questionnaireModal"
        );

    if (questionnaireModal) {
        const overlay =
            questionnaireModal.querySelector(
                ".questionnaire-overlay"
            );

        if (overlay) {
            overlay.addEventListener(
                "click",
                closeQuestionnaire
            );
        }
    }

    /*
     * Bouton précédent.
     */
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

    /*
     * Bouton suivant.
     */
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

    /*
     * Échap.
     */
    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key ===
                "Escape"
            ) {
                closeQuestionnaire();
                closeStoreModal();
            }
        }
    );

    /*
     * Retour depuis Stripe.
     */
    const params =
        new URLSearchParams(
            window.location.search
        );

    if (
        params.get("payment") ===
        "success"
    ) {
        setTimeout(
            refreshAccount,
            1500
        );

        console.log(
            "Paiement Stripe terminé."
        );
    }

    console.log(
        "🎁 GiftFinder : application chargée."
    );
}

/* =========================================================
   LANCEMENT
========================================================= */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeGiftFinder
    );
} else {
    initializeGiftFinder();
}

/* =========================================================
   FONCTIONS ACCESSIBLES DEPUIS LE HTML
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
 * IMPORTANT :
 * Ces deux anciennes fonctions
 * passent maintenant par le système
 * de vérification des recherches.
 */
window.openGiftFinder =
    startSearch;

window.startGiftSearch =
    startSearch;

window.openGiftFinderQuestionnaire =
    startSearch;

/*
 * Boutique accessible si besoin
 * depuis le HTML.
 */
window.openGiftFinderStore =
    openStoreModal;

window.closeGiftFinderStore =
    closeStoreModal;
