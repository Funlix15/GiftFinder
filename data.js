/* =========================================================
   GIFT FINDER — DATA
   ========================================================= */

const giftCategories = [
    {
        id: "gaming",
        name: "Jeux vidéo",
        icon: "🎮",
        description: "Jeux, consoles et accessoires gaming"
    },
    {
        id: "tech",
        name: "Électronique / Tech",
        icon: "💻",
        description: "Gadgets, électronique et objets connectés"
    },
    {
        id: "accessories",
        name: "Accessoires",
        icon: "🎧",
        description: "Accessoires utiles et tendance"
    },
    {
        id: "fashion",
        name: "Mode",
        icon: "👕",
        description: "Vêtements et accessoires de mode"
    },
    {
        id: "sneakers",
        name: "Sneakers",
        icon: "👟",
        description: "Baskets et chaussures"
    },
    {
        id: "streetwear",
        name: "Streetwear",
        icon: "🧢",
        description: "Style urbain et vêtements streetwear"
    },
    {
        id: "jewelry",
        name: "Bijoux",
        icon: "💎",
        description: "Bijoux et petits accessoires"
    },
    {
        id: "sport",
        name: "Sport",
        icon: "⚽",
        description: "Sport, entraînement et loisirs"
    },
    {
        id: "creative",
        name: "Créatif",
        icon: "🎨",
        description: "Dessin, création et loisirs créatifs"
    },
    {
        id: "books",
        name: "Livres",
        icon: "📚",
        description: "Livres, mangas et bandes dessinées"
    },
    {
        id: "food",
        name: "Nourriture",
        icon: "🍫",
        description: "Coffrets et gourmandises"
    },
    {
        id: "drinks",
        name: "Boissons",
        icon: "🥤",
        description: "Coffrets et boissons"
    },
    {
        id: "home",
        name: "Maison",
        icon: "🏠",
        description: "Décoration et objets pour la maison"
    },
    {
        id: "beauty",
        name: "Beauté",
        icon: "✨",
        description: "Soins et accessoires beauté"
    },
    {
        id: "music",
        name: "Musique",
        icon: "🎵",
        description: "Musique, audio et accessoires"
    },
    {
        id: "personalized",
        name: "Personnalisé",
        icon: "🎁",
        description: "Cadeaux personnalisables"
    },
    {
        id: "travel",
        name: "Voyage",
        icon: "🌍",
        description: "Voyage et accessoires de voyage"
    },
    {
        id: "experience",
        name: "Expérience / Lieu",
        icon: "🎟️",
        description: "Activités, sorties et expériences"
    }
];


/* =========================================================
   PLATEFORMES GAMING
   ========================================================= */

const gamingPlatforms = [
    {
        id: "pc",
        name: "PC",
        icon: "🖥️"
    },
    {
        id: "playstation",
        name: "PlayStation",
        icon: "🎮"
    },
    {
        id: "xbox",
        name: "Xbox",
        icon: "🟢"
    },
    {
        id: "nintendo",
        name: "Nintendo",
        icon: "🔴"
    },
    {
        id: "mobile",
        name: "Mobile",
        icon: "📱"
    },
    {
        id: "all",
        name: "Peu importe",
        icon: "✨"
    }
];


/* =========================================================
   TYPES DE PERSONNES
   ========================================================= */

const recipientOptions = [
    {
        id: "friend",
        name: "Ami(e)",
        icon: "🧑‍🤝‍🧑",
        description: "Pour un ami ou une amie"
    },
    {
        id: "family",
        name: "Famille",
        icon: "👨‍👩‍👧",
        description: "Parent, frère, sœur, cousin..."
    },
    {
        id: "partner",
        name: "Partenaire",
        icon: "❤️",
        description: "Pour quelqu'un de proche"
    },
    {
        id: "child",
        name: "Enfant / Ado",
        icon: "🧒",
        description: "Pour un enfant ou adolescent"
    },
    {
        id: "colleague",
        name: "Collègue",
        icon: "💼",
        description: "Pour quelqu'un du travail"
    },
    {
        id: "self",
        name: "Moi",
        icon: "🙋",
        description: "Pour me faire plaisir"
    },
    {
        id: "other",
        name: "Autre",
        icon: "🎁",
        description: "Une autre personne"
    }
];


