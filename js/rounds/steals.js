/* ════════════════════════════════════════════
   rounds/steal.js — Vol de Points
   Bonne réponse → choisir qui vous volez (50 pts).
   Mauvaise réponse → éliminé de la question.
   ════════════════════════════════════════════ */

async function roundSteal_process(room, gs, rQs, isOk) {
  const q = rQs[gs.roundIdx][gs.qIdx];
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
    await fp(`rooms/${CODE}`, { "gameState/pickTarget":true, "gameState/result":{ msg:`✅ ${gs.buzzed} a bon ! Choisissez qui vous volez…`, pts:0, scorer:gs.buzzed } });
  } else {
    const bo = [...(gs.buzzedOut || []), gs.buzzed];
    const remaining = gs.players.filter(p => !bo.includes(p) && !(gs.roundElim || []).includes(p));
    if (!remaining.length) {
      await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/buzzedOut":bo, "gameState/result":{ msg:`❌ ${gs.buzzed} a raté. Bonne réponse : ${q.a[q.c]}`, pts:0, scorer:null } });
      setTimeout(() => hostNextQ(room, gs, rQs), 3000);
    } else {
      await fp(`rooms/${CODE}`, { "gameState/buzzed":null, "gameState/buzzedOut":bo, "gameState/result":{ msg:`❌ ${gs.buzzed} a raté ! Éliminé de la question.`, pts:0, scorer:null } });
      setTimeout(async () => { await restartTimer({ ...gs, buzzedOut:bo }); }, 600);
    }
  }
}

async function roundSteal_pick(room, gs, rQs, targetName) {
  const sc = [...gs.scores];
  const tI = gs.players.indexOf(targetName), pI = gs.players.indexOf(gs.buzzed);
  const stolen = Math.min(50, sc[tI]);
  sc[pI] += stolen; sc[tI] = Math.max(0, sc[tI] - stolen);
  await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/pickTarget":false, "gameState/scores":sc, "gameState/result":{ msg:`😈 ${gs.buzzed} vole ${stolen} pts à ${targetName} !`, pts:stolen, scorer:gs.buzzed } });
  setTimeout(() => hostNextQ(room, gs, rQs), 3000);
}
