import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as TEX from './textures.js';

/* ------------------------------------------------------------------ data */
/* orbit   = scene units, radius = scene units, period = compressed sim days */
const SUN = {
  key: 'sun',
  name: 'Sun',
  type: 'G-type main-sequence star',
  hex: '#ffb340',
  radius: 8,
  spin: 0.04,
  info: {
    Diameter: '1,392,700 km',
    'Distance from Sun': '0 AU',
    'Orbital period': '—',
    'Rotation period': '25.4 Earth days',
    Moons: '8 planets',
    'Mean surface temp': '5,505 °C',
    Mass: '99.86% of system'
  },
  fact: 'Light takes 8 minutes 20 seconds to reach Earth, and the Sun holds 99.86% of all mass in the solar system.'
};

const PLANETS = [
  {
    key: 'mercury', name: 'Mercury', type: 'Terrestrial planet', hex: '#9a8d7d',
    radius: 0.95, orbit: 19, period: 101, phase: 0.9, tilt: 0.01, spin: 0.04,
    texture: () => TEX.rockyTexture({ base: [124, 114, 102], shades: [[78, 71, 64], [172, 160, 144]], craters: 110, seed: 11 }),
    info: {
      Diameter: '4,879 km',
      'Distance from Sun': '0.39 AU',
      'Orbital period': '88 Earth days',
      'Rotation period': '58.6 Earth days',
      Moons: '0',
      'Mean surface temp': '167 °C',
      Gravity: '0.38 g'
    },
    fact: 'A single day on Mercury lasts 176 Earth days — longer than its 88-day year.'
  },
  {
    key: 'venus', name: 'Venus', type: 'Terrestrial planet', hex: '#e6c68a',
    radius: 1.6, orbit: 26, period: 169, phase: 2.4, tilt: 3.09, spin: -0.015,
    texture: () => TEX.bandedTexture({
      seed: 5, turbulence: 1.6,
      palette: [[214, 176, 112], [236, 208, 150], [202, 158, 96], [240, 216, 164], [210, 172, 110]]
    }),
    atmosphere: 0xffd9a0,
    info: {
      Diameter: '12,104 km',
      'Distance from Sun': '0.72 AU',
      'Orbital period': '225 Earth days',
      'Rotation period': '243 days (retrograde)',
      Moons: '0',
      'Mean surface temp': '464 °C',
      Gravity: '0.90 g'
    },
    fact: 'Venus spins backwards compared to every other planet, and its surface is hot enough to melt lead.'
  },
  {
    key: 'earth', name: 'Earth', type: 'Terrestrial planet', hex: '#4d9fff',
    radius: 1.7, orbit: 34, period: 220, phase: 4.1, tilt: 0.41, spin: 0.5,
    texture: () => TEX.earthTexture(),
    atmosphere: 0x4d9fff,
    clouds: true,
    moon: true,
    info: {
      Diameter: '12,756 km',
      'Distance from Sun': '1.00 AU',
      'Orbital period': '365.25 days',
      'Rotation period': '23.9 hours',
      Moons: '1',
      'Mean surface temp': '15 °C',
      Gravity: '1.00 g'
    },
    fact: 'The only known world with liquid water oceans on the surface — and the only one known to host life.'
  },
  {
    key: 'mars', name: 'Mars', type: 'Terrestrial planet', hex: '#d1603d',
    radius: 1.3, orbit: 43, period: 312, phase: 5.6, tilt: 0.44, spin: 0.48,
    texture: () => TEX.rockyTexture({ base: [168, 82, 46], shades: [[110, 48, 26], [214, 138, 96]], craters: 80, seed: 23 }),
    atmosphere: 0xff9a6a,
    info: {
      Diameter: '6,792 km',
      'Distance from Sun': '1.52 AU',
      'Orbital period': '687 Earth days',
      'Rotation period': '24.6 hours',
      Moons: '2 (Phobos, Deimos)',
      'Mean surface temp': '-65 °C',
      Gravity: '0.38 g'
    },
    fact: 'Olympus Mons here is the tallest volcano in the solar system — nearly three times the height of Everest.'
  },
  {
    key: 'jupiter', name: 'Jupiter', type: 'Gas giant', hex: '#d9a066',
    radius: 4.6, orbit: 66, period: 862, phase: 1.2, tilt: 0.05, spin: 1.1,
    texture: () => TEX.bandedTexture({
      seed: 9, turbulence: 1.25,
      palette: [[168, 128, 88], [232, 212, 182], [190, 140, 96], [246, 234, 214], [176, 124, 82]],
      storm: { x: 0.68, y: 0.64, rx: 0.09, ry: 0.055, color: '#c1462c' }
    }),
    info: {
      Diameter: '142,984 km',
      'Distance from Sun': '5.20 AU',
      'Orbital period': '11.86 Earth years',
      'Rotation period': '9.9 hours',
      Moons: '95',
      'Mean surface temp': '-110 °C',
      Gravity: '2.53 g'
    },
    fact: 'The Great Red Spot is a storm larger than Earth that has been raging for at least 350 years.'
  },
  {
    key: 'saturn', name: 'Saturn', type: 'Gas giant', hex: '#e3cf9a',
    radius: 4.0, orbit: 86, period: 1417, phase: 3.3, tilt: 0.47, spin: 1.0,
    texture: () => TEX.bandedTexture({
      seed: 17, turbulence: 0.7,
      palette: [[196, 172, 124], [238, 224, 186], [214, 194, 148], [246, 236, 204], [200, 176, 130]]
    }),
    rings: true,
    info: {
      Diameter: '120,536 km',
      'Distance from Sun': '9.54 AU',
      'Orbital period': '29.4 Earth years',
      'Rotation period': '10.7 hours',
      Moons: '146',
      'Mean surface temp': '-140 °C',
      Gravity: '1.06 g'
    },
    fact: 'Saturn is less dense than water, and its rings are made of billions of chunks of almost pure water ice.'
  },
  {
    key: 'uranus', name: 'Uranus', type: 'Ice giant', hex: '#8fe3e8',
    radius: 2.7, orbit: 106, period: 2520, phase: 5.0, tilt: 1.71, spin: -0.6,
    texture: () => TEX.bandedTexture({
      seed: 31, turbulence: 0.35,
      palette: [[134, 206, 212], [166, 228, 230], [146, 214, 220], [178, 234, 234]]
    }),
    atmosphere: 0x9ff0f5,
    info: {
      Diameter: '51,118 km',
      'Distance from Sun': '19.19 AU',
      'Orbital period': '84 Earth years',
      'Rotation period': '17.2 hours (retrograde)',
      Moons: '28',
      'Mean surface temp': '-195 °C',
      Gravity: '0.89 g'
    },
    fact: 'Uranus rolls around the Sun on its side, likely knocked over by a colossal ancient impact.'
  },
  {
    key: 'neptune', name: 'Neptune', type: 'Ice giant', hex: '#4a7dff',
    radius: 2.6, orbit: 124, period: 3646, phase: 2.0, tilt: 0.49, spin: 0.55,
    texture: () => TEX.bandedTexture({
      seed: 47, turbulence: 0.5,
      palette: [[40, 74, 176], [72, 116, 224], [52, 90, 200], [96, 140, 236]]
    }),
    atmosphere: 0x6f9dff,
    info: {
      Diameter: '49,528 km',
      'Distance from Sun': '30.07 AU',
      'Orbital period': '164.8 Earth years',
      'Rotation period': '16.1 hours',
      Moons: '16',
      'Mean surface temp': '-200 °C',
      Gravity: '1.14 g'
    },
    fact: 'Supersonic winds here reach 2,100 km/h — the fastest ever measured in the solar system.'
  }
];