/* =========================================================
   BUDGETS
   ========================================================= */

const budgetOptions = [
    {
        id: "under20",
        name: "Moins de 20 €",
        min: 0,
        max: 19.99
    },
    {
        id: "20to50",
        name: "20 – 50 €",
        min: 20,
        max: 50
    },
    {
        id: "50to100",
        name: "50 – 100 €",
        min: 50,
        max: 100
    },
    {
        id: "100to250",
        name: "100 – 250 €",
        min: 100,
        max: 250
    },
    {
        id: "250plus",
        name: "250 €+",
        min: 250,
        max: 1000
    }
];


/* =========================================================
   CATALOGUE DE CADEAUX
   ========================================================= */

const gifts = [

    /* ================= GAMING ================= */

    {
        id: 1,
        title: "Support casque gaming RGB",
        category: "gaming",
        price: 24.99,
        icon: "🎧",
        platforms: ["pc", "playstation", "xbox"],
        tags: ["gaming", "setup", "rgb", "accessoire"],
        description:
            "Un support pratique pour ranger un casque gaming et améliorer un setup.",
        rating: 4.7
    },

    {
        id: 2,
        title: "Tapis de souris gaming XXL",
        category: "gaming",
        price: 29.99,
        icon: "🖱️",
        platforms: ["pc"],
        tags: ["gaming", "setup", "pc"],
        description:
            "Grand tapis de souris pour compléter un bureau gaming.",
        rating: 4.8
    },

    {
        id: 3,
        title: "Manette sans fil",
        category: "gaming",
        price: 59.99,
        icon: "🎮",
        platforms: ["pc", "xbox", "playstation"],
        tags: ["gaming", "manette", "console"],
        description:
            "Une manette sans fil polyvalente pour jouer confortablement.",
        rating: 4.6
    },

    {
        id: 4,
        title: "Carte cadeau gaming",
        category: "gaming",
        price: 25,
        icon: "🎁",
        platforms: ["pc", "playstation", "xbox", "nintendo"],
        tags: ["gaming", "carte", "cadeau"],
        description:
            "Une carte cadeau permettant de choisir soi-même son jeu ou contenu.",
        rating: 4.5
    },

    {
        id: 5,
        title: "Éclairage LED pour setup",
        category: "gaming",
        price: 34.99,
        icon: "💡",
        platforms: ["pc", "playstation", "xbox"],
        tags: ["gaming", "setup", "led", "decoration"],
        description:
            "Un éclairage LED pour personnaliser une chambre ou un setup.",
        rating: 4.7
    },

    {
        id: 6,
        title: "Chaise gaming",
        category: "gaming",
        price: 149.99,
        icon: "🪑",
        platforms: ["pc", "playstation", "xbox"],
        tags: ["gaming", "setup", "confort"],
        description:
            "Une chaise orientée gaming pour améliorer le confort devant l'écran.",
        rating: 4.4
    },


    /* ================= TECH ================= */

    {
        id: 7,
        title: "Écouteurs sans fil",
        category: "tech",
        price: 39.99,
        icon: "🎧",
        tags: ["audio", "musique", "portable"],
        description:
            "Des écouteurs sans fil pratiques pour écouter de la musique partout.",
        rating: 4.6
    },

    {
        id: 8,
        title: "Enceinte Bluetooth",
        category: "tech",
        price: 49.99,
        icon: "🔊",
        tags: ["audio", "musique", "bluetooth"],
        description:
            "Une enceinte compacte pour écouter de la musique avec ses amis.",
        rating: 4.7
    },

    {
        id: 9,
        title: "Chargeur sans fil",
        category: "tech",
        price: 24.99,
        icon: "🔋",
        tags: ["smartphone", "tech", "utile"],
        description:
            "Un chargeur sans fil pratique pour un bureau ou une table de nuit.",
        rating: 4.5
    },

    {
        id: 10,
        title: "Mini projecteur",
        category: "tech",
        price: 89.99,
        icon: "📽️",
        tags: ["cinema", "film", "tech"],
        description:
            "Un petit projecteur pour transformer une pièce en espace cinéma.",
        rating: 4.4
    },


    /* ================= ACCESSOIRES ================= */

    {
        id: 11,
        title: "Sac à dos urbain",
        category: "accessories",
        price: 44.99,
        icon: "🎒",
        tags: ["sac", "urbain", "quotidien"],
        description:
            "Un sac à dos moderne adapté aux cours, sorties et déplacements.",
        rating: 4.6
    },

    {
        id: 12,
        title: "Portefeuille minimaliste",
        category: "accessories",
        price: 29.99,
        icon: "👛",
        tags: ["portefeuille", "mode", "quotidien"],
        description:
            "Un portefeuille compact et simple pour transporter ses cartes.",
        rating: 4.5
    },


    /* ================= MODE ================= */

    {
        id: 13,
        title: "Hoodie oversize",
        category: "fashion",
        price: 49.99,
        icon: "👕",
        tags: ["mode", "hoodie", "streetwear"],
        description:
            "Un hoodie confortable et facile à porter au quotidien.",
        rating: 4.7
    },

    {
        id: 14,
        title: "Casquette tendance",
        category: "fashion",
        price: 29.99,
        icon: "🧢",
        tags: ["mode", "casquette", "style"],
        description:
            "Une casquette simple pour compléter une tenue.",
        rating: 4.5
    },


    /* ================= SNEAKERS ================= */

    {
        id: 15,
        title: "Sneakers lifestyle",
        category: "sneakers",
        price: 89.99,
        icon: "👟",
        tags: ["sneakers", "mode", "chaussures"],
        description:
            "Une paire de sneakers polyvalente pour tous les jours.",
        rating: 4.6
    },

    {
        id: 16,
        title: "Sneakers premium",
        category: "sneakers",
        price: 149.99,
        icon: "👟",
        tags: ["sneakers", "premium", "mode"],
        description:
            "Une paire plus haut de gamme pour un cadeau important.",
        rating: 4.7
    },


    /* ================= STREETWEAR ================= */

    {
        id: 17,
        title: "Sweat streetwear",
        category: "streetwear",
        price: 59.99,
        icon: "🧥",
        tags: ["streetwear", "sweat", "mode"],
        description:
            "Un sweat inspiré du style urbain.",
        rating: 4.5
    },

    {
        id: 18,
        title: "Bonnet streetwear",
        category: "streetwear",
        price: 24.99,
        icon: "🧢",
        tags: ["streetwear", "bonnet", "mode"],
        description:
            "Un accessoire simple pour compléter une tenue streetwear.",
        rating: 4.4
    },


    /* ================= BIJOUX ================= */

    {
        id: 19,
        title: "Bracelet minimaliste",
        category: "jewelry",
        price: 34.99,
        icon: "📿",
        tags: ["bijou", "bracelet", "minimaliste"],
        description:
            "Un bracelet discret et facile à associer.",
        rating: 4.6
    },

    {
        id: 20,
        title: "Collier personnalisé",
        category: "jewelry",
        price: 49.99,
        icon: "💎",
        tags: ["bijou", "personnalisé", "collier"],
        description:
            "Un collier personnalisable pour rendre le cadeau plus personnel.",
        rating: 4.8
    },


    /* ================= SPORT ================= */

    {
        id: 21,
        title: "Ballon de football",
        category: "sport",
        price: 29.99,
        icon: "⚽",
        tags: ["football", "sport"],
        description:
            "Un ballon pour jouer entre amis ou s'entraîner.",
        rating: 4.6
    },

    {
        id: 22,
        title: "Sac de sport",
        category: "sport",
        price: 39.99,
        icon: "🏋️",
        tags: ["sport", "fitness", "sac"],
        description:
            "Un sac pratique pour transporter ses affaires de sport.",
        rating: 4.5
    },

    {
        id: 23,
        title: "Kit d'entraînement maison",
        category: "sport",
        price: 59.99,
        icon: "🏠",
        tags: ["sport", "fitness", "entraînement"],
        description:
            "Un ensemble d'accessoires pour s'entraîner à la maison.",
        rating: 4.4
    },


    /* ================= CRÉATIF ================= */

    {
        id: 24,
        title: "Kit de dessin",
        category: "creative",
        price: 34.99,
        icon: "🎨",
        tags: ["dessin", "créatif", "art"],
        description:
            "Un kit complet pour commencer ou continuer le dessin.",
        rating: 4.7
    },

    {
        id: 25,
        title: "Kit peinture",
        category: "creative",
        price: 44.99,
        icon: "🖌️",
        tags: ["peinture", "art", "créatif"],
        description:
            "Un coffret créatif pour réaliser ses propres peintures.",
        rating: 4.6
    },


    /* ================= LIVRES ================= */

    {
        id: 26,
        title: "Manga collector",
        category: "books",
        price: 19.99,
        icon: "📖",
        tags: ["manga", "livre", "collection"],
        description:
            "Un manga ou volume collector pour les amateurs de lecture.",
        rating: 4.8
    },

    {
        id: 27,
        title: "Roman bestseller",
        category: "books",
        price: 18.99,
        icon: "📚",
        tags: ["roman", "livre"],
        description:
            "Un roman populaire à offrir à quelqu'un qui aime lire.",
        rating: 4.6
    },


    /* ================= NOURRITURE ================= */

    {
        id: 28,
        title: "Coffret chocolat",
        category: "food",
        price: 24.99,
        icon: "🍫",
        tags: ["chocolat", "gourmand", "coffret"],
        description:
            "Un coffret de chocolats pour un cadeau gourmand.",
        rating: 4.7
    },

    {
        id: 29,
        title: "Box de snacks",
        category: "food",
        price: 29.99,
        icon: "🍿",
        tags: ["snacks", "box", "gourmand"],
        description:
            "Une sélection de snacks à découvrir.",
        rating: 4.5
    },


    /* ================= BOISSONS ================= */

    {
        id: 30,
        title: "Coffret boissons découverte",
        category: "drinks",
        price: 34.99,
        icon: "🥤",
        tags: ["boissons", "coffret", "découverte"],
        description:
            "Un coffret de boissons à découvrir.",
        rating: 4.4
    },


    /* ================= MAISON ================= */

    {
        id: 31,
        title: "Lampe d'ambiance",
        category: "home",
        price: 39.99,
        icon: "💡",
        tags: ["maison", "lampe", "déco"],
        description:
            "Une lampe décorative pour créer une ambiance agréable.",
        rating: 4.7
    },

    {
        id: 32,
        title: "Cadre photo personnalisé",
        category: "home",
        price: 29.99,
        icon: "🖼️",
        tags: ["photo", "personnalisé", "déco"],
        description:
            "Un cadre personnalisé pour conserver un souvenir.",
        rating: 4.8
    },


    /* ================= BEAUTÉ ================= */

    {
        id: 33,
        title: "Coffret soins",
        category: "beauty",
        price: 39.99,
        icon: "✨",
        tags: ["beauté", "soins", "coffret"],
        description:
            "Un coffret de produits de soin à offrir.",
        rating: 4.6
    },


    /* ================= MUSIQUE ================= */

    {
        id: 34,
        title: "Casque audio",
        category: "music",
        price: 79.99,
        icon: "🎧",
        tags: ["musique", "audio", "casque"],
        description:
            "Un casque audio pour écouter de la musique confortablement.",
        rating: 4.7
    },

    {
        id: 35,
        title: "Vinyle collector",
        category: "music",
        price: 34.99,
        icon: "💿",
        tags: ["musique", "vinyle", "collection"],
        description:
            "Un vinyle à offrir à quelqu'un qui aime collectionner.",
        rating: 4.6
    },


    /* ================= PERSONNALISÉ ================= */

    {
        id: 36,
        title: "Mug personnalisé",
        category: "personalized",
        price: 19.99,
        icon: "☕",
        tags: ["personnalisé", "mug", "photo"],
        description:
            "Un mug personnalisable avec une photo ou un message.",
        rating: 4.7
    },

    {
        id: 37,
        title: "Poster personnalisé",
        category: "personalized",
        price: 24.99,
        icon: "🖼️",
        tags: ["personnalisé", "poster", "déco"],
        description:
            "Un poster personnalisable pour créer un cadeau unique.",
        rating: 4.6
    },


    /* ================= VOYAGE ================= */

    {
        id: 38,
        title: "Sac de voyage",
        category: "travel",
        price: 69.99,
        icon: "🧳",
        tags: ["voyage", "sac", "weekend"],
        description:
            "Un sac pratique pour les week-ends et les déplacements.",
        rating: 4.6
    },

    {
        id: 39,
        title: "Kit voyage",
        category: "travel",
        price: 29.99,
        icon: "✈️",
        tags: ["voyage", "accessoires"],
        description:
            "Un ensemble d'accessoires pratiques pour voyager.",
        rating: 4.5
    },


    /* ================= EXPÉRIENCES ================= */

    {
        id: 40,
        title: "Session escape game",
        category: "experience",
        price: 30,
        icon: "🔐",
        tags: ["expérience", "sortie", "escape game"],
        description:
            "Une activité à partager entre amis ou en famille.",
        rating: 4.8,
        requiresCity: true
    },

    {
        id: 41,
        title: "Session karting",
        category: "experience",
        price: 45,
        icon: "🏎️",
        tags: ["expérience", "karting", "sortie"],
        description:
            "Une session de karting pour une expérience pleine d'énergie.",
        rating: 4.7,
        requiresCity: true
    },

    {
        id: 42,
        title: "Place de cinéma",
        category: "experience",
        price: 15,
        icon: "🎬",
        tags: ["cinéma", "film", "sortie"],
        description:
            "Une sortie cinéma simple à partager.",
        rating: 4.5,
        requiresCity: true
    },

    {
        id: 43,
        title: "Bowling",
        category: "experience",
        price: 25,
        icon: "🎳",
        tags: ["bowling", "sortie", "expérience"],
        description:
            "Une partie de bowling à faire avec des proches.",
        rating: 4.6,
        requiresCity: true
    }

];


