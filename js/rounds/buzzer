/* ════════════════════════════════════════════
   rounds/buzzer.js — Buzzer Rapide
   Le premier à buzzer ET donner la bonne réponse
   gagne +100 pts. Mauvaise réponse → -50 pts.
   ════════════════════════════════════════════ */

async function roundBuzzer_process(room, gs, rQs, isOk) {
  const q = rQs[gs.roundIdx][gs.qIdx];
  const sc = [...gs.scores];
  const pIdx = gs.players.indexOf(gs.buzzed);

  const restartTimer = async (updGs) => {
    const tStart = Date.now();
    await fp(`rooms/${CODE}`, { "gameState/result":null, "gameState/timerStart":tStart, "gameState/timerDur":30 });
    HTIMER = setTimeout(async () => {
      const c2 = await fg(`rooms/${CODE}/gameState`);
      if (!c2 || c2.revealed) return;
      await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/result":{ msg:"⏱️ Temps écoulé !", pts:0, scorer:null } });
      setTimeout(() => hostNextQ(room, updGs || gs, rQs), 3000);
    }, 30000);
  };

  if (isOk) {
    sc[pIdx] += 100;
    await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/scores":sc, "gameState/result":{ msg:`✅ ${gs.buzzed} a bon ! +100 pts`, pts:100, scorer:gs.buzzed } });
    setTimeout(() => hostNextQ(room, gs, rQs), 2500);
  } else {
    sc[pIdx] = Math.max(0, sc[pIdx] - 50);
    const bo = [...(gs.buzzedOut || []), gs.buzzed];
    const remaining = gs.players.filter(p => !bo.includes(p) && !(gs.roundElim || []).includes(p));
    if (!remaining.length) {
      await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/scores":sc, "gameState/buzzedOut":bo, "gameState/result":{ msg:`❌ ${gs.buzzed} a raté ! Bonne réponse : ${q.a[q.c]}`, pts:-50, scorer:null } });
      setTimeout(() => hostNextQ(room, gs, rQs), 3000);
    } else {
      await fp(`rooms/${CODE}`, { "gameState/buzzed":null, "gameState/scores":sc, "gameState/buzzedOut":bo, "gameState/result":{ msg:`❌ ${gs.buzzed} a raté ! -50 pts. Rebuzz dans 3s !`, pts:-50, scorer:null } });
      setTimeout(async () => { await restartTimer({ ...gs, buzzedOut:bo, scores:sc }); }, 3000);
    }
  }
}
