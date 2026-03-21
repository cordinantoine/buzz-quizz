/* ════════════════════════════════════════════
   game.js — BUZZ! Quiz
   Contient : toute la logique du jeu
     - hostLoadQ    → charge et distribue les questions
     - hostStartQ   → démarre une question selon le type de round
     - hostNextQ    → passe à la question suivante
     - hostProcess* → évalue les réponses et attribue les points
     - actBuzz      → action "buzzer" d'un joueur
     - actAnswer    → action "répondre" d'un joueur
     - actPick      → action "choisir une cible" d'un joueur
     - Watch        → écoute Firebase et dispatche vers l'UI

   Dépend de : config.js, firebase.js, questions.js, ui.js
   ════════════════════════════════════════════ */

// ── Chargement et synchronisation des questions (hôte uniquement) ──
async function hostLoadQ() {
  USED_QS = new Set();
  const room = await fg(`rooms/${CODE}`);
  if (!room) return;
  const themes = room.themes && room.themes.length ? room.themes : [room.theme || "culture"];
  const rQs = {};
  room.rounds.forEach((r, i) => {
    const count = r === "elim" ? Math.max(room.elimR, 3) : 8;
    rQs[i] = getStaticQs(themes, count);
  });
  const gs = {
    phase:"roundIntro", roundIdx:0, qIdx:0, elimManche:0,
    rQs, players:room.players.map(p => p.name), scores:room.players.map(() => 0),
    lives:room.players.map(() => 3),
    cartons:room.players.map(() => 0),
    cartonManche:0, patateHolder:null, orageStart:null, patateExplodeAt:null,
    roundElim:[], buzzed:null, buzzedOut:[], answers:{},
    revealed:false, result:null, pickTarget:false,
    timerStart:Date.now() + 4000, timerDur:null, hostPick:null
  };
  await fs(`rooms/${CODE}/gameState`, gs);
  await fp(`rooms/${CODE}`, { phase:"playing", questionsReady:true });
  Watch({ ...room, phase:"playing", questionsReady:true, gameState:gs });
  setTimeout(() => hostStartQ(room, gs, rQs), 4000);
}