/* =========================================================
   GUIDES
   ========================================================= */

const guides = [
    {
        id: 1,
        title: "20 idées de cadeaux pour un gamer",
        category: "gaming",
        icon: "🎮",
        description:
            "Des idées pour les joueurs PC, PlayStation, Xbox et Nintendo."
    },

    {
        id: 2,
        title: "Cadeaux à moins de 20 €",
        category: "budget",
        icon: "💶",
        description:
            "Des idées simples et accessibles pour les petits budgets."
    },

    {
        id: 3,
        title: "Cadeaux pour son meilleur ami",
        category: "friend",
        icon: "🧑‍🤝‍🧑",
        description:
            "Des idées pour faire plaisir à ton meilleur ami ou ta meilleure amie."
    },

    {
        id: 4,
        title: "Cadeaux originaux",
        category: "original",
        icon: "✨",
        description:
            "Des idées différentes des cadeaux classiques."
    },

    {
        id: 5,
        title: "Cadeaux personnalisés",
        category: "personalized",
        icon: "🎁",
        description:
            "Des cadeaux qui peuvent être personnalisés."
    },

    {
        id: 6,
        title: "Idées cadeaux pour Noël",
        category: "christmas",
        icon: "🎄",
        description:
            "Une sélection d'idées pour les fêtes."
    }
];


