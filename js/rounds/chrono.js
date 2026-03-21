/* ════════════════════════════════════════════
   rounds/chrono.js — Contre la Montre
   Tout le monde répond en même temps.
   Points attribués par ordre de rapidité.
   ════════════════════════════════════════════ */

async function roundChrono_start(room, gs, rQs) {
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
    await roundChrono_end(room, cur, rQs);
  }, 20000);
}

async function roundChrono_end(room, gs, rQs) {
  const q = rQs[gs.roundIdx][gs.qIdx];
  const ans = gs.answers || {};
  const sc = [...gs.scores];
  const correct = Object.entries(ans)
    .filter(([, { ansIdx }]) => ansIdx === q.c)
    .sort((a, b) => a[1].time - b[1].time);
  const PTS = [100, 70, 50, 30];
  let msg = "";
  if (!correct.length) {
    msg = "❌ Personne n'avait la bonne réponse !";
  } else {
    correct.forEach(([name], rank) => { sc[gs.players.indexOf(name)] += PTS[Math.min(rank, PTS.length - 1)]; });
    msg = "✅ " + correct.slice(0, 3).map(([name], i) => `${name} +${PTS[i]}pts`).join("  ");
  }
  await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/result":{ msg, pts:correct.length ? PTS[0] : 0, scorer:correct[0]?.[0] || null }, "gameState/scores":sc });
  setTimeout(() => hostNextQ(room, gs, rQs), 4000);
}
