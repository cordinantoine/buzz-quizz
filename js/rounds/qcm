/* ════════════════════════════════════════════
   rounds/qcm.js — QCM Classique
   Tout le monde répond, 20s chrono.
   Bonne réponse = +200 pts.
   ════════════════════════════════════════════ */

async function roundQCM_start(room, gs, rQs) {
  await fp(`rooms/${CODE}`, {
    "gameState/phase":"question", "gameState/buzzed":null, "gameState/buzzedOut":[],
    "gameState/answers":{}, "gameState/revealed":false, "gameState/result":null,
    "gameState/pickTarget":false, "gameState/hostPick":null,
    "gameState/timerStart":Date.now(), "gameState/timerDur":20
  });
  if (HTIMER) clearTimeout(HTIMER);
  HTIMER = setTimeout(async () => {
    const cur = await fg(`rooms/${CODE}/gameState`);
    if (!cur || cur.revealed || cur.phase !== "question") return;
    await roundQCM_end(room, cur, rQs);
  }, 20000);
}

async function roundQCM_end(room, gs, rQs) {
  const q = rQs[gs.roundIdx][gs.qIdx];
  const ans = gs.answers || {};
  const sc = [...gs.scores];
  const correct = [];
  gs.players.forEach((p, i) => { if (ans[p] !== undefined && ans[p].ansIdx === q.c) { sc[i] += 200; correct.push(p); } });
  const msg = correct.length
    ? `✅ Bonne réponse : ${q.a[q.c]} — ${correct.join(", ")} marquent +200 pts !`
    : `❌ Personne ! Bonne réponse : ${q.a[q.c]}`;
  await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/result":{ msg, pts:200, scorer:correct[0] || null }, "gameState/scores":sc });
  setTimeout(() => hostNextQ(room, gs, rQs), 3000);
}