const DEFAULT_CAM = new THREE.Vector3(0, 62, 158);

/* -------------------------------------------------------------- renderer */
const host = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
host.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'fixed';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.zIndex = '3';
document.body.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030509);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 6000);
camera.position.copy(DEFAULT_CAM);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 2.5;
controls.maxDistance = 900;
controls.minPolarAngle = 0.05;
controls.maxPolarAngle = Math.PI - 0.05;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.9;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 0.75, 0.55, 0.8
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

/* ---------------------------------------------------------------- lights */
scene.add(new THREE.AmbientLight(0x33406a, 0.55));
const sunLight = new THREE.PointLight(0xfff3e0, 4.2, 0, 0);
scene.add(sunLight);

/* ------------------------------------------------------------------ sun */
const bodies = {};
const pickables = [];

function makeLabel(text) {
  const el = document.createElement('div');
  el.className = 'planet-label';
  el.textContent = text;
  return new CSS2DObject(el);
}

function registerPickable(mesh, key) {
  mesh.userData.key = key;
  pickables.push(mesh);
}

const sunGroup = new THREE.Group();
scene.add(sunGroup);
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(SUN.radius, 64, 64),
  new THREE.MeshBasicMaterial({ map: TEX.sunTexture() })
);
sunMesh.material.color.setRGB(3.0, 2.3, 1.5);
sunGroup.add(sunMesh);
registerPickable(sunMesh, 'sun');

