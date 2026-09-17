"use strict";

import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import Stripe from "stripe";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   CONFIGURATION
========================================================= */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const PUBLIC_URL =
    process.env.PUBLIC_URL ||
    `http://localhost:${PORT}`;

if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY est absente.");
}

if (!STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY est absente.");
}

if (!STRIPE_WEBHOOK_SECRET) {
    console.warn(
        "⚠️ STRIPE_WEBHOOK_SECRET est absente. Le webhook Stripe ne pourra pas être vérifié."
    );
}

const openai = OPENAI_API_KEY
    ? new OpenAI({
          apiKey: OPENAI_API_KEY
      })
    : null;

const stripe = STRIPE_SECRET_KEY
    ? new Stripe(STRIPE_SECRET_KEY)
    : null;


/* =========================================================
   PRODUITS STRIPE
========================================================= */

const STRIPE_PRODUCTS = {
    premium: {
        priceId: "price_1UGjgq3XSUH9OuRAzkyxWdEx",
        mode: "subscription",
        name: "GiftFinder Premium"
    },

    pack10: {
        priceId: "price_1UGjhE3XSUH9OuRAnOOceF6s",
        mode: "payment",
        name: "Pack 10 recherches",
        credits: 10
    },

    pack30: {
        priceId: "price_1UGjhd3XSUH9OuRAachMEWE3",
        mode: "payment",
        name: "Pack 30 recherches",
        credits: 30
    }
};


/* =========================================================
   STOCKAGE UTILISATEURS
   ---------------------------------------------------------
   Version simple pour le développement.

   Pour la production sur Render, il faudra remplacer
   ce stockage par une vraie base de données persistante.
========================================================= */

const DATA_DIR = path.join(__dirname, "storage");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });
}

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify({}, null, 2),
        "utf8"
    );
}

function loadUsers() {
    try {
        const content = fs.readFileSync(
            USERS_FILE,
            "utf8"
        );

        return JSON.parse(content || "{}");
    } catch (error) {
        console.error(
            "❌ Impossible de lire users.json :",
            error
        );

        return {};
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(
            USERS_FILE,
            JSON.stringify(users, null, 2),
            "utf8"
        );
    } catch (error) {
        console.error(
            "❌ Impossible de sauvegarder users.json :",
            error
        );
    }
}

function getUser(userId) {
    const users = loadUsers();

    if (!users[userId]) {
        users[userId] = {
            credits: 0,
            lastFreeSearch: null,
            premium: false,
            stripeCustomerId: null,
            stripeSubscriptionId: null
        };

        saveUsers(users);
    }

    return users[userId];
}

function updateUser(userId, changes) {
    const users = loadUsers();

    if (!users[userId]) {
        users[userId] = {
            credits: 0,
            lastFreeSearch: null,
            premium: false,
            stripeCustomerId: null,
            stripeSubscriptionId: null
        };
    }

    users[userId] = {
        ...users[userId],
        ...changes
    };

    saveUsers(users);

    return users[userId];
}


/* =========================================================
   IDENTIFIANT UTILISATEUR
========================================================= */

function getUserId(req) {
    let userId =
        req.headers["x-giftfinder-user-id"];

    if (
        !userId ||
        typeof userId !== "string"
    ) {
        userId =
            "guest_" +
            Math.random()
                .toString(36)
                .slice(2) +
            Date.now().toString(36);
    }

    return userId.slice(0, 100);
}


/* =========================================================
   STRIPE WEBHOOK
   ---------------------------------------------------------
   IMPORTANT :
   Cette route doit être AVANT express.json()
   afin de conserver le body brut.
========================================================= */

