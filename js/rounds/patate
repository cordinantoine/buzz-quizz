/* ════════════════════════════════════════════
   rounds/patate.js — Patate Chaude
   Celui qui a la patate doit répondre.
   Bonne réponse → passe la patate.
   La patate explose aléatoirement → -50 pts + éliminé.
   ════════════════════════════════════════════ */

async function roundPatate_process(room, gs, rQs, isOk) {
  const alive = gs.players.filter(p => !(gs.roundElim || []).includes(p));

  if (isOk) {
    const others = alive.filter(p => p !== gs.buzzed);
    const newHolder = others.length ? others[Math.floor(Math.random() * others.length)] : gs.buzzed;
    await fp(`rooms/${CODE}`, { "gameState/patateHolder":newHolder, "gameState/result":{ msg:`✅ ${gs.buzzed} passe la patate à ${newHolder} ! 🥔`, pts:0, scorer:gs.buzzed }, "gameState/buzzed":null, "gameState/answers":{}, "gameState/buzzedOut":[] });
    setTimeout(async () => {
      const cur = await fg(`rooms/${CODE}/gameState`); if (!cur || cur.revealed) return;
      await fp(`rooms/${CODE}`, { "gameState/result":null });
      const qIdx = cur.qIdx + 1;
      if (qIdx >= (rQs[cur.roundIdx] || []).length) {
        await fp(`rooms/${CODE}`, { "gameState/qIdx":0, "gameState/answers":{}, "gameState/buzzed":null, "gameState/revealed":false, "gameState/buzzedOut":[] });
      } else {
        await fp(`rooms/${CODE}`, { "gameState/qIdx":qIdx, "gameState/answers":{}, "gameState/buzzed":null, "gameState/revealed":false, "gameState/buzzedOut":[] });
      }
    }, 1500);
  } else {
    await fp(`rooms/${CODE}`, { "gameState/result":{ msg:`❌ ${gs.buzzed} a raté ! La patate reste ! 🥔`, pts:0, scorer:null }, "gameState/buzzed":null, "gameState/answers":{}, "gameState/buzzedOut":[] });
    setTimeout(async () => {
      const cur = await fg(`rooms/${CODE}/gameState`); if (!cur || cur.revealed) return;
      await fp(`rooms/${CODE}`, { "gameState/result":null });
      const qIdx = cur.qIdx + 1;
      if (qIdx >= (rQs[cur.roundIdx] || []).length) {
        await fp(`rooms/${CODE}`, { "gameState/qIdx":0, "gameState/answers":{}, "gameState/buzzed":null, "gameState/revealed":false, "gameState/buzzedOut":[] });
      } else {
        await fp(`rooms/${CODE}`, { "gameState/qIdx":qIdx, "gameState/answers":{}, "gameState/buzzed":null, "gameState/revealed":false, "gameState/buzzedOut":[] });
      }
    }, 1500);
  }
}
