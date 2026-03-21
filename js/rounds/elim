/* ════════════════════════════════════════════
   rounds/elim.js — Élimination
   Bonne réponse → choisir qui éliminer.
   Mauvaise réponse → tu es éliminé de la manche.
   ════════════════════════════════════════════ */

async function roundElim_process(room, gs, rQs, isOk) {
  const q = rQs[gs.roundIdx][gs.qIdx];
  const sc = [...gs.scores];
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
    await fp(`rooms/${CODE}`, { "gameState/pickTarget":true, "gameState/result":{ msg:`✅ ${gs.buzzed} a bon ! Choisissez qui éliminer…`, pts:0, scorer:gs.buzzed } });
  } else {
    const rE = [...(gs.roundElim || []), gs.buzzed];
    const bo = [...(gs.buzzedOut || []), gs.buzzed];
    const alive = gs.players.filter(p => !rE.includes(p));
    if (alive.length <= 1) {
      const surv = alive[0] || null;
      if (surv) { sc[gs.players.indexOf(surv)] += 300; }
      await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/scores":sc, "gameState/roundElim":rE, "gameState/buzzedOut":bo, "gameState/result":{ msg:surv?`🏆 ${surv} dernier survivant ! +300 pts`:"Tout le monde éliminé !", pts:surv?300:0, scorer:surv } });
      setTimeout(() => hostNextQ(room, { ...gs, roundElim:rE }, rQs), 3000);
    } else {
      const remaining = alive.filter(p => !bo.includes(p));
      if (!remaining.length) {
        await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/roundElim":rE, "gameState/buzzedOut":bo, "gameState/result":{ msg:`❌ ${gs.buzzed} éliminé ! Bonne réponse : ${q.a[q.c]}`, pts:0, scorer:null } });
        setTimeout(() => hostNextQ(room, { ...gs, roundElim:rE }, rQs), 3000);
      } else {
        await fp(`rooms/${CODE}`, { "gameState/buzzed":null, "gameState/roundElim":rE, "gameState/buzzedOut":bo, "gameState/result":{ msg:`❌ ${gs.buzzed} a raté et est éliminé de la manche !`, pts:0, scorer:null } });
        setTimeout(async () => { await restartTimer({ ...gs, roundElim:rE, buzzedOut:bo }); }, 600);
      }
    }
  }
}

async function roundElim_pick(room, gs, rQs, targetName) {
  const sc = [...gs.scores];
  const pI = gs.players.indexOf(gs.buzzed);
  sc[pI] += 100;
  const rE = [...(gs.roundElim || []), targetName];
  const alive = gs.players.filter(p => !rE.includes(p));
  await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/pickTarget":false, "gameState/scores":sc, "gameState/roundElim":rE, "gameState/result":{ msg:`💀 ${gs.buzzed} élimine ${targetName} ! +100 pts`, pts:100, scorer:gs.buzzed } });
  if (alive.length <= 1) {
    const surv = alive[0] || null;
    if (surv) { sc[gs.players.indexOf(surv)] += 300; await fp(`rooms/${CODE}`, { "gameState/scores":sc, "gameState/result":{ msg:`🏆 ${surv} dernier survivant ! +300 pts`, pts:300, scorer:surv } }); }
    setTimeout(() => hostNextQ(room, { ...gs, roundElim:rE }, rQs), 3500);
  } else {
    setTimeout(() => hostNextQ(room, { ...gs, roundElim:rE }, rQs), 3000);
  }
}