app.post(
    "/api/stripe/webhook",
    express.raw({
        type: "application/json"
    }),
    async (req, res) => {
        if (!stripe) {
            return res.status(500).send(
                "Stripe n'est pas configuré."
            );
        }

        let event;

        try {
            if (STRIPE_WEBHOOK_SECRET) {
                const signature =
                    req.headers[
                        "stripe-signature"
                    ];

                event =
                    stripe.webhooks.constructEvent(
                        req.body,
                        signature,
                        STRIPE_WEBHOOK_SECRET
                    );
            } else {
                console.error(
                    "❌ STRIPE_WEBHOOK_SECRET manquante."
                );

                return res.status(500).send(
                    "Webhook secret manquant."
                );
            }
        } catch (error) {
            console.error(
                "❌ Signature webhook invalide :",
                error.message
            );

            return res.status(400).send(
                `Webhook Error: ${error.message}`
            );
        }

        console.log(
            "📦 Stripe event :",
            event.type
        );


        /* =====================================================
           ACHAT TERMINÉ
        ===================================================== */

        if (
            event.type ===
            "checkout.session.completed"
        ) {
            const session =
                event.data.object;

            const userId =
                session.metadata?.userId;

            const product =
                session.metadata?.product;

            if (!userId) {
                console.error(
                    "❌ Aucun userId dans le paiement Stripe."
                );

                return res.json({
                    received: true
                });
            }

            const user =
                getUser(userId);


            /* ================================================
               PACK 10
            ================================================= */

            if (product === "pack10") {
                const newCredits =
                    Number(user.credits || 0) +
                    10;

                updateUser(
                    userId,
                    {
                        credits:
                            newCredits
                    }
                );

                console.log(
                    `🎟️ +10 recherches pour ${userId}`
                );
            }


            /* ================================================
               PACK 30
            ================================================= */

            if (product === "pack30") {
                const newCredits =
                    Number(user.credits || 0) +
                    30;

                updateUser(
                    userId,
                    {
                        credits:
                            newCredits
                    }
                );

                console.log(
                    `🎟️ +30 recherches pour ${userId}`
                );
            }


            /* ================================================
               PREMIUM
            ================================================= */

            if (product === "premium") {
                updateUser(
                    userId,
                    {
                        premium: true,
                        stripeCustomerId:
                            session.customer ||
                            user.stripeCustomerId,
                        stripeSubscriptionId:
                            session.subscription ||
                            user.stripeSubscriptionId
                    }
                );

                console.log(
                    `⭐ Premium activé pour ${userId}`
                );
            }
        }


        /* =====================================================
           ABONNEMENT PREMIUM MODIFIÉ
        ===================================================== */

        if (
            event.type ===
            "customer.subscription.updated"
        ) {
            const subscription =
                event.data.object;

            const users =
                loadUsers();

            for (
                const userId of Object.keys(users)
            ) {
                const user =
                    users[userId];

                if (
                    user.stripeSubscriptionId ===
                    subscription.id
                ) {
                    const active =
                        subscription.status ===
                            "active" ||
                        subscription.status ===
                            "trialing";

                    updateUser(
                        userId,
                        {
                            premium: active
                        }
                    );

                    console.log(
                        `⭐ Premium ${active ? "actif" : "inactif"} pour ${userId}`
                    );
                }
            }
        }


        /* =====================================================
           ABONNEMENT PREMIUM ANNULÉ
        ===================================================== */

        if (
            event.type ===
            "customer.subscription.deleted"
        ) {
            const subscription =
                event.data.object;

            const users =
                loadUsers();

            for (
                const userId of Object.keys(users)
            ) {
                const user =
                    users[userId];

                if (
                    user.stripeSubscriptionId ===
                    subscription.id
                ) {
                    updateUser(
                        userId,
                        {
                            premium: false,
                            stripeSubscriptionId:
                                null
                        }
                    );

                    console.log(
                        `❌ Premium désactivé pour ${userId}`
                    );
                }
            }
        }

        res.json({
            received: true
        });
    }
);


/* =========================================================
   JSON
========================================================= */

app.use(
    express.json({
        limit: "1mb"
    })
);


/* =========================================================
   IDENTITÉ / CRÉDITS
========================================================= */

app.get(
    "/api/account",
    (req, res) => {
        const userId =
            getUserId(req);

        const user =
            getUser(userId);

        res.json({
            userId,
            credits:
                Number(user.credits || 0),
            premium:
                Boolean(user.premium),
            canSearch:
                Boolean(user.premium) ||
                Number(user.credits || 0) > 0 ||
                !isFreeSearchUsedToday(
                    user
                )
        });
    }
);


