/* ════════════════════════════════════════════
   scene3d.js — BUZZ! Quiz
   Contient : scène Three.js, silhouette 3D,
              ambiances par thème, animations
   Dépend de  : three.min.js (chargé avant)
   Expose     : window.SCENE3D { setTheme, talk, react, idle }
   ════════════════════════════════════════════ */

// ── Couleurs et ambiance par thème ──
// Modifie ici pour changer l'atmosphère de chaque thème
const THEME3D = {
  culture : { fogColor:0x1e1b4b, fogNear:9,  fogFar:24, ambCol:0x3a2f7a, ambInt:.55, spot1Col:0xa78bfa, spot1Int:2.4, rimCol:0x7c3aed, rimInt:1.4, siloCol:0x0d0820, glowCol:0xa78bfa, floorCol:0x0a0820, partCol:0xa78bfa, bgCol:0x0a0918 },
  music   : { fogColor:0x1a0014, fogNear:8,  fogFar:20, ambCol:0x2a0020, ambInt:.5,  spot1Col:0xf472b6, spot1Int:2.6, rimCol:0xbe185d, rimInt:1.5, siloCol:0x0e0008, glowCol:0xf472b6, floorCol:0x0a0005, partCol:0xf472b6, bgCol:0x080003 },
  cinema  : { fogColor:0x180c00, fogNear:8,  fogFar:20, ambCol:0x281400, ambInt:.5,  spot1Col:0xfbbf24, spot1Int:2.8, rimCol:0xd97706, rimInt:1.6, siloCol:0x0f0700, glowCol:0xfbbf24, floorCol:0x0c0500, partCol:0xfbbf24, bgCol:0x0a0400 },
  sport   : { fogColor:0x071408, fogNear:8,  fogFar:20, ambCol:0x0a2010, ambInt:.5,  spot1Col:0x34d399, spot1Int:2.6, rimCol:0x059669, rimInt:1.5, siloCol:0x030a04, glowCol:0x34d399, floorCol:0x040c05, partCol:0x34d399, bgCol:0x030a04 },
  histoire: { fogColor:0x140e08, fogNear:8,  fogFar:20, ambCol:0x1c1208, ambInt:.5,  spot1Col:0xd4a574, spot1Int:2.4, rimCol:0x92400e, rimInt:1.4, siloCol:0x0c0804, glowCol:0xd4a574, floorCol:0x0a0703, partCol:0xd4a574, bgCol:0x080502 },
  science : { fogColor:0x030e18, fogNear:8,  fogFar:21, ambCol:0x052030, ambInt:.5,  spot1Col:0x22d3ee, spot1Int:2.8, rimCol:0x0891b2, rimInt:1.6, siloCol:0x010810, glowCol:0x22d3ee, floorCol:0x020c14, partCol:0x22d3ee, bgCol:0x020a10 },
  geo     : { fogColor:0x071020, fogNear:9,  fogFar:22, ambCol:0x0c1a30, ambInt:.5,  spot1Col:0x60a5fa, spot1Int:2.5, rimCol:0x2563eb, rimInt:1.4, siloCol:0x040810, glowCol:0x60a5fa, floorCol:0x050a18, partCol:0x60a5fa, bgCol:0x03060e },
  gaming  : { fogColor:0x0e0520, fogNear:8,  fogFar:20, ambCol:0x180040, ambInt:.5,  spot1Col:0xc084fc, spot1Int:2.7, rimCol:0x7e22ce, rimInt:1.6, siloCol:0x070014, glowCol:0xc084fc, floorCol:0x060010, partCol:0xc084fc, bgCol:0x04000c },
  hp      : { fogColor:0x120800, fogNear:8,  fogFar:20, ambCol:0x1e1000, ambInt:.5,  spot1Col:0xfcd34d, spot1Int:2.8, rimCol:0x92400e, rimInt:1.6, siloCol:0x0c0600, glowCol:0xfcd34d, floorCol:0x0a0500, partCol:0xfcd34d, bgCol:0x080400 },
};