const glowTex = TEX.glowSprite();
[
  { size: 20, opacity: 0.85, color: 0xffd9a0 },
  { size: 42, opacity: 0.3, color: 0xff9a3c },
  { size: 78, opacity: 0.1, color: 0xff7a20 }
].forEach((g) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: g.color, transparent: true, opacity: g.opacity,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  s.scale.setScalar(g.size);
  sunGroup.add(s);
});
const sunLabel = makeLabel(SUN.name);
sunLabel.position.set(0, SUN.radius + 3.4, 0);
sunGroup.add(sunLabel);
bodies.sun = { def: SUN, group: sunGroup, mesh: sunMesh, label: sunLabel };

/* -------------------------------------------------------------- starfield */
const starSprite = TEX.starSprite();

function starField(count, rMin, rMax, size) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = rMin + Math.random() * (rMax - rMin);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi);
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const h = 0.08 + Math.random() * 0.55;
    const s = Math.random() * 0.45;
    c.setHSL(h, s, 0.72 + Math.random() * 0.28);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size, map: starSprite, vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
  });
  return new THREE.Points(geo, mat);
}

scene.add(starField(5200, 900, 2400, 7));
scene.add(starField(700, 450, 900, 16));

/* ------------------------------------------------------------ orbit lines */
const orbitGroup = new THREE.Group();
scene.add(orbitGroup);

function orbitLine(radius) {
  const pts = [];
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: 0x3d5f96, transparent: true, opacity: 0.45
  }));
}

function atmosphereShell(radius, color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.12, 48, 48),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.16,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false
    })
  );
}

/* ---------------------------------------------------------------- planets */
let moonPivot = null;
let moonMesh = null;
let earthClouds = null;

for (const p of PLANETS) {
  const group = new THREE.Group();
  scene.add(group);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.radius, 56, 56),
    new THREE.MeshStandardMaterial({ map: p.texture(), roughness: 1, metalness: 0 })
  );
  group.add(mesh);
  registerPickable(mesh, p.key);

  if (p.atmosphere) group.add(atmosphereShell(p.radius, p.atmosphere));

  if (p.clouds) {
    earthClouds = new THREE.Mesh(
      new THREE.SphereGeometry(p.radius * 1.03, 48, 48),
      new THREE.MeshStandardMaterial({
        map: TEX.cloudTexture(), transparent: true, opacity: 0.75,
        roughness: 1, metalness: 0, depthWrite: false
      })
    );
    group.add(earthClouds);
  }

  if (p.rings) {
    const inner = p.radius * 1.35;
    const outer = p.radius * 2.35;
    const geo = new THREE.RingGeometry(inner, outer, 180, 1);
    const posAttr = geo.attributes.position;
    const uvAttr = geo.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);
      uvAttr.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: TEX.ringTexture(), transparent: true, side: THREE.DoubleSide,
      depthWrite: false, opacity: 0.95, color: 0xfff2dc
    }));
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);
  }

  if (p.moon) {
    moonPivot = new THREE.Group();
    group.add(moonPivot);
    moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 32, 32),
      new THREE.MeshStandardMaterial({
        map: TEX.rockyTexture({ base: [148, 146, 142], shades: [[96, 94, 90], [196, 194, 190]], craters: 70, seed: 61 }),
        roughness: 1, metalness: 0
      })
    );
    moonMesh.position.set(4.6, 0.35, 0);
    moonPivot.add(moonMesh);
    registerPickable(moonMesh, 'earth');
  }

  group.rotation.z = p.tilt;

  const label = makeLabel(p.name);
  label.position.set(0, p.radius + 1.6, 0);
  group.add(label);

  orbitGroup.add(orbitLine(p.orbit));

  bodies[p.key] = { def: p, group, mesh, label };
}

