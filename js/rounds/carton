/* ════════════════════════════════════════════
   rounds/carton.js — Carton Rouge
   Bonne réponse → donner un carton à quelqu'un.
   Mauvaise réponse → tu reçois un carton.
   2 cartons = éliminé de la manche.
   ════════════════════════════════════════════ */

async function roundCarton_process(room, gs, rQs, isOk) {
  const q = rQs[gs.roundIdx][gs.qIdx];
  const sc = [...gs.scores];
  const pIdx = gs.players.indexOf(gs.buzzed);
  const cartons = [...(gs.cartons || gs.players.map(() => 0))];
  const roundElim = [...(gs.roundElim || [])];
  const bo = [...(gs.buzzedOut || []), gs.buzzed];

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

  const checkLastStanding = async (newCartons, newElim, newSc) => {
    const alive = gs.players.filter(p => !newElim.includes(p));
    if (alive.length <= 1) {
      const surv = alive[0] || null;
      if (surv) { newSc[gs.players.indexOf(surv)] += 300; }
      const cm = gs.cartonManche || 0;
      const maxM = room.cartonR || 3;
      await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/scores":newSc, "gameState/cartons":newCartons, "gameState/roundElim":newElim, "gameState/result":{ msg:surv?`🏆 ${surv} remporte la manche ! +300 pts`:"Manche terminée !", pts:300, scorer:surv } });
      if (cm + 1 >= maxM) {
        setTimeout(() => hostNextQ(room, { ...gs, cartons:newCartons, roundElim:newElim, scores:newSc }, rQs), 3000);
      } else {
        setTimeout(async () => {
          await fp(`rooms/${CODE}`, { "gameState/cartonManche":cm+1, "gameState/cartons":gs.players.map(()=>0), "gameState/roundElim":[], "gameState/buzzed":null, "gameState/buzzedOut":[], "gameState/result":null });
          const cur = await fg(`rooms/${CODE}/gameState`);
          hostStartQ(room, { ...cur, cartonManche:cm+1, cartons:gs.players.map(()=>0), roundElim:[] }, rQs);
        }, 3000);
      }
      return true;
    }
    return false;
  };

  if (isOk) {
    await fp(`rooms/${CODE}`, { "gameState/pickTarget":true, "gameState/result":{ msg:`✅ ${gs.buzzed} a bon ! Donnez un carton à qui ? 🟨`, pts:0, scorer:gs.buzzed } });
  } else {
    cartons[pIdx] = Math.min(2, cartons[pIdx] + 1);
    const isRed = cartons[pIdx] === 2;
    if (isRed) roundElim.push(gs.buzzed);
    sc[pIdx] = Math.max(0, sc[pIdx] - (isRed ? 100 : 50));
    const msg = isRed ? `❌ ${gs.buzzed} a raté ! 🟥 Carton rouge — éliminé ! -100 pts` : `❌ ${gs.buzzed} a raté ! 🟨 Carton jaune — -50 pts`;
    await fp(`rooms/${CODE}`, { "gameState/cartons":cartons, "gameState/roundElim":roundElim, "gameState/scores":sc, "gameState/buzzed":null, "gameState/buzzedOut":bo, "gameState/result":{ msg, pts:isRed?-100:-50, scorer:null } });
    const done = await checkLastStanding(cartons, roundElim, sc);
    if (!done) {
      const remaining = gs.players.filter(p => !bo.includes(p) && !roundElim.includes(p));
      if (!remaining.length) {
        await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/result":{ msg:`Bonne réponse : ${q.a[q.c]}`, pts:0, scorer:null } });
        setTimeout(() => hostNextQ(room, { ...gs, cartons, roundElim, scores:sc }, rQs), 3000);
      } else {
        setTimeout(async () => { await restartTimer({ ...gs, cartons, roundElim, scores:sc, buzzedOut:bo }); }, 1200);
      }
    }
  }
}

async function roundCarton_pick(room, gs, rQs, targetName) {
  const sc = [...gs.scores];
  const tI = gs.players.indexOf(targetName), pI = gs.players.indexOf(gs.buzzed);
  const cartons = [...(gs.cartons || gs.players.map(() => 0))];
  cartons[tI] = Math.min(2, cartons[tI] + 1);
  const gotRed = cartons[tI] === 2;
  sc[tI] = Math.max(0, sc[tI] - (gotRed ? 100 : 50));
  sc[pI] += 50;
  const newRoundElim = gotRed ? [...(gs.roundElim || []), targetName] : [...(gs.roundElim || [])];
  const cardMsg = gotRed ? `🟥 CARTON ROUGE pour ${targetName} ! -100 pts → éliminé !` : `🟨 Carton jaune pour ${targetName} ! -50 pts`;
  const alive = gs.players.filter(p => !newRoundElim.includes(p));
  await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/pickTarget":false, "gameState/scores":sc, "gameState/cartons":cartons, "gameState/roundElim":newRoundElim, "gameState/result":{ msg:`${cardMsg} — ${gs.buzzed} +50 pts`, pts:50, scorer:gs.buzzed } });
  if (alive.length <= 1) {
    const surv = alive[0] || null;
    if (surv) { sc[gs.players.indexOf(surv)] += 300; await fp(`rooms/${CODE}`, { "gameState/scores":sc, "gameState/result":{ msg:`🏆 ${surv} remporte la manche ! +300 pts`, pts:300, scorer:surv } }); }
    const cm = gs.cartonManche || 0; const maxM = room.cartonR || 3;
    if (cm + 1 >= maxM) { setTimeout(() => hostNextQ(room, { ...gs, cartons, roundElim:newRoundElim, scores:sc }, rQs), 3500); }
    else { setTimeout(async () => { await fp(`rooms/${CODE}`, { "gameState/cartonManche":cm+1, "gameState/cartons":gs.players.map(()=>0), "gameState/roundElim":[], "gameState/buzzed":null, "gameState/buzzedOut":[], "gameState/result":null }); const cur = await fg(`rooms/${CODE}/gameState`); hostStartQ(room, { ...cur, cartonManche:cm+1, cartons:gs.players.map(()=>0), roundElim:[] }, rQs); }, 3500); }
  } else {
    setTimeout(() => hostNextQ(room, { ...gs, cartons, roundElim:newRoundElim, scores:sc }, rQs), 3000);
  }
}