/* =========================================================
   RECHERCHE GRATUITE DU JOUR
========================================================= */

function isFreeSearchUsedToday(user) {
    if (!user.lastFreeSearch) {
        return false;
    }

    const now =
        new Date();

    const last =
        new Date(
            user.lastFreeSearch
        );

    return (
        now.getFullYear() ===
            last.getFullYear() &&
        now.getMonth() ===
            last.getMonth() &&
        now.getDate() ===
            last.getDate()
    );
}


/* =========================================================
   CONSOMMER UNE RECHERCHE
   ---------------------------------------------------------
   Premium :
      illimité

   Pack :
      utilise 1 crédit

   Gratuit :
      1 recherche par jour
========================================================= */

app.post(
    "/api/start-search",
    (req, res) => {
        const userId =
            getUserId(req);

        const user =
            getUser(userId);


        /* PREMIUM */

        if (user.premium) {
            return res.json({
                allowed: true,
                type: "premium",
                credits:
                    Number(
                        user.credits || 0
                    ),
                userId
            });
        }


        /* CRÉDITS PAYANTS */

        if (
            Number(user.credits || 0) >
            0
        ) {
            const newCredits =
                Number(
                    user.credits
                ) - 1;

            updateUser(
                userId,
                {
                    credits:
                        newCredits
                }
            );

            return res.json({
                allowed: true,
                type: "credit",
                credits:
                    newCredits,
                userId
            });
        }


        /* RECHERCHE GRATUITE */

        if (
            !isFreeSearchUsedToday(
                user
            )
        ) {
            updateUser(
                userId,
                {
                    lastFreeSearch:
                        new Date().toISOString()
                }
            );

            return res.json({
                allowed: true,
                type: "free",
                credits: 0,
                userId
            });
        }


        /* PLUS DE RECHERCHE */

        return res.status(402).json({
            allowed: false,
            error:
                "Tu as utilisé ta recherche gratuite du jour.",
            credits: 0,
            premium: false,
            userId
        });
    }
);


/* =========================================================
   CRÉATION CHECKOUT STRIPE
========================================================= */

app.post(
    "/api/create-checkout-session",
    async (req, res) => {
        try {
            if (!stripe) {
                return res.status(500).json({
                    error:
                        "Stripe n'est pas configuré sur le serveur."
                });
            }

            const {
                product
            } = req.body;

            const productConfig =
                STRIPE_PRODUCTS[
                    product
                ];

            if (!productConfig) {
                return res.status(400).json({
                    error:
                        "Produit Stripe invalide."
                });
            }

            const userId =
                getUserId(req);

            const user =
                getUser(userId);

            const sessionConfig = {
                mode:
                    productConfig.mode,

                line_items: [
                    {
                        price:
                            productConfig.priceId,

                        quantity: 1
                    }
                ],

                success_url:
                    `${PUBLIC_URL}/?payment=success&product=${encodeURIComponent(product)}`,

                cancel_url:
                    `${PUBLIC_URL}/?payment=cancelled`,

                metadata: {
                    userId,
                    product
                }
            };


            /* =================================================
               PREMIUM
            ================================================= */

            if (
                product === "premium"
            ) {
                sessionConfig.subscription_data = {
                    metadata: {
                        userId,
                        product
                    }
                };

                if (
                    user.stripeCustomerId
                ) {
                    sessionConfig.customer =
                        user.stripeCustomerId;
                }
            }


            const session =
                await stripe.checkout.sessions.create(
                    sessionConfig
                );

            console.log(
                `💳 Checkout créé : ${product} pour ${userId}`
            );

            res.json({
                url:
                    session.url
            });

        } catch (error) {
            console.error(
                "❌ ERREUR STRIPE :",
                error
            );

            res.status(500).json({
                error:
                    error?.message ||
                    "Impossible de créer le paiement."
            });
        }
    }
);


/* =========================================================
   ANALYSE D'UNE RÉPONSE
========================================================= */