/* ---------------------------------------------------------- asteroid belt */
const beltGroup = new THREE.Group();
scene.add(beltGroup);
{
  const COUNT = 800;
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8d8276, roughness: 1, metalness: 0, flatShading: true });
  const inst = new THREE.InstancedMesh(geo, mat, COUNT);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < COUNT; i++) {
    const r = 48 + Math.random() * 9;
    const a = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 2.6;
    dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    dummy.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
    dummy.scale.setScalar(0.06 + Math.pow(Math.random(), 2) * 0.3);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  beltGroup.add(inst);
}

/* ------------------------------------------------------------------- UI */
const clockDateEl = document.getElementById('clock-date');
const clockSimEl = document.getElementById('clock-sim');
const panel = document.getElementById('info-panel');
const speedSlider = document.getElementById('slider-speed');
const speedVal = document.getElementById('speed-val');
const btnPause = document.getElementById('btn-pause');
const btnOrbits = document.getElementById('btn-orbits');
const btnLabels = document.getElementById('btn-labels');
const btnReset = document.getElementById('btn-reset');
const chipsEl = document.getElementById('chips');

let running = true;
let speed = parseFloat(speedSlider.value);
let simDays = 0;
let selected = null;
let focusAnim = null;
const startDate = Date.now();

function chipFor(def) {
  const b = document.createElement('button');
  b.className = 'chip';
  b.dataset.key = def.key;
  b.innerHTML = `<i style="background:${def.hex}"></i>${def.name}`;
  b.addEventListener('click', () => select(def.key));
  return b;
}
chipsEl.appendChild(chipFor(SUN));
PLANETS.forEach((p) => chipsEl.appendChild(chipFor(p)));

function showPanel(def) {
  const rows = Object.entries(def.info)
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
    .join('');
  panel.innerHTML = `
    <button id="panel-close" title="Close">&times;</button>
    <h2><span class="swatch" style="background:${def.hex}; color:${def.hex}"></span>${def.name}</h2>
    <span class="type">${def.type}</span>
    <dl>${rows}</dl>
    <p class="fact">${def.fact}</p>`;
  panel.classList.remove('hidden');
  document.getElementById('panel-close').addEventListener('click', deselect);
}

function syncChips() {
  chipsEl.querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('active', !!selected && c.dataset.key === selected.def.key);
  });
}

function select(key) {
  const body = bodies[key];
  if (!body) return;
  selected = body;
  showPanel(body.def);
  syncChips();

  const target = body.group.getWorldPosition(new THREE.Vector3());
  const dir = camera.position.clone().sub(controls.target);
  if (dir.lengthSq() < 1e-4) dir.set(0.3, 0.4, 1);
  dir.normalize();
  dir.y = Math.max(dir.y, 0.25);
  dir.normalize();
  const dist = THREE.MathUtils.clamp(body.def.radius * 6, 7, 46);
  focusAnim = {
    t: 0,
    dur: 0.9,
    fromPos: camera.position.clone(),
    toPos: target.clone().add(dir.multiplyScalar(dist)),
    fromTarget: controls.target.clone(),
    toTarget: target.clone()
  };
}

function deselect() {
  selected = null;
  focusAnim = null;
  panel.classList.add('hidden');
  syncChips();
}

btnPause.addEventListener('click', () => {
  running = !running;
  btnPause.textContent = running ? 'Pause' : 'Play';
  btnPause.classList.toggle('active', !running);
});

