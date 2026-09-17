import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error("❌ OPENAI_API_KEY est absente du fichier .env");
}

const client = new OpenAI({
    apiKey
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

/* =========================================================
   ANALYSE D'UNE RÉPONSE
   ========================================================= */

app.post("/api/analyze-answer", async (req, res) => {
    console.log("🧠 Analyse d'une réponse...");

    try {
        const { answers, lastAnswer, questionHistory } = req.body;

        if (!apiKey) {
            return res.status(500).json({
                error: "La clé API OpenAI n'est pas configurée."
            });
        }

        if (!answers || typeof answers !== "object") {
            return res.status(400).json({
                error: "Les réponses sont manquantes."
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

${JSON.stringify(answers, null, 2)}

DERNIÈRE RÉPONSE :

${JSON.stringify(lastAnswer ?? "", null, 2)}

HISTORIQUE DES QUESTIONS :

${JSON.stringify(questionHistory ?? [], null, 2)}

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

        console.log("🤖 Appel de l'IA pour analyser la réponse...");

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
            input: prompt
        });

        console.log("✅ Analyse reçue");

        const text = response.output_text?.trim();

        if (!text) {
            return res.status(500).json({
                error: "L'IA n'a retourné aucune analyse."
            });
        }

        console.log("Réponse analyse :", text);

        let result;

        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error("❌ JSON invalide :", parseError);

            return res.status(500).json({
                error: "La réponse de l'IA n'est pas au bon format."
            });
        }

        if (typeof result.shouldContinue !== "boolean") {
            return res.status(500).json({
                error: "La réponse de l'IA est incomplète."
            });
        }

        if (result.shouldContinue && !result.nextQuestion) {
            return res.status(500).json({
                error: "L'IA doit fournir une prochaine question."
            });
        }

        console.log(
            result.shouldContinue
                ? `➡️ Prochaine question : ${result.nextQuestion.text}`
                : "🏁 Questionnaire terminé"
        );

        res.json(result);

    } catch (error) {
        console.error("❌ ERREUR ANALYSE IA :", error);

        res.status(500).json({
            error:
                error?.message ||
                "Une erreur est survenue pendant l'analyse."
        });
    }
});


/* =========================================================
   RECOMMANDATIONS FINALES
   ========================================================= */

app.post("/api/recommendations", async (req, res) => {
    console.log("➡️ Nouvelle demande de recommandations");

    try {
        const answers = req.body;

        console.log("Réponses finales reçues :", answers);

        if (!apiKey) {
            return res.status(500).json({
                error: "La clé API OpenAI n'est pas configurée."
            });
        }

        const prompt = `
Tu es l'intelligence artificielle de GiftFinder.

L'utilisateur veut trouver un cadeau.

Voici son profil complet :

${JSON.stringify(answers, null, 2)}

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
      "reason": "Pourquoi cette idée correspond au profil",
      "estimatedPrice": "Fourchette de prix"
    }
  ]
}

Donne entre 10 et 20 idées variées.
`;

        console.log("🤖 Génération des recommandations...");

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
            input: prompt
        });

        console.log("✅ Recommandations reçues");

        const text = response.output_text?.trim();

        if (!text) {
            return res.status(500).json({
                error: "L'IA n'a retourné aucune recommandation."
            });
        }

        let result;

        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error("❌ JSON invalide :", parseError);

            return res.status(500).json({
                error: "La réponse de l'IA n'est pas au bon format."
            });
        }

        if (
            !result.recommendations ||
            !Array.isArray(result.recommendations)
        ) {
            return res.status(500).json({
                error: "Aucune recommandation valide reçue."
            });
        }

        console.log(
            `🎁 ${result.recommendations.length} recommandations générées`
        );

        res.json(result);

    } catch (error) {
        console.error("❌ ERREUR IA :", error);

        res.status(500).json({
            error:
                error?.message ||
                "Une erreur est survenue lors de la recherche."
        });
    }
});


/* =========================================================
   PAGE DU SITE
   ========================================================= */

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


/* =========================================================
   DÉMARRAGE
   ========================================================= */

app.listen(PORT, () => {
    console.log("");
    console.log("=================================");
    console.log("🎁 GiftFinder");
    console.log("=================================");
    console.log(`🌐 http://localhost:${PORT}`);

    console.log(
        process.env.OPENAI_API_KEY
            ? "🔑 Clé API détectée"
            : "❌ Clé API NON détectée"
    );

    console.log("🧠 Analyse IA activée");
    console.log("=================================");
    console.log("");
});
