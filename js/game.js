/* ════════════════════════════════════════════
   game.js — BUZZ! Quiz
   Orchestre les rounds en déléguant à rounds/*.js
   Contient uniquement la logique commune :
   hostLoadQ, hostStartQ, hostNextQ, Watch,
   actBuzz, actAnswer, actPick
   ════════════════════════════════════════════ */

// Firebase renvoie les arrays comme objets — on normalise
const toArr = v => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return Object.keys(v).sort((a,b)=>+a-+b).map(k => v[k]);
};

async function hostLoadQ() {
  USED_QS = new Set();
  const room = await fg(`rooms/${CODE}`);
  if (!room) return;
  const themes = room.themes && room.themes.length ? room.themes : [room.theme || "culture"];

  // players = uniquement les vrais joueurs (ceux qui ont rejoint via player.html)
  // L'hôte ne joue pas, il n'est pas dans room.players
  const players = toArr(room.players).map(p => p.name);
  if (!players || players.length === 0) { alert("Aucun joueur n'a rejoint !"); return; }

  const rQs = {};
  room.rounds.forEach((r, i) => { rQs[i] = getStaticQs(themes, r === "elim" ? Math.max(room.elimR, 3) : 8); });
  const gs = {
    phase:"roundIntro", roundIdx:0, qIdx:0, elimManche:0,
    rQs, players, scores:players.map(() => 0),
    lives:players.map(() => 3), cartons:players.map(() => 0),
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

// ── Démarre une question — délègue au bon module round ──
async function hostStartQ(room, gs, rQs) {
  I_BUZZED = false; lastAnswerKey = "";
  const rType = room.rounds[gs.roundIdx];
  const tDur  = rType === "chrono" ? 20 : 30;
  const tStart = Date.now();

  if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; }

  // Délégation aux modules spécialisés
  if (rType === "qcm")    { await roundQCM_start(room, gs, rQs); return; }
  if (rType === "orage")  { await roundOrage_start(room, gs, rQs); return; }
  if (rType === "chrono") { await roundChrono_start(room, gs, rQs); return; }

  // Patate Chaude
  if (rType === "patate") {
    const alive = gs.players.filter(p => !(gs.roundElim || []).includes(p));
    if (alive.length <= 1) {
      const surv = alive[0] || null; const sc = [...gs.scores];
      if (surv) sc[gs.players.indexOf(surv)] += 500;
      await fp(`rooms/${CODE}`, { "gameState/phase":"question","gameState/revealed":true,"gameState/scores":sc,"gameState/result":{ msg:surv?`🏆 ${surv} est le dernier survivant ! +500 pts`:"Fin de la manche !",pts:500,scorer:surv } });
      setTimeout(() => hostNextQ(room, { ...gs, scores:sc }, rQs), 3500); return;
    }
    let holder = gs.patateHolder && alive.includes(gs.patateHolder) ? gs.patateHolder : alive[Math.floor(Math.random()*alive.length)];
    let explodeAt = gs.patateExplodeAt;
    if (!explodeAt || explodeAt <= Date.now()) { explodeAt = Date.now() + Math.floor(Math.random()*31+15)*1000; }
    await fp(`rooms/${CODE}`, { "gameState/phase":"question","gameState/buzzed":null,"gameState/buzzedOut":[],"gameState/answers":{},"gameState/revealed":false,"gameState/result":null,"gameState/pickTarget":false,"gameState/hostPick":null,"gameState/timerStart":tStart,"gameState/timerDur":30,"gameState/patateHolder":holder,"gameState/patateExplodeAt":explodeAt });
    HTIMER = setTimeout(async () => {
      const cur = await fg(`rooms/${CODE}/gameState`); if (!cur||cur.revealed||cur.phase!=="question") return;
      const sc=[...cur.scores]; const loser=cur.patateHolder; const hi=cur.players.indexOf(loser);
      if(hi>=0) sc[hi]=Math.max(0,sc[hi]-50);
      const newRoundElim=[...(cur.roundElim||[]),loser]; const stillAlive=cur.players.filter(p=>!newRoundElim.includes(p));
      await fp(`rooms/${CODE}`,{"gameState/revealed":true,"gameState/scores":sc,"gameState/roundElim":newRoundElim,"gameState/patateExplodeAt":null,"gameState/result":{msg:`💥 BOOM ! ${loser} explose ! -50 pts — Éliminé !`,pts:-50,scorer:loser}});
      if(stillAlive.length<=1){ const surv=stillAlive[0]||null; if(surv){sc[cur.players.indexOf(surv)]+=500; await fp(`rooms/${CODE}`,{"gameState/scores":sc,"gameState/result":{msg:`🏆 ${surv} est le dernier survivant ! +500 pts`,pts:500,scorer:surv}});} setTimeout(()=>hostNextQ(room,{...cur,scores:sc,roundElim:newRoundElim,patateExplodeAt:null},rQs),3500); }
      else { setTimeout(async()=>{ const updGs=await fg(`rooms/${CODE}/gameState`); if(!updGs)return; const survivors=updGs.players.filter(p=>!newRoundElim.includes(p)); const newHolder=survivors[Math.floor(Math.random()*survivors.length)]; await fp(`rooms/${CODE}`,{"gameState/patateHolder":newHolder,"gameState/patateExplodeAt":null,"gameState/result":null,"gameState/revealed":false,"gameState/buzzed":null,"gameState/answers":{},"gameState/buzzedOut":[]}); const freshGs=await fg(`rooms/${CODE}/gameState`); hostStartQ(room,{...freshGs,roundElim:newRoundElim,patateHolder:newHolder,patateExplodeAt:null},rQs); },3500); }
    }, Math.max(0, explodeAt - Date.now()));
    return;
  }

  // Buzzer / Steal / Elim / Carton — même démarrage
  await fp(`rooms/${CODE}`, { "gameState/phase":"question","gameState/buzzed":null,"gameState/buzzedOut":[],"gameState/answers":{},"gameState/revealed":false,"gameState/result":null,"gameState/pickTarget":false,"gameState/hostPick":null,"gameState/timerStart":tStart,"gameState/timerDur":tDur });
  HTIMER = setTimeout(async () => {
    const cur = await fg(`rooms/${CODE}/gameState`);
    if (!cur || cur.revealed || cur.phase !== "question") return;
    await fp(`rooms/${CODE}`, { "gameState/revealed":true, "gameState/result":{ msg:"⏱️ Temps écoulé !", pts:0, scorer:null } });
    setTimeout(() => hostNextQ(room, cur, rQs), 3000);
  }, tDur * 1000);
}

// ── Passe à la question suivante ──
async function hostNextQ(room, gs, rQs) {
  I_BUZZED = false; lastAnswerKey = "";
  const rType = room.rounds[gs.roundIdx];
  let qIdx = gs.qIdx, rIdx = gs.roundIdx, eM = gs.elimManche || 0, rE = gs.roundElim || [];
  if (rType === "elim") { eM++; rE = []; if (eM < room.elimR) { await fp(`rooms/${CODE}`,{"gameState/elimManche":eM,"gameState/roundElim":[]}); const c2=await fg(`rooms/${CODE}/gameState`); hostStartQ(room,{...c2,elimManche:eM,roundElim:[]},rQs); return; } else { eM=0; rE=[]; qIdx++; } }
  else qIdx++;
  if (qIdx >= (rQs[rIdx]||[]).length) {
    rIdx++; qIdx=0; eM=0; rE=[];
    if (rIdx >= room.rounds.length) { await fp(`rooms/${CODE}`,{"gameState/phase":"final","gameState/scores":gs.scores}); return; }
    await fp(`rooms/${CODE}`,{"gameState/phase":"scoreboard","gameState/roundIdx":rIdx,"gameState/qIdx":0,"gameState/elimManche":0,"gameState/roundElim":[]});
    setTimeout(async()=>{ await fp(`rooms/${CODE}`,{"gameState/phase":"roundIntro"}); setTimeout(async()=>{ const cur=await fg(`rooms/${CODE}/gameState`); hostStartQ(room,{...cur,roundIdx:rIdx,qIdx:0,elimManche:0,roundElim:[]},rQs); },4000); },5000);
    return;
  }
  await fp(`rooms/${CODE}`,{"gameState/qIdx":qIdx,"gameState/elimManche":eM,"gameState/roundElim":rE});
  const cur = await fg(`rooms/${CODE}/gameState`);
  hostStartQ(room, { ...cur, qIdx, elimManche:eM, roundElim:rE }, rQs);
}

// ── Traitement réponse — délègue au bon module ──
async function hostProcessAnswer(room, gs, rQs, isOk) {
  const rType = room.rounds[gs.roundIdx];
  if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; }
  if (rType === "buzzer") { await roundBuzzer_process(room, gs, rQs, isOk); }
  else if (rType === "steal")  { await roundSteal_process(room, gs, rQs, isOk); }
  else if (rType === "qcm")    { await roundQCM_end(room, gs, rQs); }
  else if (rType === "orage")  { await roundOrage_end(room, gs, rQs); }
  else if (rType === "chrono") { await roundChrono_end(room, gs, rQs); }
  else if (rType === "elim")   { await roundElim_process(room, gs, rQs, isOk); }
  else if (rType === "carton") { await roundCarton_process(room, gs, rQs, isOk); }
  else if (rType === "patate") { await roundPatate_process(room, gs, rQs, isOk); }
}