speedSlider.addEventListener('input', () => {
  speed = parseFloat(speedSlider.value);
  speedVal.textContent = speed.toFixed(1) + ' d/s';
});

btnOrbits.addEventListener('click', () => {
  orbitGroup.visible = !orbitGroup.visible;
  btnOrbits.classList.toggle('active', orbitGroup.visible);
});

let labelsVisible = true;
btnLabels.addEventListener('click', () => {
  labelsVisible = !labelsVisible;
  btnLabels.classList.toggle('active', labelsVisible);
  Object.values(bodies).forEach((b) => {
    b.label.visible = labelsVisible;
    b.label.element.style.display = labelsVisible ? '' : 'none';
  });
});

btnReset.addEventListener('click', resetView);

function resetView() {
  deselect();
  focusAnim = {
    t: 0,
    dur: 1.0,
    fromPos: camera.position.clone(),
    toPos: DEFAULT_CAM.clone(),
    fromTarget: controls.target.clone(),
    toTarget: new THREE.Vector3(0, 0, 0)
  };
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    btnPause.click();
  } else if (e.code === 'Escape') {
    deselect();
  } else if (e.key === 'r' || e.key === 'R') {
    resetView();
  } else if (e.key === 'o' || e.key === 'O') {
    btnOrbits.click();
  } else if (e.key === 'l' || e.key === 'L') {
    btnLabels.click();
  }
});

/* ------------------------------------------------------------- picking */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;

function setPointer(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  downAt = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const dx = e.clientX - downAt.x;
  const dy = e.clientY - downAt.y;
  downAt = null;
  if (dx * dx + dy * dy > 25) return;
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  if (hits.length) select(hits[0].object.userData.key);
  else deselect();
});

let hoverPending = false;
renderer.domElement.addEventListener('pointermove', (e) => {
  if (hoverPending) return;
  hoverPending = true;
  requestAnimationFrame(() => {
    hoverPending = false;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    renderer.domElement.style.cursor = hits.length ? 'pointer' : 'grab';
  });
});

/* -------------------------------------------------------------- resize */
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  labelRenderer.setSize(w, h);
});

/* --------------------------------------------------------------- loop */
const clock = new THREE.Clock();
const _target = new THREE.Vector3();
const _delta = new THREE.Vector3();
let clockTimer = 0;

function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateClock() {
  const d = new Date(startDate + simDays * 86400000);
  clockDateEl.textContent = d.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  clockSimEl.textContent = `+${Math.floor(simDays)} sim days · ${speed.toFixed(1)} d/s`;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (running) simDays += dt * speed;

  for (const p of PLANETS) {
    const b = bodies[p.key];
    const angle = p.phase + (simDays / p.period) * Math.PI * 2;
    b.group.position.set(Math.cos(angle) * p.orbit, 0, Math.sin(angle) * p.orbit);
    b.mesh.rotation.y = simDays * p.spin;
  }

  sunMesh.rotation.y = simDays * SUN.spin;
  if (moonPivot) moonPivot.rotation.y = simDays * 0.23;
  if (moonMesh) moonMesh.rotation.y = simDays * 0.12;
  if (earthClouds) earthClouds.rotation.y = simDays * 0.62;
  beltGroup.rotation.y = simDays * 0.0042;

  if (focusAnim) {
    focusAnim.t = Math.min(1, focusAnim.t + dt / focusAnim.dur);
    const k = ease(focusAnim.t);
    camera.position.lerpVectors(focusAnim.fromPos, focusAnim.toPos, k);
    controls.target.lerpVectors(focusAnim.fromTarget, focusAnim.toTarget, k);
    if (focusAnim.t >= 1) focusAnim = null;
  } else if (selected) {
    selected.group.getWorldPosition(_target);
    _delta.copy(_target).sub(controls.target);
    controls.target.copy(_target);
    camera.position.add(_delta);
  }

  controls.update();

  clockTimer += dt;
  if (clockTimer > 0.25) {
    clockTimer = 0;
    updateClock();
  }

  composer.render();
  labelRenderer.render(scene, camera);
}

updateClock();
animate();
