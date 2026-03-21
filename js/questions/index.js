/* ════════════════════════════════════════════
   questions/index.js — Initialiseur
   Doit être chargé AVANT les fichiers de thèmes.
   Initialise l'objet QUESTIONS vide et USED_QS,
   puis expose getStaticQs() utilisé par game.js.
   ════════════════════════════════════════════ */

// Objet global rempli par chaque fichier de thème
const QUESTIONS = {};

// Questions déjà posées dans la partie en cours
let USED_QS = new Set();

// ── Pioche aléatoire ──
// themeIds : ex ["culture", "sport"]
// count    : nombre de questions à piocher
function getStaticQs(themeIds, count) {
  if (!Array.isArray(themeIds) || !themeIds.length) themeIds = ["culture"];

  let pool = [];
  themeIds.forEach(tid => {
    const qs = (QUESTIONS[tid] || []).filter(q => !USED_QS.has(q.q));
    pool = pool.concat(qs);
  });
  pool.sort(() => Math.random() - .5);

  // Pas assez de questions → reset et recommence
  if (pool.length < count) {
    themeIds.forEach(tid => { (QUESTIONS[tid] || []).forEach(q => USED_QS.delete(q.q)); });
    pool = [];
    themeIds.forEach(tid => { pool = pool.concat(QUESTIONS[tid] || []); });
    pool.sort(() => Math.random() - .5);
  }

  pool.slice(0, count).forEach(q => USED_QS.add(q.q));
  return pool.slice(0, count);
}