// ════════════════════════════════════════════
//  INIT THREE.JS
// ════════════════════════════════════════════
const _canvas   = document.getElementById('canvas3d');
const _renderer = new THREE.WebGLRenderer({ canvas:_canvas, antialias:true });
_renderer.setSize(window.innerWidth, window.innerHeight);
_renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
_renderer.shadowMap.enabled = true;
_renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

const _scene  = new THREE.Scene();
const _camera = new THREE.PerspectiveCamera(58, window.innerWidth/window.innerHeight, 0.1, 100);
_camera.position.set(0, 2.0, 7.0);
_camera.lookAt(0, 1.6, 0);

window.addEventListener('resize', () => {
  _camera.aspect = window.innerWidth / window.innerHeight;
  _camera.updateProjectionMatrix();
  _renderer.setSize(window.innerWidth, window.innerHeight);
});

// ════════════════════════════════════════════
//  CONSTRUCTION DU PERSONNAGE
//  Silhouette faite de géométries simples :
//  sphère (tête), cylindres (membres), box (torse)
// ════════════════════════════════════════════
const _siloGroup = new THREE.Group();
_scene.add(_siloGroup);

function _mkMesh(geo, col = 0x08051a) {
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color:col, roughness:.92, metalness:.04 }));
}

// Corps
const _head  = _mkMesh(new THREE.SphereGeometry(.27, 16, 16));   _head.position.set(0, 3.1, 0); _head.castShadow = true;
const _neck  = _mkMesh(new THREE.CylinderGeometry(.09, .11, .18, 8)); _neck.position.set(0, 2.78, 0);
const _torso = _mkMesh(new THREE.BoxGeometry(.7, .88, .3));        _torso.position.set(0, 2.2, 0); _torso.castShadow = true;
const _hips  = _mkMesh(new THREE.BoxGeometry(.58, .28, .26));      _hips.position.set(0, 1.66, 0);

// Épaules (pivot = point de rotation du bras entier)
const _lSh = new THREE.Group(); _lSh.position.set(-.42, 2.58, 0);
const _rSh = new THREE.Group(); _rSh.position.set( .42, 2.58, 0);

function _makeArm(side) {
  const g  = new THREE.Group();
  const up = _mkMesh(new THREE.CylinderGeometry(.085, .075, .52, 8));
  up.position.set(side * -.1, -.26, 0); up.rotation.z = side * .18;
  const lo = _mkMesh(new THREE.CylinderGeometry(.07, .06, .46, 8));
  lo.position.set(side * -.05, -.78, .04);
  const ha = _mkMesh(new THREE.SphereGeometry(.08, 8, 8));
  ha.position.set(side * -.03, -1.08, .07);
  g.add(up, lo, ha);
  return g;
}
_lSh.add(_makeArm(-1));
_rSh.add(_makeArm(1));

// Jambes (pivot = hanche)
const _lLeg = new THREE.Group(); _lLeg.position.set(-.17, 1.5, 0);
const _rLeg = new THREE.Group(); _rLeg.position.set( .17, 1.5, 0);

function _makeLeg(side) {
  const g  = new THREE.Group();
  const th = _mkMesh(new THREE.CylinderGeometry(.105, .095, .52, 8)); th.position.set(0, -.26, 0);
  const sh = _mkMesh(new THREE.CylinderGeometry(.082, .072, .48, 8)); sh.position.set(0, -.78, 0);
  const fo = _mkMesh(new THREE.BoxGeometry(.13, .085, .24));           fo.position.set(side*.02, -1.08, .05);
  g.add(th, sh, fo);
  return g;
}
_lLeg.add(_makeLeg(-1));
_rLeg.add(_makeLeg(1));

_siloGroup.add(_head, _neck, _torso, _hips, _lSh, _rSh, _lLeg, _rLeg);
_siloGroup.position.set(0, -.65, -1.2);

// ── Sol réfléchissant ──
const _floor = new THREE.Mesh(
  new THREE.PlaneGeometry(22, 22),
  new THREE.MeshStandardMaterial({ color:0x080618, roughness:.35, metalness:.5 })
);
_floor.rotation.x = -Math.PI / 2;
_floor.position.y = -.64;
_floor.receiveShadow = true;
_scene.add(_floor);

