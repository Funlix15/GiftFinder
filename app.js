"use strict";

/* =========================================================
   GIFTFINDER — APP.JS
   Questionnaire adaptatif + IA + résultats + favoris
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
let questionHistory = [];
let currentQuestions = [];

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

        .questionnaire-primary:disabled,
        .questionnaire-secondary:disabled {
            opacity: .55;
            cursor: not-allowed;
        }

        .question-error {
            margin-top: 12px;
            padding: 12px 15px;
            border-radius: 12px;
            background: #fff1f1;
            color: #b00020;
            font-size: 14px;
        }

        .question-ai-analysis {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
            padding: 14px 16px;
            border-radius: 14px;
            background: #f5f5f5;
            color: #555;
            font-size: 14px;
        }

        .question-ai-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #ccc;
            border-top-color: #111;
            border-radius: 50%;
            animation: giftFinderSpin .8s linear infinite;
        }

        @keyframes giftFinderSpin {
            to {
                transform: rotate(360deg);
            }
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
            0%,100% {
                transform: scale(1);
            }

            50% {
                transform: scale(1.08);
            }
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
   QUESTIONS DE DÉPART
   ========================================================= */

function getInitialQuestion() {
    return {
        id: "recipient",
        type: "options",
        title: "Pour qui cherches-tu un cadeau ?",
        description: "Choisis la personne qui va recevoir le cadeau.",
        options: [
            {
                value: "friend",
                label: "Un ami",
                description: "Ami(e), meilleur ami(e)..."
            },
            {
                value: "family",
                label: "Famille",
                description: "Parent, frère, sœur..."
            },
            {
                value: "partner",
                label: "Mon/ma partenaire",
                description: "Petit(e) ami(e), conjoint(e)..."
            },
            {
                value: "child",
                label: "Un enfant",
                description: "Enfant, neveu, nièce..."
            },
            {
                value: "colleague",
                label: "Un collègue",
                description: "Cadeau professionnel ou entre collègues."
            },
            {
                value: "self",
                label: "Pour moi",
                description: "Une idée pour te faire plaisir."
            },
            {
                value: "other",
                label: "Autre",
                description: "Une autre personne."
            }
        ]
    };
}

/* =========================================================
   OUVRIR / FERMER
   ========================================================= */

function openQuestionnaire(category = "", search = "") {
    injectGiftFinderStyles();

    const modal =
        document.getElementById("questionnaireModal");

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

    questionHistory = [];

    currentQuestions = [
        getInitialQuestion()
    ];

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    renderQuestion();
}