async function hostPickTarget(room, gs, rQs, targetName) {
  const rType = room.rounds[gs.roundIdx];
  if (HTIMER) { clearTimeout(HTIMER); HTIMER = null; }
  if (rType === "steal")  { await roundSteal_pick(room, gs, rQs, targetName); }
  else if (rType === "elim")   { await roundElim_pick(room, gs, rQs, targetName); }
  else if (rType === "carton") { await roundCarton_pick(room, gs, rQs, targetName); }
}

// ════════════════════════════════════════════
//  ACTIONS JOUEURS
// ════════════════════════════════════════════
async function actBuzz() {
  const gs = await fg(`rooms/${CODE}/gameState`);
  if (!gs||gs.phase!=="question"||gs.revealed||gs.buzzed) return;
  if ((gs.buzzedOut||[]).includes(ME)||(gs.roundElim||[]).includes(ME)) return;
  if (I_BUZZED) return;
  I_BUZZED = true;
  drawQ_optimistic(gs);
  await fp(`rooms/${CODE}`, { "gameState/buzzed": ME });
  if (HOST) { if(HTIMER){clearTimeout(HTIMER);HTIMER=null;} const room2=await fg(`rooms/${CODE}`); HTIMER=setTimeout(async()=>{ const c3=await fg(`rooms/${CODE}/gameState`); if(!c3||c3.revealed||(c3.answers||{})[ME]!==undefined)return; await hostProcessAnswer(room2,c3,c3.rQs,false); },5000); }
}