app.post(
    "/api/analyze-answer",
    async (req, res) => {
        console.log(
            "🧠 Analyse d'une réponse..."
        );

        try {
            const {
                answers,
                lastAnswer,
                questionHistory
            } = req.body;

            if (!openai) {
                return res.status(500).json({
                    error:
                        "La clé API OpenAI n'est pas configurée."
                });
            }

            if (
                !answers ||
                typeof answers !==
                    "object"
            ) {
                return res.status(400).json({
                    error:
                        "Les réponses sont manquantes."
                });
            }

            const prompt = `
Tu es l'intelligence artificielle de GiftFinder.

GiftFinder aide les utilisateurs à trouver des cadeaux réellement adaptés à une personne.

Ta mission est d'analyser progressivement les réponses de l'utilisateur.

IMPORTANT :

- Analyse TOUTES les réponses déjà données.
- Ne considère jamais uniquement la dernière réponse.
- Tiens compte du budget.
- Tiens compte du destinataire.
- Tiens compte de la catégorie.
- Tiens compte de la plateforme si le cadeau concerne le gaming.
- Tiens compte de la ville si une expérience ou une activité est recherchée.
- Tiens compte de l'occasion.
- Tiens compte des goûts et préférences.
- Évite de poser une question dont la réponse est déjà connue.
- La prochaine question doit réellement aider à mieux choisir le cadeau.
- Adapte la prochaine question au profil actuel.
- Si suffisamment d'informations sont déjà disponibles, indique que le questionnaire peut être terminé.
- Ne propose PAS encore de produits précis.
- N'invente aucun produit, aucun prix et aucun lien.
- Les vrais produits seront recherchés plus tard.

RÉPONSES ACTUELLES :

${JSON.stringify(
    answers,
    null,
    2
)}

DERNIÈRE RÉPONSE :

${JSON.stringify(
    lastAnswer ?? "",
    null,
    2
)}

HISTORIQUE DES QUESTIONS :

${JSON.stringify(
    questionHistory ?? [],
    null,
    2
)}

Tu dois décider s'il faut poser une nouvelle question ou terminer le questionnaire.

Retourne UNIQUEMENT un JSON valide avec exactement cette structure :

{
  "analysis": "Analyse courte et interne du profil actuel.",
  "shouldContinue": true,
  "nextQuestion": {
    "id": "identifiant_unique",
    "text": "Question à poser à l'utilisateur",
    "type": "choice",
    "options": [
      {
        "value": "valeur_1",
        "label": "Réponse 1"
      },
      {
        "value": "valeur_2",
        "label": "Réponse 2"
      }
    ]
  }
}

Si le questionnaire doit être terminé, utilise :

{
  "analysis": "Analyse finale du profil.",
  "shouldContinue": false,
  "nextQuestion": null
}

Règles pour les questions :

- Une seule question à la fois.
- Entre 2 et 6 choix maximum.
- Les choix doivent être clairs et différents.
- Les questions doivent être naturelles.
- Ne demande pas inutilement des informations déjà connues.
- La question doit permettre d'améliorer les futures recommandations.
`;

            console.log(
                "🤖 Appel de l'IA..."
            );

            const response =
                await openai.responses.create(
                    {
                        model:
                            OPENAI_MODEL,
                        input:
                            prompt
                    }
                );

            const text =
                response.output_text?.trim();

            if (!text) {
                return res.status(500).json({
                    error:
                        "L'IA n'a retourné aucune analyse."
                });
            }

            let result;

            try {
                result =
                    JSON.parse(text);
            } catch (error) {
                console.error(
                    "❌ JSON IA invalide :",
                    text
                );

                return res.status(500).json({
                    error:
                        "La réponse de l'IA n'est pas au bon format."
                });
            }

            if (
                typeof result.shouldContinue !==
                "boolean"
            ) {
                return res.status(500).json({
                    error:
                        "La réponse de l'IA est incomplète."
                });
            }

            if (
                result.shouldContinue &&
                !result.nextQuestion
            ) {
                return res.status(500).json({
                    error:
                        "L'IA doit fournir une prochaine question."
                });
            }

            res.json(result);

        } catch (error) {
            console.error(
                "❌ ERREUR ANALYSE IA :",
                error
            );

            res.status(500).json({
                error:
                    error?.message ||
                    "Une erreur est survenue pendant l'analyse."
            });
        }
    }
);