function closeQuestionnaire() {
    const modal =
        document.getElementById("questionnaireModal");

    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

/* =========================================================
   AFFICHER UNE QUESTION
   ========================================================= */

function renderQuestion() {
    const container =
        document.getElementById("questionContainer");

    const progressBar =
        document.getElementById("progressBar");

    const progressText =
        document.getElementById("progressText");

    const previousButton =
        document.getElementById("previousQuestion");

    const nextButton =
        document.getElementById("nextQuestion");

    if (!container || !nextButton) return;

    const question =
        currentQuestions[currentQuestion];

    if (!question) return;

    /*
     * On affiche une estimation du nombre de questions.
     * Le nombre réel peut changer car l'IA décide
     * dynamiquement de la suite.
     */
    const estimatedTotal =
        Math.max(
            currentQuestions.length,
            currentQuestion + 1
        );

    const progress =
        Math.min(
            ((currentQuestion + 1) /
                estimatedTotal) * 100,
            95
        );

    if (progressBar) {
        progressBar.style.width =
            `${progress}%`;
    }

    if (progressText) {
        progressText.textContent =
            `Question ${currentQuestion + 1}`;
    }

    if (previousButton) {
        previousButton.style.display =
            currentQuestion === 0
                ? "none"
                : "";
    }

    let html = `
        <h2>${escapeHTML(question.title || question.text || "Question")}</h2>

        ${
            question.description
                ? `
                    <p class="question-description">
                        ${escapeHTML(question.description)}
                    </p>
                `
                : ""
        }
    `;

    if (
        question.type === "choice" ||
        question.type === "options"
    ) {
        const currentValue =
            state.answers[question.id];

        const options =
            Array.isArray(question.options)
                ? question.options
                : [];

        html += `
            <div class="question-options">
                ${options.map(option => {

                    const value =
                        typeof option === "string"
                            ? option
                            : option.value;

                    const label =
                        typeof option === "string"
                            ? option
                            : option.label || option.value;

                    const description =
                        typeof option === "string"
                            ? ""
                            : option.description || "";

                    const selected =
                        currentValue === value;

                    return `
                        <button
                            type="button"
                            class="question-option ${selected ? "selected" : ""}"
                            data-question-option="${escapeHTML(value)}"
                        >
                            <span class="question-option-title">
                                ${escapeHTML(label)}
                            </span>

                            ${
                                description
                                    ? `
                                        <span class="question-option-description">
                                            ${escapeHTML(description)}
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

    if (question.type === "multiOptions") {
        const currentValue =
            Array.isArray(state.answers[question.id])
                ? state.answers[question.id]
                : [];

        const options =
            Array.isArray(question.options)
                ? question.options
                : [];

        html += `
            <div class="question-options">
                ${options.map(option => {

                    const value =
                        typeof option === "string"
                            ? option
                            : option.value;

                    const label =
                        typeof option === "string"
                            ? option
                            : option.label || option.value;

                    const description =
                        typeof option === "string"
                            ? ""
                            : option.description || "";

                    const selected =
                        currentValue.includes(value);

                    return `
                        <button
                            type="button"
                            class="question-option ${selected ? "selected" : ""}"
                            data-question-option="${escapeHTML(value)}"
                        >
                            <span class="question-option-title">
                                ${escapeHTML(label)}
                            </span>

                            ${
                                description
                                    ? `
                                        <span class="question-option-description">
                                            ${escapeHTML(description)}
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

    if (
        question.type === "input" ||
        question.type === "text"
    ) {
        html += `
            <input
                type="text"
                class="question-input"
                id="currentQuestionInput"
                placeholder="${escapeHTML(question.placeholder || "")}"
                value="${escapeHTML(
                    state.answers[question.id] || ""
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
                placeholder="${escapeHTML(question.placeholder || "")}"
            >${escapeHTML(
                state.answers[question.id] || ""
            )}</textarea>
        `;
    }

    container.innerHTML = html;

    container
        .querySelectorAll("[data-question-option]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const value =
                        button.dataset.questionOption;

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
                            values.includes(value)
                        ) {
                            state.answers[
                                question.id
                            ] = values.filter(
                                item =>
                                    item !== value
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
        });

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
                ] = event.target.value;
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
                ] = event.target.value;
            }
        );
    }

    nextButton.textContent =
        "Continuer →";
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateQuestion() {
    const question =
        currentQuestions[currentQuestion];

    if (!question) return false;

    const value =
        state.answers[question.id];

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
        question.type === "text" ||
        question.type === "textarea"
    ) {
        if (
            !String(value || "").trim()
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

function showQuestionError(message) {
    const container =
        document.getElementById(
            "questionContainer"
        );

    if (!container) return;

    const oldError =
        container.querySelector(
            ".question-error"
        );

    if (oldError) {
        oldError.remove();
    }

    const error =
        document.createElement("div");

    error.className =
        "question-error";

    error.textContent =
        message;

    container.appendChild(error);
}

/* =========================================================
   ANALYSE IA ENTRE LES QUESTIONS
   ========================================================= */

async function analyzeCurrentAnswer(question) {
    const container =
        document.getElementById(
            "questionContainer"
        );

    const nextButton =
        document.getElementById(
            "nextQuestion"
        );

    const previousButton =
        document.getElementById(
            "previousQuestion"
        );

    if (nextButton) {
        nextButton.disabled = true;
    }

    if (previousButton) {
        previousButton.disabled = true;
    }

    if (container) {
        const analysisMessage =
            document.createElement("div");

        analysisMessage.className =
            "question-ai-analysis";

        analysisMessage.innerHTML = `
            <span class="question-ai-spinner"></span>
            <span>
                GiftFinder analyse ta réponse
                et adapte la suite...
            </span>
        `;

        container.appendChild(
            analysisMessage
        );
    }

    try {
        const historyForAI =
            questionHistory.map(item => ({
                question: {
                    id: item.question?.id || "",
                    text:
                        item.question?.title ||
                        item.question?.text ||
                        ""
                },
                answer:
                    item.answer
            }));

        const response =
            await fetch(
                "/api/analyze-answer",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        answers:
                            state.answers,
                        lastAnswer:
                            state.answers[
                                question.id
                            ],
                        questionHistory:
                            historyForAI
                    })
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
            typeof data.shouldContinue !==
            "boolean"
        ) {
            throw new Error(
                "La réponse de l'IA est invalide."
            );
        }

        /*
         * L'IA estime qu'elle a suffisamment
         * d'informations.
         */
        if (
            data.shouldContinue === false
        ) {
            closeQuestionnaire();
            await generateResults();
            return;
        }

        const nextQuestion =
            normalizeAIQuestion(
                data.nextQuestion
            );

        if (!nextQuestion) {
            throw new Error(
                "L'IA n'a pas fourni de question valide."
            );
        }

        /*
         * On garde l'historique afin que
         * le bouton Retour fonctionne.
         */
        currentQuestions.push(
            nextQuestion
        );

        currentQuestion++;

        renderQuestion();

    } catch (error) {
        console.error(
            "❌ Erreur analyse IA :",
            error
        );

        showQuestionError(
            error.message ||
            "Impossible d'analyser cette réponse."
        );

    } finally {
        if (nextButton) {
            nextButton.disabled = false;
        }

        if (previousButton) {
            previousButton.disabled = false;
        }
    }
}

/* =========================================================
   NORMALISER UNE QUESTION IA
   ========================================================= */

function normalizeAIQuestion(question) {
    if (!question) {
        return null;
    }

    const id =
        String(
            question.id ||
            `question_${Date.now()}`
        )
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_");

    const text =
        String(
            question.text ||
            question.title ||
            ""
        ).trim();

    if (!text) {
        return null;
    }

    let type =
        question.type ||
        "choice";

    const allowedTypes = [
        "choice",
        "options",
        "multiOptions",
        "input",
        "text",
        "textarea"
    ];

    if (!allowedTypes.includes(type)) {
        type = "choice";
    }

    const options =
        Array.isArray(question.options)
            ? question.options
                .map(option => {
                    if (
                        typeof option ===
                        "string"
                    ) {
                        return {
                            value: option,
                            label: option,
                            description: ""
                        };
                    }

                    return {
                        value:
                            String(
                                option?.value ??
                                ""
                            ),
                        label:
                            String(
                                option?.label ??
                                option?.value ??
                                ""
                            ),
                        description:
                            String(
                                option?.description ??
                                ""
                            )
                    };
                })
                .filter(
                    option =>
                        option.value &&
                        option.label
                )
            : [];

    /*
     * Une question à choix doit avoir
     * des options.
     */
    if (
        (type === "choice" ||
            type === "options" ||
            type === "multiOptions") &&
        options.length === 0
    ) {
        return null;
    }

    return {
        id,
        type,
        title: text,
        description:
            String(
                question.description ||
                ""
            ),
        placeholder:
            String(
                question.placeholder ||
                ""
            ),
        options
    };
}

/* =========================================================
   NAVIGATION
   ========================================================= */

async function goNext() {
    if (!validateQuestion()) {
        return;
    }

    const question =
        currentQuestions[currentQuestion];

    if (!question) {
        return;
    }

    /*
     * On enregistre la réponse actuelle
     * avant de demander à l'IA de l'analyser.
     */
    const existingHistoryIndex =
        questionHistory.findIndex(
            item =>
                item.question?.id ===
                question.id
        );

    const historyItem = {
        question,
        answer:
            state.answers[
                question.id
            ]
    };

    if (
        existingHistoryIndex >= 0
    ) {
        questionHistory[
            existingHistoryIndex
        ] = historyItem;
    } else {
        questionHistory.push(
            historyItem
        );
    }

    /*
     * Si une question suivante existe déjà
     * dans l'historique, on peut simplement
     * l'afficher.
     */
    if (
        currentQuestion <
        currentQuestions.length - 1
    ) {
        currentQuestion++;

        renderQuestion();

        return;
    }

    /*
     * Sinon, l'IA analyse la réponse
     * et décide de la prochaine question.
     */
    await analyzeCurrentAnswer(
        question
    );
}

function goPrevious() {
    if (currentQuestion <= 0) {
        return;
    }

    currentQuestion--;

    renderQuestion();
}

/* =========================================================
   RÉSULTATS
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
                    GiftFinder prépare tes cadeaux...
                </h2>

                <p>
                    L'IA analyse l'ensemble de
                    tes réponses et prépare une
                    sélection personnalisée.
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
        console.log(
            "🎁 Envoi du profil final à l'IA...",
            state.answers
        );

        const response =
            await fetch(
                "/api/recommendations",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(
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
            !data.recommendations ||
            !Array.isArray(
                data.recommendations
            )
        ) {
            throw new Error(
                "L'IA n'a retourné aucune recommandation valide."
            );
        }

        if (
            data.recommendations.length === 0
        ) {
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

                <div class="ai-error-icon">
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

        const retryButton =
            document.getElementById(
                "retryAIButton"
            );

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

function toggleFavorite(gift) {
    if (!gift) {
        return false;
    }

    let favorites =
        getFavorites();

    const existingIndex =
        favorites.findIndex(
            item =>
                String(
                    item?.name || ""
                ) ===
                String(
                    gift?.name || ""
                )
        );

    if (existingIndex >= 0) {
        favorites.splice(
            existingIndex,
            1
        );
    } else {
        favorites.push(gift);
    }

    saveFavorites(
        favorites
    );

    updateFavoritesCount();

    return existingIndex < 0;
}

function updateFavoritesCount() {
    const countElement =
        document.getElementById(
            "favoritesCount"
        );

    if (!countElement) {
        return;
    }

    countElement.textContent =
        getFavorites().length;
}

/* =========================================================
   AFFICHAGE DES PRODUITS
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
                ${recommendations.length}
                idées personnalisées selon tes réponses.
            </p>

        </div>

        <div class="gift-results-grid">

            ${recommendations
                .map((gift, index) => {

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
                        safeExternalUrl(
                            imageUrl
                        );

                    const safeProductUrl =
                        safeExternalUrl(
                            productUrl
                        );

                    const favorite =
                        isFavorite(
                            gift
                        );

                    let linkLabel =
                        "Lien bientôt disponible";

                    if (
                        safeProductUrl
                    ) {
                        if (
                            String(
                                gift.amazonUrl ||
                                ""
                            ).trim()
                        ) {
                            linkLabel =
                                "🔗 Voir sur Amazon";
                        } else {
                            linkLabel =
                                "🔗 Voir le produit";
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
                                                src="${escapeHTML(
                                                    safeImage
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
                })
                .join("")}

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
   BOUTONS
   ========================================================= */

function handleQuestionnaireButton(
    element
) {
    if (!element) {
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

            if (!element) {
                return;
            }

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

            if (
                event.key ===
                "Escape"
            ) {
                closeQuestionnaire();
            }
        }
    );

    console.log(
        "🎁 GiftFinder : application chargée."
    );

    console.log(
        "🧠 Questionnaire IA adaptatif activé."
    );
}

/* =========================================================
   DÉMARRAGE
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