// ── Reflet au sol (clone semi-transparent aplati) ──
const _refl = _siloGroup.clone();
_refl.scale.set(1, -0.28, 1);
_refl.position.y = -1.3;
_refl.traverse(c => {
  if (c.isMesh) { c.material = c.material.clone(); c.material.opacity = .1; c.material.transparent = true; }
});
_scene.add(_refl);

// ════════════════════════════════════════════
//  LUMIÈRES
// ════════════════════════════════════════════
const _ambLight  = new THREE.AmbientLight(0x3a2f7a, .55);
_scene.add(_ambLight);

const _spotLight = new THREE.SpotLight(0xa78bfa, 2.4, 20, Math.PI/5, .4, 1.4);
_spotLight.position.set(0, 8, 2.5);
_spotLight.castShadow = true;
_scene.add(_spotLight);

const _spotTarget = new THREE.Object3D();
_spotTarget.position.set(0, 1.6, -.5);
_scene.add(_spotTarget);
_spotLight.target = _spotTarget;

const _rimLight  = new THREE.PointLight(0x7c3aed, 1.4, 12);
_rimLight.position.set(-2.8, 3.2, -3.5);
_scene.add(_rimLight);

const _fillLight = new THREE.PointLight(0xa78bfa, .7, 8);
_fillLight.position.set(0, -.3, .8);
_scene.add(_fillLight);

// ════════════════════════════════════════════
//  PARTICULES FLOTTANTES
// ════════════════════════════════════════════
let _particles = null;

function _buildParticles(col) {
  if (_particles) { _scene.remove(_particles); _particles.geometry.dispose(); _particles.material.dispose(); }
  const N = 200, pos = new Float32Array(N*3), spd = new Float32Array(N), iniY = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random()-.5)*16;
    pos[i*3+1] = Math.random()*9 - 1;
    pos[i*3+2] = (Math.random()-.5)*12 - 1.5;
    spd[i]  = Math.random()*.38 + .12;
    iniY[i] = pos[i*3+1];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.userData = { spd, iniY };
  _particles = new THREE.Points(geo, new THREE.PointsMaterial({ color:col, size:.04, transparent:true, opacity:.65, sizeAttenuation:true }));
  _scene.add(_particles);
}

// ── Brume & fond ──
_scene.fog = new THREE.Fog(0x1e1b4b, 9, 24);
_renderer.setClearColor(0x0a0918);

// ════════════════════════════════════════════
//  APPLIQUER UN THÈME
//  Appelé par setBG() dans ui.js à chaque
//  changement d'écran ou de thème
// ════════════════════════════════════════════
function _applyTheme3d(tid) {
  const t = THEME3D[tid] || THEME3D.culture;
  _renderer.setClearColor(t.bgCol);
  _scene.fog.color.setHex(t.fogColor); _scene.fog.near = t.fogNear; _scene.fog.far = t.fogFar;
  _ambLight.color.setHex(t.ambCol);    _ambLight.intensity = t.ambInt;
  _spotLight.color.setHex(t.spot1Col); _spotLight.intensity = t.spot1Int;
  _rimLight.color.setHex(t.rimCol);    _rimLight.intensity = t.rimInt;
  _fillLight.color.setHex(t.glowCol);
  _floor.material.color.setHex(t.floorCol);
  _siloGroup.traverse(c => {
    if (c.isMesh && !c.material.transparent) {
      c.material.color.setHex(t.siloCol);
      c.material.emissive = new THREE.Color(t.glowCol);
      c.material.emissiveIntensity = .045;
    }
  });
  _buildParticles(t.partCol);
}
_applyTheme3d('culture'); // thème initial

// ════════════════════════════════════════════
//  ÉTATS D'ANIMATION DU PERSONNAGE
//
//  idle  → respiration douce (lobby, accueil)
//  talk  → gesticule (question en cours)
//  react → célèbre (bonne réponse, victoire)
// ════════════════════════════════════════════
let _animState = 'idle';
let _animTime  = 0;

function _setAnim(state) { _animState = state; _animTime = 0; }