/* =========================================================
   PLANS
   ========================================================= */

const pricingPlans = {
    free: {
        name: "Gratuit",
        price: 0,
        searches: 1,
        description: "Pour découvrir GiftFinder."
    },

    premium: {
        name: "Premium",
        price: 3.99,
        searches: Infinity,
        description: "Pour chercher autant de cadeaux que tu veux."
    },

    pack10: {
        name: "Pack 10 recherches",
        price: 4.99,
        searches: 10,
        description: "10 recherches supplémentaires."
    },

    pack30: {
        name: "Pack 30 recherches",
        price: 9.99,
        searches: 30,
        description: "30 recherches supplémentaires."
    }
};


/* =========================================================
   MOTS-CLÉS POUR LES JEUX
   ========================================================= */

const popularGames = [
    {
        id: "minecraft",
        name: "Minecraft",
        icon: "⛏️"
    },
    {
        id: "fortnite",
        name: "Fortnite",
        icon: "🔫"
    },
    {
        id: "roblox",
        name: "Roblox",
        icon: "🟥"
    },
    {
        id: "gta",
        name: "GTA",
        icon: "🚗"
    },
    {
        id: "callofduty",
        name: "Call of Duty",
        icon: "🎯"
    },
    {
        id: "ea-sports-fc",
        name: "EA Sports FC",
        icon: "⚽"
    },
    {
        id: "pokemon",
        name: "Pokémon",
        icon: "⚡"
    },
    {
        id: "other",
        name: "Autre",
        icon: "🎮"
    }
];