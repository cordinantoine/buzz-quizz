/* ════════════════════════════════════════════
   firebase.js — BUZZ! Quiz
   Contient : URL Firebase, helpers CRUD,
              listener temps réel (EventSource)
   Expose   : FB, genCode, fg, fs, fp, fd, fl
   ════════════════════════════════════════════ */

// ── URL de ta base Firebase ──
// Pour changer de projet Firebase, modifie uniquement cette ligne
const FB = "https://quiz-buzz-3-default-rtdb.europe-west1.firebasedatabase.app";

// ── Générateur de code de salle (5 caractères) ──
const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length:5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// ── GET : lire une valeur ──
async function fg(path) {
  try {
    const r = await fetch(`${FB}/${path}.json`);
    if (!r.ok) return null;
    const d = await r.json();
    return d !== null ? d : null;
  } catch(e) { return null; }
}

// ── SET : écrire (remplace toute la valeur) ──
async function fs(path, data) {
  try {
    const r = await fetch(`${FB}/${path}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return r.ok;
  } catch(e) { return false; }
}

// ── PATCH : mise à jour partielle (ne touche que les champs envoyés) ──
async function fp(path, data) {
  try {
    await fetch(`${FB}/${path}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch(e) {}
}

// ── DELETE : supprimer une valeur ──
async function fd(path) {
  try {
    await fetch(`${FB}/${path}.json`, { method: "DELETE" });
  } catch(e) {}
}

// ── LISTEN : écoute les changements en temps réel ──
// Utilise EventSource (SSE Firebase) avec fallback polling
// Retourne une fonction stop() pour arrêter l'écoute
function fl(path, callback) {
  let closed = false, iv = null, es = null, ok = false;

  const poll = () => {
    if (!closed) fg(path).then(d => { if (d !== null && !closed) callback(d); });
  };

  try {
    es = new EventSource(`${FB}/${path}.json`);

    es.addEventListener("put", e => {
      try {
        ok = true;
        if (iv) { clearInterval(iv); iv = null; }
        const x = JSON.parse(e.data);
        if (x.data !== null && !closed) callback(x.data);
      } catch(er) {}
    });

    es.addEventListener("patch", () => { if (!closed) poll(); });

    // Si SSE ne répond pas dans 3.5s → fallback polling
    setTimeout(() => { if (!ok && !closed) { iv = setInterval(poll, 1500); poll(); } }, 3500);
    es.onerror = () => { if (!ok && !iv && !closed) { iv = setInterval(poll, 1500); poll(); } };

  } catch(e) {
    // SSE non supporté → polling direct
    iv = setInterval(poll, 1500);
    poll();
  }

  // Retourne la fonction d'arrêt
  return () => {
    closed = true;
    if (es) es.close();
    if (iv) clearInterval(iv);
  };
}