// ── Démarre une question selon le type de round ──
async function hostStartQ(room, gs, rQs) {
  I_BUZZED = false; lastAnswerKey = "";
  const rType = room.rounds[gs.roundIdx];
  const tDur  = rType === "chrono" ? 20 : 30;
  const tStart = Date.now();

  if (rType === "qcm") {
    await fp(`rooms/${CODE}`, { "gameState/phase":"question","gameState/buzzed":null,"gameState/buzzedOut":[],"gameState/answers":{},"gameState/revealed":false,"gameState/result":null,"gameState/pickTarget":false,"gameState/hostPick":null,"gameState/timerStart":Date.now(),"gameState/timerDur":20 });
    if (HTIMER) clearTimeout(HTIMER);
    HTIMER = setTimeout(async () => { const cur = await fg(`rooms/${CODE}/gameState`); if (!cur || cur.revealed || cur.phase !== "question") return; await hostQCMEnd(room, cur, rQs); }, 20000);
    return;
  }

  if (rType === "orage") {
    const orageStart   = gs.orageStart || Date.now();
    const orageElapsed = Date.now() - orageStart;
    if (orageElapsed >= 60000) { await fp(`rooms/${CODE}`, { "gameState/phase":"question","gameState/revealed":true,"gameState/result":{ msg:"⏱️ 60 secondes écoulées ! Fin de l'orage !",pts:0,scorer:null } }); setTimeout(() => hostNextQ(room, { ...gs, orageStart }, rQs), 3000); return; }
    await fp(`rooms/${CODE}`, { "gameState/phase":"question","gameState/buzzed":null,"gameState/buzzedOut":[],"gameState/answers":{},"gameState/revealed":false,"gameState/result":null,"gameState/pickTarget":false,"gameState/hostPick":null,"gameState/timerStart":Date.now(),"gameState/timerDur":15,"gameState/orageStart":orageStart });
    if (HTIMER) clearTimeout(HTIMER);
    HTIMER = setTimeout(async () => { const cur = await fg(`rooms/${CODE}/gameState`); if (!cur || cur.revealed || cur.phase !== "question") return; await hostOrageEnd(room, cur, rQs); }, 15000);
    return;
  }

  if (rType === "patate") {
    const alive = gs.players.filter(p => !(gs.roundElim || []).includes(p));
    if (alive.length <= 1) { const surv = alive[0] || null; const sc = [...gs.scores]; if (surv) sc[gs.players.indexOf(surv)] += 500; await fp(`rooms/${CODE}`, { "gameState/phase":"question","gameState/revealed":true,"gameState/scores":sc,"gameState/result":{ msg:surv ? `🏆 ${surv} est le dernier survivant ! +500 pts` : "Fin de la manche !",pts:500,scorer:surv } }); setTimeout(() => hostNextQ(room, { ...gs, scores:sc }, rQs), 3500); return; }
    let holder     = gs.patateHolder && alive.includes(gs.patateHolder) ? gs.patateHolder : alive[Math.floor(Math.random() * alive.length)];
    let explodeAt  = gs.patateExplodeAt;
    const isNewManche = !explodeAt || explodeAt <= Date.now();
    if (isNewManche) { const delay = Math.floor(Math.random() * 31 + 15) * 1000; explodeAt = Date.now() + delay; }
    const timeUntilBoom = Math.max(0, explodeAt - Date.now());
    await fp(`rooms/${CODE}`, { "gameState/phase":"question","gameState/buzzed":null,"gameState/buzzedOut":[],"gameState/answers":{},"gameState/revealed":false,"gameState/result":null,"gameState/pickTarget":false,"gameState/hostPick":null,"gameState/timerStart":tStart,"gameState/timerDur":30,"gameState/patateHolder":holder,"gameState/patateExplodeAt":explodeAt });
    if (HTIMER) clearTimeout(HTIMER);
    HTIMER = setTimeout(async () => {
      const cur = await fg(`rooms/${CODE}/gameState`); if (!cur || cur.revealed || cur.phase !== "question") return;
      const sc = [...cur.scores]; const loser = cur.patateHolder; const hi = cur.players.indexOf(loser);
      if (hi >= 0) sc[hi] = Math.max(0, sc[hi] - 50);
      const newRoundElim = [...(cur.roundElim || []), loser]; const stillAlive = cur.players.filter(p => !newRoundElim.includes(p));
      await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/scores":sc,"gameState/roundElim":newRoundElim,"gameState/patateExplodeAt":null,"gameState/result":{ msg:`💥 BOOM ! ${loser} explose ! -50 pts — Éliminé !`,pts:-50,scorer:loser } });
      if (stillAlive.length <= 1) { const surv = stillAlive[0] || null; if (surv) { sc[cur.players.indexOf(surv)] += 500; await fp(`rooms/${CODE}`, { "gameState/scores":sc,"gameState/result":{ msg:`🏆 ${surv} est le dernier survivant ! +500 pts`,pts:500,scorer:surv } }); } setTimeout(() => hostNextQ(room, { ...cur, scores:sc, roundElim:newRoundElim, patateExplodeAt:null }, rQs), 3500); }
      else { setTimeout(async () => { const updGs = await fg(`rooms/${CODE}/gameState`); if (!updGs) return; const survivors = updGs.players.filter(p => !newRoundElim.includes(p)); const newHolder = survivors[Math.floor(Math.random() * survivors.length)]; await fp(`rooms/${CODE}`, { "gameState/patateHolder":newHolder,"gameState/patateExplodeAt":null,"gameState/result":null,"gameState/revealed":false,"gameState/buzzed":null,"gameState/answers":{},"gameState/buzzedOut":[] }); const freshGs = await fg(`rooms/${CODE}/gameState`); hostStartQ(room, { ...freshGs, roundElim:newRoundElim, patateHolder:newHolder, patateExplodeAt:null }, rQs); }, 3500); }
    }, timeUntilBoom);
    return;
  }

  await fp(`rooms/${CODE}`, { "gameState/phase":"question","gameState/buzzed":null,"gameState/buzzedOut":[],"gameState/answers":{},"gameState/revealed":false,"gameState/result":null,"gameState/pickTarget":false,"gameState/hostPick":null,"gameState/timerStart":tStart,"gameState/timerDur":tDur });
  if (HTIMER) clearTimeout(HTIMER);
  HTIMER = setTimeout(async () => { const cur = await fg(`rooms/${CODE}/gameState`); if (!cur || cur.revealed || cur.phase !== "question") return; if (rType === "chrono") await hostChronoEnd(room, cur, rQs); else { await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/result":{ msg:"⏱️ Temps écoulé !",pts:0,scorer:null } }); setTimeout(() => hostNextQ(room, cur, rQs), 3000); } }, tDur * 1000);
}

// ── Fin du chrono : classe les réponses par rapidité ──
async function hostChronoEnd(room, gs, rQs) {
  const q = rQs[gs.roundIdx][gs.qIdx]; const ans = gs.answers || {}; const sc = [...gs.scores];
  const correct = Object.entries(ans).filter(([, { ansIdx }]) => ansIdx === q.c).sort((a, b) => a[1].time - b[1].time);
  const PTS = [100, 70, 50, 30]; let msg = "";
  if (!correct.length) { msg = "❌ Personne n'avait la bonne réponse !"; }
  else { correct.forEach(([name], rank) => { sc[gs.players.indexOf(name)] += PTS[Math.min(rank, PTS.length - 1)]; }); msg = "✅ " + correct.slice(0, 3).map(([name], i) => `${name} +${PTS[i]}pts`).join("  "); }
  await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/result":{ msg,pts:correct.length ? PTS[0] : 0,scorer:correct[0]?.[0] || null },"gameState/scores":sc });
  setTimeout(() => hostNextQ(room, gs, rQs), 4000);
}

// ── Passe à la prochaine question (ou prochain round, ou fin) ──
async function hostNextQ(room, gs, rQs) {
  I_BUZZED = false; lastAnswerKey = "";
  const rType = room.rounds[gs.roundIdx];
  let qIdx = gs.qIdx, rIdx = gs.roundIdx, eM = gs.elimManche || 0, rE = gs.roundElim || [];
  if (rType === "elim") { eM++; rE = []; if (eM < room.elimR) { await fp(`rooms/${CODE}`, { "gameState/elimManche":eM,"gameState/roundElim":[] }); const c2 = await fg(`rooms/${CODE}/gameState`); hostStartQ(room, { ...c2, elimManche:eM, roundElim:[] }, rQs); return; } else { eM = 0; rE = []; qIdx++; } }
  else qIdx++;
  if (qIdx >= (rQs[rIdx] || []).length) {
    rIdx++; qIdx = 0; eM = 0; rE = [];
    if (rIdx >= room.rounds.length) { await fp(`rooms/${CODE}`, { "gameState/phase":"final","gameState/scores":gs.scores }); return; }
    await fp(`rooms/${CODE}`, { "gameState/phase":"scoreboard","gameState/roundIdx":rIdx,"gameState/qIdx":0,"gameState/elimManche":0,"gameState/roundElim":[] });
    setTimeout(async () => { await fp(`rooms/${CODE}`, { "gameState/phase":"roundIntro" }); setTimeout(async () => { const cur = await fg(`rooms/${CODE}/gameState`); hostStartQ(room, { ...cur, roundIdx:rIdx, qIdx:0, elimManche:0, roundElim:[] }, rQs); }, 4000); }, 5000);
    return;
  }
  await fp(`rooms/${CODE}`, { "gameState/qIdx":qIdx,"gameState/elimManche":eM,"gameState/roundElim":rE });
  const cur = await fg(`rooms/${CODE}/gameState`);
  hostStartQ(room, { ...cur, qIdx, elimManche:eM, roundElim:rE }, rQs);
}

// ── Fin QCM : tout le monde a répondu ou timer ──
async function hostQCMEnd(room, gs, rQs) {
  const q = rQs[gs.roundIdx][gs.qIdx]; const ans = gs.answers || {}; const sc = [...gs.scores]; const correct = [];
  gs.players.forEach((p, i) => { if (ans[p] !== undefined && ans[p].ansIdx === q.c) { sc[i] += 200; correct.push(p); } });
  const msg = correct.length ? `✅ Bonne réponse : ${q.a[q.c]} — ${correct.join(", ")} marquent +200 pts !` : `❌ Personne ! Bonne réponse : ${q.a[q.c]}`;
  await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/result":{ msg,pts:200,scorer:correct[0] || null },"gameState/scores":sc });
  setTimeout(() => hostNextQ(room, gs, rQs), 3000);
}

// ── Fin Orage : points massifs + pénalités ──
async function hostOrageEnd(room, gs, rQs) {
  const q = rQs[gs.roundIdx][gs.qIdx]; const ans = gs.answers || {}; const sc = [...gs.scores];
  const correct = Object.entries(ans).filter(([, { ansIdx }]) => ansIdx === q.c).sort((a, b) => a[1].time - b[1].time);
  const wrong   = Object.entries(ans).filter(([, { ansIdx }]) => ansIdx !== q.c);
  correct.forEach(([name], rank) => { const pi = gs.players.indexOf(name); const base = rank===0?1000:rank===1?750:500; const speed = rank===0?500:rank===1?300:rank===2?200:0; sc[pi] += (base + speed); });
  wrong.forEach(([name]) => { const pi = gs.players.indexOf(name); sc[pi] = Math.max(0, sc[pi] - 150); });
  const topMsg = correct.length ? correct.slice(0, 2).map(([n], i) => `${n} +${i===0?1500:i===1?1050:500}pts`).join(", ") : "Personne !";
  await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/result":{ msg:`⚡ ${topMsg}`,pts:correct.length?1500:0,scorer:correct[0]?.[0] || null },"gameState/scores":sc });
  setTimeout(async () => { const cur = await fg(`rooms/${CODE}/gameState`); if (!cur) return; const orageElapsed = Date.now() - (cur.orageStart || Date.now()); if (orageElapsed >= 60000) { await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/result":{ msg:"🌩️ Fin de l'orage de points !",pts:0,scorer:null } }); setTimeout(() => hostNextQ(room, cur, rQs), 2000); } else { const qIdx = cur.qIdx + 1; if (qIdx >= (rQs[cur.roundIdx] || []).length) { hostNextQ(room, cur, rQs); } else { await fp(`rooms/${CODE}`, { "gameState/qIdx":qIdx,"gameState/result":null }); const updated = await fg(`rooms/${CODE}/gameState`); hostStartQ(room, { ...updated, qIdx }, rQs); } } }, 1500);
}

// ── Traitement d'une réponse après buzz ──
async function hostProcessAnswer(room, gs, rQs, isOk) {
  const rType = room.rounds[gs.roundIdx]; const q = rQs[gs.roundIdx][gs.qIdx]; const sc = [...gs.scores]; const pIdx = gs.players.indexOf(gs.buzzed);
  if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; }
  const restartBuzzTimer = async (updGs) => { const tStart = Date.now(); await fp(`rooms/${CODE}`, { "gameState/result":null,"gameState/timerStart":tStart,"gameState/timerDur":30 }); HTIMER = setTimeout(async () => { const c2 = await fg(`rooms/${CODE}/gameState`); if (!c2 || c2.revealed) return; await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/result":{ msg:"⏱️ Temps écoulé !",pts:0,scorer:null } }); setTimeout(() => hostNextQ(room, updGs || gs, rQs), 3000); }, 30000); };

  if (rType === "buzzer") {
    if (isOk) { sc[pIdx] += 100; await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/scores":sc,"gameState/result":{ msg:`✅ ${gs.buzzed} a bon ! +100 pts`,pts:100,scorer:gs.buzzed } }); setTimeout(() => hostNextQ(room, gs, rQs), 2500); }
    else { sc[pIdx] = Math.max(0, sc[pIdx] - 50); const bo = [...(gs.buzzedOut || []), gs.buzzed]; const remaining = gs.players.filter(p => !bo.includes(p) && !(gs.roundElim || []).includes(p)); if (!remaining.length) { await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/scores":sc,"gameState/buzzedOut":bo,"gameState/result":{ msg:`❌ ${gs.buzzed} a raté ! Bonne réponse : ${q.a[q.c]}`,pts:-50,scorer:null } }); setTimeout(() => hostNextQ(room, gs, rQs), 3000); } else { await fp(`rooms/${CODE}`, { "gameState/buzzed":null,"gameState/scores":sc,"gameState/buzzedOut":bo,"gameState/result":{ msg:`❌ ${gs.buzzed} a raté ! -50 pts. Rebuzz dans 3s !`,pts:-50,scorer:null } }); setTimeout(async () => { await restartBuzzTimer({ ...gs, buzzedOut:bo, scores:sc }); }, 3000); } }
  } else if (rType === "steal") {
    if (isOk) { await fp(`rooms/${CODE}`, { "gameState/pickTarget":true,"gameState/result":{ msg:`✅ ${gs.buzzed} a bon ! Choisissez qui vous volez…`,pts:0,scorer:gs.buzzed } }); }
    else { const bo = [...(gs.buzzedOut || []), gs.buzzed]; const remaining = gs.players.filter(p => !bo.includes(p) && !(gs.roundElim || []).includes(p)); if (!remaining.length) { await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/buzzedOut":bo,"gameState/result":{ msg:`❌ ${gs.buzzed} a raté. Bonne réponse : ${q.a[q.c]}`,pts:0,scorer:null } }); setTimeout(() => hostNextQ(room, gs, rQs), 3000); } else { await fp(`rooms/${CODE}`, { "gameState/buzzed":null,"gameState/buzzedOut":bo,"gameState/result":{ msg:`❌ ${gs.buzzed} a raté ! Éliminé de la question.`,pts:0,scorer:null } }); setTimeout(async () => { await restartBuzzTimer({ ...gs, buzzedOut:bo }); }, 600); } }
  } else if (rType === "elim") {
    if (isOk) { await fp(`rooms/${CODE}`, { "gameState/pickTarget":true,"gameState/result":{ msg:`✅ ${gs.buzzed} a bon ! Choisissez qui éliminer…`,pts:0,scorer:gs.buzzed } }); }
    else { const rE = [...(gs.roundElim || []), gs.buzzed]; const bo = [...(gs.buzzedOut || []), gs.buzzed]; const alive = gs.players.filter(p => !rE.includes(p)); if (alive.length <= 1) { const surv = alive[0] || null; if (surv) { sc[gs.players.indexOf(surv)] += 300; } await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/scores":sc,"gameState/roundElim":rE,"gameState/buzzedOut":bo,"gameState/result":{ msg:surv?`🏆 ${surv} dernier survivant ! +300 pts`:"Tout le monde éliminé !",pts:surv?300:0,scorer:surv } }); setTimeout(() => hostNextQ(room, { ...gs, roundElim:rE }, rQs), 3000); } else { const remaining = alive.filter(p => !bo.includes(p)); if (!remaining.length) { await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/roundElim":rE,"gameState/buzzedOut":bo,"gameState/result":{ msg:`❌ ${gs.buzzed} éliminé ! Bonne réponse : ${q.a[q.c]}`,pts:0,scorer:null } }); setTimeout(() => hostNextQ(room, { ...gs, roundElim:rE }, rQs), 3000); } else { await fp(`rooms/${CODE}`, { "gameState/buzzed":null,"gameState/roundElim":rE,"gameState/buzzedOut":bo,"gameState/result":{ msg:`❌ ${gs.buzzed} a raté et est éliminé de la manche !`,pts:0,scorer:null } }); setTimeout(async () => { await restartBuzzTimer({ ...gs, roundElim:rE, buzzedOut:bo }); }, 600); } } }
  } else if (rType === "patate") {
    const alive = gs.players.filter(p => !(gs.roundElim || []).includes(p));
    if (isOk) { const others = alive.filter(p => p !== gs.buzzed); const newHolder = others.length ? others[Math.floor(Math.random() * others.length)] : gs.buzzed; await fp(`rooms/${CODE}`, { "gameState/patateHolder":newHolder,"gameState/result":{ msg:`✅ ${gs.buzzed} passe la patate à ${newHolder} ! 🥔`,pts:0,scorer:gs.buzzed },"gameState/buzzed":null,"gameState/answers":{},"gameState/buzzedOut":[] }); setTimeout(async () => { const cur = await fg(`rooms/${CODE}/gameState`); if (!cur || cur.revealed) return; await fp(`rooms/${CODE}`, { "gameState/result":null }); const qIdx = cur.qIdx + 1; if (qIdx >= (rQs[cur.roundIdx] || []).length) { await fp(`rooms/${CODE}`, { "gameState/qIdx":0,"gameState/answers":{},"gameState/buzzed":null,"gameState/revealed":false,"gameState/buzzedOut":[] }); } else { await fp(`rooms/${CODE}`, { "gameState/qIdx":qIdx,"gameState/answers":{},"gameState/buzzed":null,"gameState/revealed":false,"gameState/buzzedOut":[] }); } }, 1500); }
    else { await fp(`rooms/${CODE}`, { "gameState/result":{ msg:`❌ ${gs.buzzed} a raté ! La patate reste ! 🥔`,pts:0,scorer:null },"gameState/buzzed":null,"gameState/answers":{},"gameState/buzzedOut":[] }); setTimeout(async () => { const cur = await fg(`rooms/${CODE}/gameState`); if (!cur || cur.revealed) return; await fp(`rooms/${CODE}`, { "gameState/result":null }); const qIdx = cur.qIdx + 1; if (qIdx >= (rQs[cur.roundIdx] || []).length) { await fp(`rooms/${CODE}`, { "gameState/qIdx":0,"gameState/answers":{},"gameState/buzzed":null,"gameState/revealed":false,"gameState/buzzedOut":[] }); } else { await fp(`rooms/${CODE}`, { "gameState/qIdx":qIdx,"gameState/answers":{},"gameState/buzzed":null,"gameState/revealed":false,"gameState/buzzedOut":[] }); } }, 1500); }
    return;
  } else if (rType === "carton") {
    const cartons = [...(gs.cartons || gs.players.map(() => 0))]; const roundElim = [...(gs.roundElim || [])]; const bo = [...(gs.buzzedOut || []), gs.buzzed];
    const checkLastStanding = async (newCartons, newElim, newSc) => { const alive = gs.players.filter(p => !newElim.includes(p)); if (alive.length <= 1) { const surv = alive[0] || null; if (surv) { newSc[gs.players.indexOf(surv)] += 300; } const cm = (gs.cartonManche || 0); const maxM = room.cartonR || 3; await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/scores":newSc,"gameState/cartons":newCartons,"gameState/roundElim":newElim,"gameState/result":{ msg:surv?`🏆 ${surv} remporte la manche ! +300 pts`:"Manche terminée !",pts:300,scorer:surv } }); if (cm + 1 >= maxM) { setTimeout(() => hostNextQ(room, { ...gs, cartons:newCartons, roundElim:newElim, scores:newSc }, rQs), 3000); } else { setTimeout(async () => { await fp(`rooms/${CODE}`, { "gameState/cartonManche":cm+1,"gameState/cartons":gs.players.map(()=>0),"gameState/roundElim":[],"gameState/buzzed":null,"gameState/buzzedOut":[],"gameState/result":null }); const cur = await fg(`rooms/${CODE}/gameState`); hostStartQ(room, { ...cur, cartonManche:cm+1, cartons:gs.players.map(()=>0), roundElim:[] }, rQs); }, 3000); } return true; } return false; };
    if (isOk) { await fp(`rooms/${CODE}`, { "gameState/pickTarget":true,"gameState/result":{ msg:`✅ ${gs.buzzed} a bon ! Donnez un carton à qui ? 🟨`,pts:0,scorer:gs.buzzed } }); }
    else { cartons[pIdx] = Math.min(2, cartons[pIdx] + 1); const isRed = cartons[pIdx] === 2; if (isRed) roundElim.push(gs.buzzed); sc[pIdx] = Math.max(0, sc[pIdx] - (isRed ? 100 : 50)); const msg = isRed ? `❌ ${gs.buzzed} a raté ! 🟥 Carton rouge — éliminé ! -100 pts` : `❌ ${gs.buzzed} a raté ! 🟨 Carton jaune — -50 pts`; await fp(`rooms/${CODE}`, { "gameState/cartons":cartons,"gameState/roundElim":roundElim,"gameState/scores":sc,"gameState/buzzed":null,"gameState/buzzedOut":bo,"gameState/result":{ msg,pts:isRed?-100:-50,scorer:null } }); const done = await checkLastStanding(cartons, roundElim, sc); if (!done) { const remaining = gs.players.filter(p => !bo.includes(p) && !roundElim.includes(p)); if (!remaining.length) { await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/result":{ msg:`Bonne réponse : ${q.a[q.c]}`,pts:0,scorer:null } }); setTimeout(() => hostNextQ(room, { ...gs, cartons, roundElim, scores:sc }, rQs), 3000); } else { setTimeout(async () => { await restartBuzzTimer({ ...gs, cartons, roundElim, scores:sc, buzzedOut:bo }); }, 1200); } } }
  }
}

// ── Traitement du choix de cible (steal / elim / carton) ──
async function hostPickTarget(room, gs, rQs, targetName) {
  const rType = room.rounds[gs.roundIdx]; const sc = [...gs.scores]; const tI = gs.players.indexOf(targetName), pI = gs.players.indexOf(gs.buzzed);
  if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; }
  if (rType === "steal") { const stolen = Math.min(50, sc[tI]); sc[pI] += stolen; sc[tI] = Math.max(0, sc[tI] - stolen); await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/pickTarget":false,"gameState/scores":sc,"gameState/result":{ msg:`😈 ${gs.buzzed} vole ${stolen} pts à ${targetName} !`,pts:stolen,scorer:gs.buzzed } }); setTimeout(() => hostNextQ(room, gs, rQs), 3000); }
  else if (rType === "elim") { sc[pI] += 100; const rE = [...(gs.roundElim || []), targetName]; const alive = gs.players.filter(p => !rE.includes(p)); await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/pickTarget":false,"gameState/scores":sc,"gameState/roundElim":rE,"gameState/result":{ msg:`💀 ${gs.buzzed} élimine ${targetName} ! +100 pts`,pts:100,scorer:gs.buzzed } }); if (alive.length <= 1) { const surv = alive[0] || null; if (surv) { sc[gs.players.indexOf(surv)] += 300; await fp(`rooms/${CODE}`, { "gameState/scores":sc,"gameState/result":{ msg:`🏆 ${surv} dernier survivant ! +300 pts`,pts:300,scorer:surv } }); } setTimeout(() => hostNextQ(room, { ...gs, roundElim:rE }, rQs), 3500); } else { setTimeout(() => hostNextQ(room, { ...gs, roundElim:rE }, rQs), 3000); } }
  else if (rType === "carton") { const cartons = [...(gs.cartons || gs.players.map(() => 0))]; cartons[tI] = Math.min(2, cartons[tI] + 1); const gotRed = cartons[tI] === 2; const penalty = gotRed ? 100 : 50; sc[tI] = Math.max(0, sc[tI] - penalty); sc[pI] += 50; const newRoundElim = gotRed ? [...(gs.roundElim || []), targetName] : [...(gs.roundElim || [])]; const cardMsg = gotRed ? `🟥 CARTON ROUGE pour ${targetName} ! -100 pts → éliminé !` : `🟨 Carton jaune pour ${targetName} ! -50 pts`; const alive = gs.players.filter(p => !newRoundElim.includes(p)); await fp(`rooms/${CODE}`, { "gameState/revealed":true,"gameState/pickTarget":false,"gameState/scores":sc,"gameState/cartons":cartons,"gameState/roundElim":newRoundElim,"gameState/result":{ msg:`${cardMsg} — ${gs.buzzed} +50 pts`,pts:50,scorer:gs.buzzed } }); if (alive.length <= 1) { const surv = alive[0] || null; if (surv) { sc[gs.players.indexOf(surv)] += 300; await fp(`rooms/${CODE}`, { "gameState/scores":sc,"gameState/result":{ msg:`🏆 ${surv} remporte la manche ! +300 pts`,pts:300,scorer:surv } }); } const cm = gs.cartonManche || 0; const maxM = room.cartonR || 3; if (cm + 1 >= maxM) { setTimeout(() => hostNextQ(room, { ...gs, cartons, roundElim:newRoundElim, scores:sc }, rQs), 3500); } else { setTimeout(async () => { await fp(`rooms/${CODE}`, { "gameState/cartonManche":cm+1,"gameState/cartons":gs.players.map(()=>0),"gameState/roundElim":[],"gameState/buzzed":null,"gameState/buzzedOut":[],"gameState/result":null }); const cur = await fg(`rooms/${CODE}/gameState`); hostStartQ(room, { ...cur, cartonManche:cm+1, cartons:gs.players.map(()=>0), roundElim:[] }, rQs); }, 3500); } } else { setTimeout(() => hostNextQ(room, { ...gs, cartons, roundElim:newRoundElim, scores:sc }, rQs), 3000); } }
}

// ════════════════════════════════════════════
//  ACTIONS JOUEURS
// ════════════════════════════════════════════

async function actBuzz() {
  const gs = await fg(`rooms/${CODE}/gameState`);
  if (!gs || gs.phase !== "question" || gs.revealed || gs.buzzed) return;
  if ((gs.buzzedOut || []).includes(ME) || (gs.roundElim || []).includes(ME)) return;
  if (I_BUZZED) return;
  I_BUZZED = true;
  drawQ_optimistic(gs); // affichage immédiat sans attendre Firebase
  await fp(`rooms/${CODE}`, { "gameState/buzzed": ME });
  if (HOST) { if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; } const room2 = await fg(`rooms/${CODE}`); HTIMER = setTimeout(async () => { const c3 = await fg(`rooms/${CODE}/gameState`); if (!c3 || c3.revealed || (c3.answers || {})[ME] !== undefined) return; await hostProcessAnswer(room2, c3, c3.rQs, false); }, 5000); }
}

async function actAnswer(ansIdx) {
  const gs = await fg(`rooms/${CODE}/gameState`);
  if (!gs || gs.phase !== "question" || gs.revealed) return;
  const room = await fg(`rooms/${CODE}`); if (!room) return;
  const rType = room.rounds[gs.roundIdx];
  const q = gs.rQs[gs.roundIdx][gs.qIdx];
  if (rType === "chrono" || rType === "qcm" || rType === "orage") {
    if ((gs.answers || {})[ME] !== undefined) return;
    await fp(`rooms/${CODE}`, { [`gameState/answers/${ME}`]: { ansIdx, time:Date.now() } });
    if (HOST) { const upd = await fg(`rooms/${CODE}/gameState`); const alive = gs.players.filter(p => !(gs.roundElim || []).includes(p)); const allAnswered = Object.keys(upd.answers || {}).length >= alive.length; if (allAnswered) { if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; } if (rType === "chrono") await hostChronoEnd(room, upd, gs.rQs); else if (rType === "qcm") await hostQCMEnd(room, upd, gs.rQs); else if (rType === "orage") await hostOrageEnd(room, upd, gs.rQs); } }
    return;
  }
  if (rType === "patate") { if (gs.patateHolder !== ME) return; if ((gs.answers || {})[ME] !== undefined) return; const isOk = ansIdx === q.c; await fp(`rooms/${CODE}`, { [`gameState/answers/${ME}`]:{ ansIdx, time:Date.now() },"gameState/buzzed":ME }); if (HOST) await hostProcessAnswer(room, gs, gs.rQs, isOk); return; }
  const iAmBuzzer = gs.buzzed === ME || (I_BUZZED && !gs.buzzed); if (!iAmBuzzer || (gs.answers || {})[ME] !== undefined) return;
  I_BUZZED = false; const isOk = ansIdx === q.c;
  await fp(`rooms/${CODE}`, { [`gameState/answers/${ME}`]:{ ansIdx, time:Date.now() } });
  if (HOST) await hostProcessAnswer(room, gs, gs.rQs, isOk);
  else await fp(`rooms/${CODE}`, { "gameState/buzzed": ME });
}

async function actPick(targetName) {
  const gs = await fg(`rooms/${CODE}/gameState`); if (!gs || !gs.pickTarget) return;
  if (gs.buzzed !== ME && !I_BUZZED) return;
  const room = await fg(`rooms/${CODE}`); if (!room) return;
  if (HOST) await hostPickTarget(room, gs, gs.rQs, targetName);
  else await fp(`rooms/${CODE}`, { "gameState/hostPick": targetName });
}

// ════════════════════════════════════════════
//  WATCH — Écoute Firebase et dispatche vers l'UI
// ════════════════════════════════════════════
function Watch(initialRoom) {
  setBG(initialRoom.theme || "culture");
  drawLoading(initialRoom);
  if (STOP) STOP();
  let lastPhase = null;
  STOP = fl(`rooms/${CODE}`, room => {
    if (!room || !room.gameState || !room.questionsReady) return;
    setBG(room.theme || "culture");
    const gs = room.gameState;
    if (HOST && gs.phase === "question" && !gs.revealed) {
      const rType = room.rounds[gs.roundIdx];
      if (gs.hostPick && gs.pickTarget && gs.buzzed) { const pick = gs.hostPick; fp(`rooms/${CODE}`, { "gameState/hostPick":null }); hostPickTarget(room, gs, gs.rQs, pick); return; }
      if (!gs.pickTarget) {
        if (gs.buzzed && rType !== "chrono") { if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; } HTIMER = setTimeout(async () => { const c3 = await fg(`rooms/${CODE}/gameState`); if (!c3 || c3.revealed || (c3.answers || {})[gs.buzzed] !== undefined) return; const room3 = await fg(`rooms/${CODE}`); if (!room3) return; await hostProcessAnswer(room3, c3, c3.rQs, false); }, 5000); }
        const answerKey = JSON.stringify(gs.answers || {});
        if (answerKey !== lastAnswerKey) {
          lastAnswerKey = answerKey; const answers = gs.answers || {};
          if (gs.buzzed && gs.buzzed !== ME && answers[gs.buzzed] !== undefined && rType !== "chrono") { const q = gs.rQs[gs.roundIdx][gs.qIdx]; const isOk = answers[gs.buzzed].ansIdx === q.c; if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; } hostProcessAnswer(room, gs, gs.rQs, isOk); return; }
          if (rType === "patate" && gs.patateHolder && gs.patateHolder !== ME && answers[gs.patateHolder] !== undefined) { const q = gs.rQs[gs.roundIdx][gs.qIdx]; const isOk = answers[gs.patateHolder].ansIdx === q.c; if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; } hostProcessAnswer(room, { ...gs, buzzed:gs.patateHolder }, gs.rQs, isOk); return; }
          if (rType === "chrono" || rType === "qcm" || rType === "orage") { const alive = gs.players.filter(p => !(gs.roundElim || []).includes(p)); if (Object.keys(answers).length >= alive.length) { if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; } if (rType === "chrono") hostChronoEnd(room, gs, gs.rQs); else if (rType === "qcm") hostQCMEnd(room, gs, gs.rQs); else if (rType === "orage") hostOrageEnd(room, gs, gs.rQs); return; } }
        }
      }
    }
    const key = gs.phase + "-" + gs.roundIdx + "-" + gs.qIdx + "-" + (gs.buzzed || "") + "-" + gs.revealed + "-" + gs.pickTarget + "-" + JSON.stringify(gs.result);
    if (key === lastPhase) return;
    if (gs.buzzed && gs.buzzed !== ME) I_BUZZED = false;
    if (gs.revealed) I_BUZZED = false;
    lastPhase = key;
    if      (gs.phase === "roundIntro") drawIntro(room, gs);
    else if (gs.phase === "question")   drawQ(room, gs);
    else if (gs.phase === "scoreboard") drawScore(room, gs, false);
    else if (gs.phase === "final")      drawScore(room, gs, true);
  });
}