/* =========================================================
   RECOMMANDATIONS FINALES
========================================================= */

app.post(
    "/api/recommendations",
    async (req, res) => {
        console.log(
            "➡️ Nouvelle demande de recommandations"
        );

        try {
            if (!openai) {
                return res.status(500).json({
                    error:
                        "La clé API OpenAI n'est pas configurée."
                });
            }

            const answers =
                req.body;

            if (
                !answers ||
                typeof answers !==
                    "object"
            ) {
                return res.status(400).json({
                    error:
                        "Le profil utilisateur est manquant."
                });
            }

            const prompt = `
Tu es l'intelligence artificielle de GiftFinder.

L'utilisateur veut trouver un cadeau.

Voici son profil complet :

${JSON.stringify(
    answers,
    null,
    2
)}

Analyse attentivement TOUTES ses réponses.

Pour cette étape, propose uniquement des IDÉES de cadeaux.

IMPORTANT :

- N'invente pas de liens d'achat.
- N'invente pas de produits réellement disponibles.
- N'invente pas de prix exacts.
- Tiens compte de toutes les réponses.
- Les idées doivent être variées.
- Évite de proposer plusieurs fois exactement le même type de cadeau.
- Respecte le budget.
- Si le gaming est concerné, respecte la plateforme.
- Si une expérience est concernée, respecte la ville.
- Les vrais produits seront ajoutés plus tard grâce à une source de produits.

Retourne UNIQUEMENT un JSON valide :

{
  "recommendations": [
    {
      "name": "Nom de l'idée cadeau",
      "description": "Description courte",
      "reason": "Pourquoi cette idée correspond",
      "estimatedPrice": "Fourchette de prix"
    }
  ]
}

Donne entre 10 et 20 idées variées.
`;

            console.log(
                "🤖 Génération des recommandations..."
            );

            const response =
                await openai.responses.create(
                    {
                        model:
                            OPENAI_MODEL,
                        input:
                            prompt
                    }
                );

            const text =
                response.output_text?.trim();

            if (!text) {
                return res.status(500).json({
                    error:
                        "L'IA n'a retourné aucune recommandation."
                });
            }

            let result;

            try {
                result =
                    JSON.parse(text);
            } catch (error) {
                console.error(
                    "❌ JSON recommandations invalide :",
                    text
                );

                return res.status(500).json({
                    error:
                        "La réponse de l'IA n'est pas au bon format."
                });
            }

            if (
                !result.recommendations ||
                !Array.isArray(
                    result.recommendations
                )
            ) {
                return res.status(500).json({
                    error:
                        "Aucune recommandation valide reçue."
                });
            }

            console.log(
                `🎁 ${result.recommendations.length} recommandations générées`
            );

            res.json(result);

        } catch (error) {
            console.error(
                "❌ ERREUR IA :",
                error
            );

            res.status(500).json({
                error:
                    error?.message ||
                    "Une erreur est survenue lors de la recherche."
            });
        }
    }
);


/* =========================================================
   FICHIERS DU SITE
========================================================= */

app.use(
    express.static(__dirname)
);


/* =========================================================
   FALLBACK
========================================================= */

app.use(
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "index.html"
            )
        );
    }
);


/* =========================================================
   DÉMARRAGE
========================================================= */

app.listen(
    PORT,
    () => {
        console.log("");
        console.log(
            "================================="
        );
        console.log(
            "🎁 GiftFinder"
        );
        console.log(
            "================================="
        );
        console.log(
            `🌐 ${PUBLIC_URL}`
        );

        console.log(
            OPENAI_API_KEY
                ? "🔑 OpenAI détectée"
                : "❌ OpenAI NON détectée"
        );

        console.log(
            STRIPE_SECRET_KEY
                ? "💳 Stripe détecté"
                : "❌ Stripe NON détecté"
        );

        console.log(
            "🧠 IA activée"
        );

        console.log(
            "💰 Paiements Stripe activés"
        );

        console.log(
            "🎟️ Gestion des crédits activée"
        );

        console.log(
            "================================="
        );
        console.log("");
    }
);
