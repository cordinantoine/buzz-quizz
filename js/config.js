/* ════════════════════════════════════════════
   config.js — BUZZ! Quiz
   Contient : toutes les constantes globales
              partagées par game.js et ui.js
   Pour personnaliser le jeu, modifie ce fichier
   ════════════════════════════════════════════ */

// ── Définition des thèmes (UI) ──
// accent  = couleur principale des boutons et textes
// dark    = couleur foncée pour les gradients
// stars   = afficher des étoiles CSS en arrière-plan
const THEMES = {
  culture : { id:"culture",  name:"Culture Générale", emoji:"🧠", accent:"#a78bfa", dark:"#7c3aed", stars:true  },
  music   : { id:"music",    name:"Musique",           emoji:"🎵", accent:"#f472b6", dark:"#be185d", stars:false },
  cinema  : { id:"cinema",   name:"Cinéma / Séries",   emoji:"🎬", accent:"#fbbf24", dark:"#d97706", stars:true  },
  sport   : { id:"sport",    name:"Sport",             emoji:"⚽", accent:"#34d399", dark:"#059669", stars:false },
  histoire: { id:"histoire", name:"Histoire",          emoji:"🏛️", accent:"#d4a574", dark:"#92400e", stars:false },
  science : { id:"science",  name:"Sciences",          emoji:"🔬", accent:"#22d3ee", dark:"#0891b2", stars:true  },
  geo     : { id:"geo",      name:"Géographie",        emoji:"🌍", accent:"#60a5fa", dark:"#2563eb", stars:true  },
  gaming  : { id:"gaming",   name:"Jeux Vidéo",        emoji:"🎮", accent:"#c084fc", dark:"#7e22ce", stars:false },
  hp      : { id:"hp",       name:"Harry Potter",      emoji:"⚡", accent:"#fcd34d", dark:"#92400e", stars:true  },
};

// ── Types de rounds disponibles ──
const RT = [
  { id:"buzzer", name:"Buzzer Rapide",      icon:"⚡",  desc:"Le plus rapide à buzzer ET correct gagne +100 pts !" },
  { id:"steal",  name:"Vol de Points",      icon:"😈",  desc:"Buzzez ! Bonne réponse → volez 50 pts. Mauvaise → éliminé de la question." },
  { id:"chrono", name:"Contre la Montre",   icon:"⏱️",  desc:"Tout le monde répond en même temps. Classement par rapidité !" },
  { id:"carton", name:"Carton Rouge",       icon:"🟥",  desc:"Buzzez ! Bonne réponse → donnez un carton 🟨 ou 🟥. 2 cartons = éliminé." },
  { id:"patate", name:"Patate Chaude",      icon:"🥔",  desc:"Celui qui a la patate répond ! La patate explose… -50 pts !" },
  { id:"qcm",    name:"QCM Classique",      icon:"📝",  desc:"Tout le monde répond au même QCM. Bonne réponse = points." },
  { id:"orage",  name:"Orage de Points",    icon:"⚡",  desc:"60 secondes ! +500 à +1000 pts par bonne réponse. Mauvaise = -150 pts !" },
];

// ── Couleurs des joueurs ──
const COL = [
  { bg:"#ef4444", gw:"#ef444455" },
  { bg:"#3b82f6", gw:"#3b82f655" },
  { bg:"#22c55e", gw:"#22c55e55" },
  { bg:"#f59e0b", gw:"#f59e0b55" },
  { bg:"#a855f7", gw:"#a855f755" },
  { bg:"#ec4899", gw:"#ec489955" },
  { bg:"#14b8a6", gw:"#14b8a655" },
  { bg:"#f97316", gw:"#f9731655" },
];

// ── Labels des réponses ──
const LB = ["A", "B", "C", "D"];

// ── État global de la session ──
// Ces variables sont lues/écrites par game.js et ui.js
let ME   = "";     // prénom du joueur local
let CODE = "";     // code de la salle courante
let HOST = false;  // est-ce que je suis l'hôte ?
let STOP = null;   // fonction pour stopper le listener Firebase
let HTIMER = null; // timer de l'hôte (délai de réponse)
let I_BUZZED = false;         // ai-je déjà buzzé cette question ?
let lastAnswerKey = "";       // clé pour détecter les nouvelles réponses

// ── Configuration d'une partie en cours de création ──
let CD = { name:"", maxP:4, themes:[], rounds:[], elimR:2, cartonR:3 };