function _tickCharacter(t) {
  _animTime += .016;

  if (_animState === 'idle') {
    _siloGroup.position.y = -.65 + Math.sin(t*.75) * .014;
    _torso.rotation.z     = Math.sin(t*.55) * .013;
    _head.rotation.y      = Math.sin(t*.38) * .07;
    _head.rotation.x      = 0;
    _lSh.rotation.z       = Math.sin(t*.65+.4) * .05;
    _rSh.rotation.z       = -Math.sin(t*.65+.4) * .05;
    _lSh.rotation.x = _rSh.rotation.x = 0;
    _lLeg.rotation.x = _rLeg.rotation.x = 0;
    _siloGroup.rotation.y = Math.sin(t*.2) * .04;

  } else if (_animState === 'talk') {
    // Gesticulation active : bras qui bougent, tête qui hoche
    _siloGroup.position.y = -.65 + Math.sin(t*1.7) * .022;
    _head.rotation.x      = Math.sin(t*2.1) * .11;
    _head.rotation.y      = Math.sin(t*1.05) * .17;
    _torso.rotation.z     = Math.sin(t*1.25) * .038;
    _torso.rotation.x     = Math.sin(t*.85) * .022;
    _lSh.rotation.x = -.55 + Math.sin(t*1.95) * .32;  // bras gauche levé
    _lSh.rotation.z =  .28 + Math.sin(t*1.45+.9) * .18;
    _rSh.rotation.x = -.28 + Math.sin(t*1.55+.75) * .42; // bras droit ample
    _rSh.rotation.z = -.38 + Math.sin(t*2.05) * .22;
    _siloGroup.rotation.y = Math.sin(t*.45) * .07;

  } else if (_animState === 'react') {
    // Célébration : saut + bras levés
    const j = Math.max(0, Math.sin(_animTime*4.5)) * .28;
    _siloGroup.position.y = -.65 + j;
    _head.rotation.x = -.18 + Math.sin(t*3) * .09;
    _head.rotation.y = Math.sin(t*2.2) * .13;
    _lSh.rotation.x = -1.3 + Math.sin(t*3) * .18;   _lSh.rotation.z =  .65;
    _rSh.rotation.x = -1.3 + Math.sin(t*3.2) * .18; _rSh.rotation.z = -.65;
    _lLeg.rotation.x =  Math.sin(_animTime*4.5) * .28;
    _rLeg.rotation.x = -Math.sin(_animTime*4.5) * .28;
    if (_animTime > 2.5) _setAnim('idle'); // retour auto en idle
  }

  // Le reflet suit le personnage
  _refl.position.x = _siloGroup.position.x;
  _refl.rotation.y = _siloGroup.rotation.y;
}

// ════════════════════════════════════════════
//  BOUCLE D'ANIMATION PRINCIPALE
// ════════════════════════════════════════════
const _clock3d = new THREE.Clock();

function _loop3d() {
  requestAnimationFrame(_loop3d);
  const t = _clock3d.getElapsedTime();

  _tickCharacter(t);

  // Particules : montée douce en boucle
  if (_particles) {
    const pos = _particles.geometry.attributes.position.array;
    const { spd, iniY } = _particles.geometry.userData;
    for (let i = 0; i < spd.length; i++) {
      pos[i*3+1] += spd[i] * .006;
      if (pos[i*3+1] > 8) pos[i*3+1] = iniY[i] - 7;
    }
    _particles.geometry.attributes.position.needsUpdate = true;
    _particles.rotation.y += .0004;
  }

  // Dérive douce de la caméra
  _camera.position.x = Math.sin(t*.1) * .2;
  _camera.position.y = 2.0 + Math.sin(t*.15) * .07;
  _camera.lookAt(0, 1.6, 0);

  _renderer.render(_scene, _camera);
}
_loop3d();

// ════════════════════════════════════════════
//  API PUBLIQUE
//  Utilisée par ui.js et game.js pour
//  piloter la scène depuis le reste du jeu
// ════════════════════════════════════════════
window.SCENE3D = {
  setTheme : _applyTheme3d,  // changer l'ambiance
  talk     : () => _setAnim('talk'),   // gesticule
  react    : () => _setAnim('react'),  // célèbre
  idle     : () => _setAnim('idle'),   // respiration douce
};