async function actAnswer(ansIdx) {
  const gs = await fg(`rooms/${CODE}/gameState`);
  if (!gs||gs.phase!=="question"||gs.revealed) return;
  const room = await fg(`rooms/${CODE}`); if (!room) return;
  const rType = room.rounds[gs.roundIdx];
  const q = gs.rQs[gs.roundIdx][gs.qIdx];
  if (rType==="chrono"||rType==="qcm"||rType==="orage") {
    if ((gs.answers||{})[ME]!==undefined) return;
    await fp(`rooms/${CODE}`, { [`gameState/answers/${ME}`]:{ ansIdx, time:Date.now() } });
    if (HOST) { const upd=await fg(`rooms/${CODE}/gameState`); const alive=gs.players.filter(p=>!(gs.roundElim||[]).includes(p)); const allAnswered=Object.keys(upd.answers||{}).length>=alive.length; if(allAnswered){ if(HTIMER){clearTimeout(HTIMER);HTIMER=null;} if(rType==="chrono") await roundChrono_end(room,upd,gs.rQs); else if(rType==="qcm") await roundQCM_end(room,upd,gs.rQs); else if(rType==="orage") await roundOrage_end(room,upd,gs.rQs); } }
    return;
  }
  if (rType==="patate") { if(gs.patateHolder!==ME)return; if((gs.answers||{})[ME]!==undefined)return; const isOk=ansIdx===q.c; await fp(`rooms/${CODE}`,{[`gameState/answers/${ME}`]:{ansIdx,time:Date.now()},"gameState/buzzed":ME}); if(HOST) await roundPatate_process(room,gs,gs.rQs,isOk); return; }
  const iAmBuzzer = gs.buzzed===ME||(I_BUZZED&&!gs.buzzed);
  if (!iAmBuzzer||(gs.answers||{})[ME]!==undefined) return;
  I_BUZZED = false; const isOk = ansIdx===q.c;
  await fp(`rooms/${CODE}`, { [`gameState/answers/${ME}`]:{ ansIdx, time:Date.now() } });
  if (HOST) await hostProcessAnswer(room, gs, gs.rQs, isOk);
  else await fp(`rooms/${CODE}`, { "gameState/buzzed": ME });
}

