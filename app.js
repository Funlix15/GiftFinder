"use strict";

/* =========================================================
   GIFTFINDER — APP.JS
   Questionnaire + IA + résultats + favoris
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
    }
};

let currentQuestion = 0;

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

function safeExternalUrl(value) {
    const raw = String(value ?? "").trim();

    if (!raw) return "";

    try {
        const url = new URL(raw, window.location.origin);

        if (
            url.protocol === "http:" ||
            url.protocol === "https:"
        ) {
            return url.href;
        }
    } catch (error) {
        return "";
    }

    return "";
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
   STYLES
========================================================= */

function injectGiftFinderStyles() {
    if (document.getElementById("giftfinder-app-styles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "giftfinder-app-styles";

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
            width: min(720px, calc(100% - 30px));
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
            grid-template-columns: repeat(2, minmax(0, 1fr));
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

        /* RÉSULTATS */

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
            transition: .2s ease;
        }

        .gift-card:hover {
            transform: translateY(-2px);
            border-color: #d1d5db;
            box-shadow: 0 8px 24px rgba(0,0,0,.08);
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
            display: block;
        }

        .gift-image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f3f4f6;
            color: #9ca3af;
            font-size: 3rem;
        }

        .gift-card-content {
            flex: 1;
            min-width: 0;
            padding: 5px 0;
        }

        .gift-card h3 {
            margin: 0 0 12px;
            color: #111827;
            font-size: 1.15rem;
            line-height: 1.4;
            font-weight: 800;
        }

        .gift-description,
        .gift-reason {
            margin: 0 0 12px;
            color: #6b7280;
            line-height: 1.5;
        }

        .gift-reason {
            font-size: .9rem;
        }

        .gift-reason strong {
            color: #374151;
        }

        .gift-price {
            margin: 0 0 15px;
            color: #111827;
            font-size: 1.25rem;
            font-weight: 900;
        }

        .gift-actions {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
        }

        .gift-product-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 15px;
            border-radius: 8px;
            background: #2563eb;
            color: #fff;
            text-decoration: none;
            font-size: .9rem;
            font-weight: 800;
        }

        .gift-product-link:hover {
            background: #1d4ed8;
        }

        .gift-product-link.disabled {
            opacity: .55;
            cursor: not-allowed;
        }

        .gift-favorite-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #fff;
            color: #374151;
            cursor: pointer;
            font-size: .9rem;
            font-weight: 700;
        }

        .ai-loading-screen {
            min-height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 60px 20px;
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

        .ai-loading-content h2 {
            margin: 0 0 12px;
            font-size: 28px;
        }

        .ai-loading-content p {
            margin: 0;
            color: #666;
            line-height: 1.6;
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

        @keyframes giftPulse {
            0%,100% { transform: scale(1); }
            50% { transform: scale(1.08); }
        }

        .ai-error {
            max-width: 600px;
            margin: 60px auto;
            padding: 40px 20px;
            text-align: center;
        }

        .ai-error-icon {
            font-size: 50px;
            margin-bottom: 15px;
        }

        .ai-error p {
            margin-bottom: 25px;
            color: #666;
            line-height: 1.5;
        }

        @media (max-width: 700px) {
            .questionnaire-box {
                width: calc(100% - 20px);
                max-height: calc(100vh - 20px);
                margin: 10px auto;
                padding: 22px;
                border-radius: 20px;
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
                min-height: 120px;
                gap: 14px;
                padding: 12px;
            }

            .gift-card-image {
                flex: 0 0 105px;
                width: 105px;
                height: 105px;
            }

            .gift-card h3 {
                margin-bottom: 7px;
                font-size: 1rem;
            }

            .gift-description,
            .gift-reason {
                display: none;
            }

            .gift-price {
                margin-bottom: 9px;
                font-size: 1.1rem;
            }

            .gift-product-link,
            .gift-favorite-button {
                padding: 8px 10px;
                font-size: .8rem;
            }

            .results-header h2 {
                font-size: 28px;
            }
        }
    `;

    document.head.appendChild(style);
}

/* =========================================================
   OUVRIR / FERMER
========================================================= */

function openQuestionnaire(category = "", search = "") {
    injectGiftFinderStyles();

    const modal = document.getElementById("questionnaireModal");

    if (!modal) {
        console.error("❌ Questionnaire introuvable.");
        return;
    }

    state.category = category || "";

    state.answers = {
        recipient: "",
        budget: "",
        category: category || "",
        platform: "",
        game: [],
        city: "",
        occasion: "",
        preferences: "",
        search: search || ""
    };

    currentQuestion = 0;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    renderQuestion();
}

function closeQuestionnaire() {
    const modal = document.getElementById("questionnaireModal");

    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

/* =========================================================
   QUESTIONS
========================================================= */

function getQuestions() {
    const questions = [];

    questions.push({
        id: "recipient",
        type: "options",
        title: "Pour qui cherches-tu un cadeau ?",
        description: "Choisis la personne qui va recevoir le cadeau.",
        options: [
            { value: "friend", label: "Un ami", description: "Ami(e), meilleur ami(e)..." },
            { value: "family", label: "Famille", description: "Parent, frère, sœur..." },
            { value: "partner", label: "Mon/ma partenaire", description: "Petit(e) ami(e), conjoint(e)..." },
            { value: "child", label: "Un enfant", description: "Enfant, neveu, nièce..." },
            { value: "colleague", label: "Un collègue", description: "Cadeau professionnel ou entre collègues." },
            { value: "self", label: "Pour moi", description: "Une idée pour te faire plaisir." },
            { value: "other", label: "Autre", description: "Une autre personne." }
        ]
    });

    questions.push({
        id: "budget",
        type: "options",
        title: "Quel est ton budget ?",
        description: "Choisis la tranche de prix qui te convient.",
        options: [
            { value: "under20", label: "Moins de 20 €", description: "Petit budget" },
            { value: "20to50", label: "20 à 50 €", description: "Budget moyen" },
            { value: "50to100", label: "50 à 100 €", description: "Budget confortable" },
            { value: "100to250", label: "100 à 250 €", description: "Cadeau important" },
            { value: "250plus", label: "250 € et plus", description: "Budget élevé" }
        ]
    });

    let categoryOptions = [];

    if (Array.isArray(window.giftCategories)) {
        categoryOptions = window.giftCategories.map(category => ({
            value: category.id || category.value,
            label: category.name || category.label || category.id,
            description: category.description || ""
        }));
    }

    if (categoryOptions.length === 0) {
        categoryOptions = [
            ["gaming", "Gaming", "Jeux vidéo et accessoires"],
            ["stickers", "Stickers", "Stickers et décoration"],
            ["tech", "Tech", "Électronique et gadgets"],
            ["fashion", "Mode", "Vêtements et accessoires"],
            ["sneakers", "Sneakers", "Chaussures et baskets"],
            ["streetwear", "Streetwear", "Mode streetwear"],
            ["jewelry", "Bijoux", "Bijoux et accessoires"],
            ["sport", "Sport", "Sport et activité physique"],
            ["food", "Food", "Alimentation et gourmandises"],
            ["drinks", "Boissons", "Boissons et coffrets"],
            ["creative", "Créatif", "Loisirs créatifs"],
            ["books", "Livres", "Livres et lecture"],
            ["home", "Maison", "Objets pour la maison"],
            ["beauty", "Beauté", "Beauté et soins"],
            ["music", "Musique", "Musique et accessoires"],
            ["personalized", "Personnalisé", "Cadeaux personnalisés"],
            ["travel", "Voyage", "Voyage et accessoires"],
            ["experience", "Expérience", "Activité ou sortie"]
        ].map(([value, label, description]) => ({
            value,
            label,
            description
        }));
    }

    questions.push({
        id: "category",
        type: "options",
        title: "Quel type de cadeau recherches-tu ?",
        description: "Choisis la catégorie qui t'intéresse.",
        options: categoryOptions
    });

    const selectedCategory =
        state.answers.category ||
        state.category ||
        "";

    if (selectedCategory === "gaming") {
        questions.push({
            id: "platform",
            type: "options",
            title: "Sur quelle plateforme joue-t-il/elle ?",
            description: "Cela permettra d'affiner les recommandations.",
            options: [
                { value: "pc", label: "PC", description: "Ordinateur" },
                { value: "playstation", label: "PlayStation", description: "PS4 ou PS5" },
                { value: "xbox", label: "Xbox", description: "Xbox One ou Series" },
                { value: "nintendo", label: "Nintendo", description: "Switch et autres consoles Nintendo" },
                { value: "mobile", label: "Mobile", description: "Smartphone ou tablette" },
                { value: "any", label: "Peu importe", description: "Toutes les plateformes" }
            ]
        });

        questions.push({
            id: "game",
            type: "multiOptions",
            title: "À quels jeux joue-t-il/elle ?",
            description: "Tu peux sélectionner plusieurs jeux.",
            options: [
                { value: "minecraft", label: "Minecraft" },
                { value: "fortnite", label: "Fortnite" },
                { value: "roblox", label: "Roblox" },
                { value: "gta", label: "GTA" },
                { value: "callofduty", label: "Call of Duty" },
                { value: "fc", label: "EA Sports FC" },
                { value: "pokemon", label: "Pokémon" },
                { value: "other", label: "Autre" }
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
            title: "Dans quelle ville ?",
            description: "Cela permettra d'affiner les expériences disponibles.",
            placeholder: "Exemple : Paris, Lyon, Mulhouse..."
        });
    }

    questions.push({
        id: "preferences",
        type: "textarea",
        title: "As-tu des préférences particulières ?",
        description: "Plus tu donnes de détails, plus l'IA pourra personnaliser les idées.",
        placeholder: "Exemple : Il aime le streetwear, les couleurs sombres et les objets originaux..."
    });

    questions.push({
        id: "occasion",
        type: "options",
        title: "Pour quelle occasion ?",
        description: "Cela aide à adapter le style du cadeau.",
        options: [
            { value: "birthday", label: "Anniversaire" },
            { value: "christmas", label: "Noël" },
            { value: "valentine", label: "Saint-Valentin" },
            { value: "wedding", label: "Mariage" },
            { value: "thankyou", label: "Remerciement" },
            { value: "other", label: "Autre" }
        ]
    });

    return questions;
}

/* =========================================================
   AFFICHER QUESTION
========================================================= */

function renderQuestion() {
    const container = document.getElementById("questionContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const previousButton = document.getElementById("previousQuestion");
    const nextButton = document.getElementById("nextQuestion");

    if (!container || !nextButton) return;

    const questions = getQuestions();
    const question = questions[currentQuestion];

    if (!question) return;

    const total = questions.length;
    const progress = ((currentQuestion + 1) / total) * 100;

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
        progressText.textContent =
            `Question ${currentQuestion + 1} sur ${total}`;
    }

    if (previousButton) {
        previousButton.style.display =
            currentQuestion === 0 ? "none" : "";
    }

    let html = `
        <h2>${escapeHTML(question.title)}</h2>
        <p class="question-description">
            ${escapeHTML(question.description || "")}
        </p>
    `;

    if (
        question.type === "options" ||
        question.type === "multiOptions"
    ) {
        const currentValue = state.answers[question.id];

        html += `
            <div class="question-options">
                ${question.options.map(option => {
                    const selected =
                        question.type === "multiOptions"
                            ? Array.isArray(currentValue) &&
                              currentValue.includes(option.value)
                            : currentValue === option.value;

                    return `
                        <button
                            type="button"
                            class="question-option ${selected ? "selected" : ""}"
                            data-question-option="${escapeHTML(option.value)}"
                        >
                            <span class="question-option-title">
                                ${escapeHTML(option.label)}
                            </span>

                            ${
                                option.description
                                    ? `
                                        <span class="question-option-description">
                                            ${escapeHTML(option.description)}
                                        </span>
                                    `
                                    : ""
                            }
                        </button>
                    `;
                }).join("")}
            </div>
        `;
    }

    if (question.type === "input") {
        html += `
            <input
                type="text"
                class="question-input"
                id="currentQuestionInput"
                placeholder="${escapeHTML(question.placeholder || "")}"
                value="${escapeHTML(state.answers[question.id] || "")}"
            />
        `;
    }

    if (question.type === "textarea") {
        html += `
            <textarea
                class="question-textarea"
                id="currentQuestionTextarea"
                placeholder="${escapeHTML(question.placeholder || "")}"
            >${escapeHTML(state.answers[question.id] || "")}</textarea>
        `;
    }

    container.innerHTML = html;

    container
        .querySelectorAll("[data-question-option]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const value = button.dataset.questionOption;

                if (question.type === "multiOptions") {
                    if (!Array.isArray(state.answers[question.id])) {
                        state.answers[question.id] = [];
                    }

                    const values = state.answers[question.id];

                    if (values.includes(value)) {
                        state.answers[question.id] =
                            values.filter(item => item !== value);
                    } else {
                        state.answers[question.id] = [
                            ...values,
                            value
                        ];
                    }

                    renderQuestion();
                    return;
                }

                state.answers[question.id] = value;

                renderQuestion();
            });
        });

    const input = container.querySelector("#currentQuestionInput");

    if (input) {
        input.addEventListener("input", event => {
            state.answers[question.id] = event.target.value;
        });
    }

    const textarea = container.querySelector("#currentQuestionTextarea");

    if (textarea) {
        textarea.addEventListener("input", event => {
            state.answers[question.id] = event.target.value;
        });
    }

    nextButton.textContent =
        currentQuestion === total - 1
            ? "Voir les cadeaux 🎁"
            : question.type === "multiOptions"
                ? "Valider ✓"
                : "Valider →";
}

/* =========================================================
   VALIDATION
========================================================= */

function validateQuestion() {
    const questions = getQuestions();
    const question = questions[currentQuestion];

    if (!question) return false;

    const value = state.answers[question.id];

    if (question.type === "multiOptions") {
        if (!Array.isArray(value) || value.length === 0) {
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
        if (!String(value || "").trim()) {
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

function showQuestionError(message) {
    const container = document.getElementById("questionContainer");

    if (!container) return;

    const oldError =
        container.querySelector(".question-error");

    if (oldError) {
        oldError.remove();
    }

    const error = document.createElement("div");

    error.className = "question-error";
    error.textContent = message;

    container.appendChild(error);
}

/* =========================================================
   NAVIGATION
========================================================= */

async function goNext() {
    if (!validateQuestion()) return;

    const questions = getQuestions();

    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        renderQuestion();
        return;
    }

    closeQuestionnaire();
    await generateResults();
}

function goPrevious() {
    if (currentQuestion <= 0) return;

    currentQuestion--;
    renderQuestion();
}

/* =========================================================
   RÉSULTATS
========================================================= */

async function generateResults() {
    injectGiftFinderStyles();

    let resultsSection =
        document.getElementById("giftResults");

    if (!resultsSection) {
        resultsSection = document.createElement("section");
        resultsSection.id = "giftResults";
        document.body.appendChild(resultsSection);
    }

    resultsSection.innerHTML = `
        <div class="ai-loading-screen">
            <div class="ai-loading-content">
                <span class="ai-loading-icon">🎁</span>

                <h2>
                    GiftFinder cherche pour toi...
                </h2>

                <p>
                    Notre IA analyse tes réponses
                    et prépare des idées de cadeaux
                    adaptées à ta recherche.
                </p>

                <div class="ai-loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;

    resultsSection.style.display = "block";

    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    try {
        console.log(
            "🎁 Envoi des réponses à l'IA...",
            state.answers
        );

        const response = await fetch(
            "/api/recommendations",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(state.answers)
            }
        );

        let data;

        try {
            data = await response.json();
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
            !data.recommendations ||
            !Array.isArray(data.recommendations)
        ) {
            throw new Error(
                "L'IA n'a retourné aucune recommandation valide."
            );
        }

        if (data.recommendations.length === 0) {
            throw new Error(
                "L'IA n'a trouvé aucune idée de cadeau."
            );
        }

        console.log(
            `✅ ${data.recommendations.length} recommandations reçues`
        );

        renderRecommendations(
            data.recommendations
        );

    } catch (error) {
        console.error(
            "❌ Erreur recommandations :",
            error
        );

        resultsSection.innerHTML = `
            <div class="ai-error">
                <div class="ai-error-icon">⚠️</div>

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

        const retryButton =
            document.getElementById("retryAIButton");

        if (retryButton) {
            retryButton.addEventListener(
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

function saveFavorites(favorites) {
    try {
        localStorage.setItem(
            "giftfinder_favorites",
            JSON.stringify(favorites)
        );
    } catch (error) {
        console.error(
            "Impossible de sauvegarder les favoris.",
            error
        );
    }
}

function isFavorite(gift) {
    const favorites = getFavorites();

    return favorites.some(
        item =>
            String(item?.name || "") ===
            String(gift?.name || "")
    );
}

function toggleFavorite(gift) {
    if (!gift) return false;

    let favorites = getFavorites();

    const existingIndex =
        favorites.findIndex(
            item =>
                String(item?.name || "") ===
                String(gift?.name || "")
        );

    if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push(gift);
    }

    saveFavorites(favorites);
    updateFavoritesCount();

    return existingIndex < 0;
}

function updateFavoritesCount() {
    const countElement =
        document.getElementById(
            "favoritesCount"
        );

    if (!countElement) return;

    countElement.textContent =
        getFavorites().length;
}

/* =========================================================
   AFFICHAGE DES PRODUITS
========================================================= */

function renderRecommendations(recommendations) {
    const resultsSection =
        document.getElementById(
            "giftResults"
        );

    if (!resultsSection) return;

    resultsSection.style.display = "block";

    resultsSection.innerHTML = `
        <div class="results-header">
            <span class="results-label">
                RECOMMANDATIONS IA
            </span>

            <h2>
                Voici ce que GiftFinder a trouvé 🎁
            </h2>

            <p>
                ${recommendations.length}
                idées personnalisées selon tes réponses.
            </p>
        </div>

        <div class="gift-results-grid">
            ${recommendations.map((gift, index) => {

                const imageUrl =
                    gift.image ||
                    gift.imageUrl ||
                    gift.thumbnail ||
                    "";

                const productUrl =
                    gift.amazonUrl ||
                    gift.url ||
                    gift.link ||
                    "";

                const safeImage =
                    safeExternalUrl(imageUrl);

                const safeProductUrl =
                    safeExternalUrl(productUrl);

                const favorite =
                    isFavorite(gift);

                let linkLabel = "Lien bientôt disponible";

                if (safeProductUrl) {
                    if (
                        String(gift.amazonUrl || "").trim()
                    ) {
                        linkLabel = "🔗 Voir sur Amazon";
                    } else {
                        linkLabel = "🔗 Voir le produit";
                    }
                }

                return `
                    <article
                        class="gift-card"
                        data-gift-index="${index}"
                    >

                        <div class="gift-card-image">
                            ${
                                safeImage
                                    ? `
                                        <img
                                            src="${escapeHTML(safeImage)}"
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

                        <div class="gift-card-content">

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

                            <div class="gift-actions">

                                ${
                                    safeProductUrl
                                        ? `
                                            <a
                                                href="${escapeHTML(
                                                    safeProductUrl
                                                )}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="gift-product-link"
                                            >
                                                ${linkLabel}
                                            </a>
                                        `
                                        : `
                                            <span
                                                class="gift-product-link disabled"
                                            >
                                                ${linkLabel}
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

                        </div>

                    </article>
                `;
            }).join("")}
        </div>
    `;

    resultsSection
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

                    const gift =
                        recommendations[index];

                    const nowFavorite =
                        toggleFavorite(gift);

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
   BOUTONS
========================================================= */

function handleQuestionnaireButton(element) {
    if (!element) return false;

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

    if (hasOpenAttribute || category) {
        openQuestionnaire(
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

    updateFavoritesCount();

    document.addEventListener(
        "click",
        event => {
            const element =
                event.target.closest(
                    "button, a, [role='button']"
                );

            if (!element) return;

            if (
                handleQuestionnaireButton(
                    element
                )
            ) {
                event.preventDefault();
            }
        }
    );

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

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeQuestionnaire();
            }
        }
    );

    console.log(
        "🎁 GiftFinder : application chargée."
    );
}

/* =========================================================
   DÉMARRAGE
========================================================= */

if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeGiftFinder
    );
} else {
    initializeGiftFinder();
}

/* =========================================================
   COMPATIBILITÉ HTML
========================================================= */

window.openQuestionnaire =
    openQuestionnaire;

window.closeQuestionnaire =
    closeQuestionnaire;

window.generateResults =
    generateResults;

window.renderRecommendations =
    renderRecommendations;

window.openGiftFinder =
    openQuestionnaire;

window.startGiftSearch =
    openQuestionnaire;

window.openGiftFinderQuestionnaire =
    openQuestionnaire;
