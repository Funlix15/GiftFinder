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

app.post("/api/recommendations", async (req, res) => {
    console.log("➡️ Nouvelle demande de recommandations");

    try {
        const answers = req.body;

        console.log("Réponses reçues :", answers);

        if (!apiKey) {
            return res.status(500).json({
                error: "La clé API OpenAI n'est pas configurée."
            });
        }

        const prompt = `
Tu es l'intelligence artificielle de GiftFinder.

L'utilisateur veut trouver un cadeau.

Voici ses réponses :

${JSON.stringify(answers, null, 2)}

Analyse attentivement ses réponses.

Propose des idées de cadeaux adaptées :
- au destinataire
- au budget
- à la catégorie
- à la plateforme si c'est du gaming
- à la ville si c'est une expérience
- à l'occasion
- aux préférences

IMPORTANT :
Pour cette version, tu proposes uniquement des IDÉES.
Tu ne dois pas inventer de liens d'achat.
Tu ne dois pas inventer de produits réellement disponibles.
Tu ne dois pas inventer de prix exacts.

Retourne UNIQUEMENT un JSON valide :

{
  "recommendations": [
    {
      "name": "Nom du cadeau",
      "description": "Description courte",
      "reason": "Pourquoi ce cadeau correspond",
      "estimatedPrice": "Fourchette de prix"
    }
  ]
}

Donne entre 5 et 20 idées.
`;

        console.log("🤖 Appel de l'IA...");

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
            input: prompt
        });

        console.log("✅ Réponse IA reçue");

        const text = response.output_text?.trim();

        console.log("Réponse brute :", text);

        if (!text) {
            return res.status(500).json({
                error: "L'IA n'a retourné aucune réponse."
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

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

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
    console.log("=================================");
    console.log("");
});