async function actPick(targetName) {
  const gs = await fg(`rooms/${CODE}/gameState`); if (!gs||!gs.pickTarget) return;
  if (gs.buzzed!==ME&&!I_BUZZED) return;
  const room = await fg(`rooms/${CODE}`); if (!room) return;
  if (HOST) await hostPickTarget(room, gs, gs.rQs, targetName);
  else await fp(`rooms/${CODE}`, { "gameState/hostPick": targetName });
}

// ════════════════════════════════════════════
//  WATCH
// ════════════════════════════════════════════
function Watch(initialRoom) {
  setBG(initialRoom.theme || "culture");
  drawLoading(initialRoom);
  if (STOP) STOP();
  let lastPhase = null;
  STOP = fl(`rooms/${CODE}`, room => {
    if (!room||!room.gameState||!room.questionsReady) return;
    setBG(room.theme || "culture");
    const gs = room.gameState;
    if (HOST && gs.phase==="question" && !gs.revealed) {
      const rType = room.rounds[gs.roundIdx];
      if (gs.hostPick&&gs.pickTarget&&gs.buzzed) { const pick=gs.hostPick; fp(`rooms/${CODE}`,{"gameState/hostPick":null}); hostPickTarget(room,gs,gs.rQs,pick); return; }
      if (!gs.pickTarget) {
        if (gs.buzzed&&rType!=="chrono") { if(HTIMER){clearTimeout(HTIMER);HTIMER=null;} HTIMER=setTimeout(async()=>{ const c3=await fg(`rooms/${CODE}/gameState`); if(!c3||c3.revealed||(c3.answers||{})[gs.buzzed]!==undefined)return; const room3=await fg(`rooms/${CODE}`); if(!room3)return; await hostProcessAnswer(room3,c3,c3.rQs,false); },5000); }
        const answerKey = JSON.stringify(gs.answers||{});
        if (answerKey!==lastAnswerKey) {
          lastAnswerKey = answerKey; const answers = gs.answers||{};
          if (gs.buzzed&&gs.buzzed!==ME&&answers[gs.buzzed]!==undefined&&rType!=="chrono") { const q=gs.rQs[gs.roundIdx][gs.qIdx]; const isOk=answers[gs.buzzed].ansIdx===q.c; if(HTIMER){clearTimeout(HTIMER);HTIMER=null;} hostProcessAnswer(room,gs,gs.rQs,isOk); return; }
          if (rType==="patate"&&gs.patateHolder&&gs.patateHolder!==ME&&answers[gs.patateHolder]!==undefined) { const q=gs.rQs[gs.roundIdx][gs.qIdx]; const isOk=answers[gs.patateHolder].ansIdx===q.c; if(HTIMER){clearTimeout(HTIMER);HTIMER=null;} roundPatate_process(room,{...gs,buzzed:gs.patateHolder},gs.rQs,isOk); return; }
          if (rType==="chrono"||rType==="qcm"||rType==="orage") { const alive=gs.players.filter(p=>!(gs.roundElim||[]).includes(p)); if(Object.keys(answers).length>=alive.length){ if(HTIMER){clearTimeout(HTIMER);HTIMER=null;} if(rType==="chrono") roundChrono_end(room,gs,gs.rQs); else if(rType==="qcm") roundQCM_end(room,gs,gs.rQs); else if(rType==="orage") roundOrage_end(room,gs,gs.rQs); return; } }
        }
      }
    }
    const key = gs.phase+"-"+gs.roundIdx+"-"+gs.qIdx+"-"+(gs.buzzed||"")+"-"+gs.revealed+"-"+gs.pickTarget+"-"+JSON.stringify(gs.result);
    if (key===lastPhase) return;
    if (gs.buzzed&&gs.buzzed!==ME) I_BUZZED=false;
    if (gs.revealed) I_BUZZED=false;
    lastPhase=key;
    // index.html = écran hôte/plateau → affiche la vue plateau TV
    // drawQ_host montre la question + scores sans les boutons joueur
    if      (gs.phase==="roundIntro") drawIntro(room,gs);
    else if (gs.phase==="question")   drawQ_host(room,gs);
    else if (gs.phase==="scoreboard") drawScore(room,gs,false);
    else if (gs.phase==="final")      drawScore(room,gs,true);
  });
}
