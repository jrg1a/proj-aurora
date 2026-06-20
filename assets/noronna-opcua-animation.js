(function () {
  'use strict';

  const root = document.querySelector('[data-opcua-animation]');
  if (!root) return;

  const sceneEl = root.querySelector('[data-opcua-scene]');
  const labelEl = root.querySelector('[data-opcua-labels]');
  const fallback = root.querySelector('[data-opcua-fallback]');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!sceneEl || !labelEl || !window.THREE) {
    root.classList.add('is-unavailable');
    if (fallback) fallback.textContent = '3D-scenen kunne ikke lastes fordi Three.js mangler.';
    return;
  }

  let width = root.clientWidth || 1200;
  let height = root.clientHeight || 620;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  sceneEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xd2dee2, 0.0032);
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 900);
  const target = new THREE.Vector3(14, 8, 0);

  // ---- Daytime sky dome ----
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x79a7cf) },
      mid: { value: new THREE.Color(0xb0cbdd) },
      hor: { value: new THREE.Color(0xe9eeec) }
    },
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: [
      'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 hor;',
      'void main(){ float h=normalize(vP).y;',
      ' vec3 c=mix(hor,mid,smoothstep(-0.02,0.2,h));',
      ' c=mix(c,top,smoothstep(0.18,0.6,h));',
      ' gl_FragColor=vec4(c,1.0);}'
    ].join('\n')
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), skyMat));

  // ---- Lights ----
  scene.add(new THREE.HemisphereLight(0xbcd6e8, 0x2a4654, 0.85));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.25);
  sun.position.set(90, 120, 55);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x8398aa, 0.4));

  // ---- Sea ----
  const SEA = 700;
  const SEG = 96;
  const seaGeo = new THREE.PlaneGeometry(SEA, SEA, SEG, SEG);
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: 0x2c6c84, metalness: 0.12, roughness: 0.34 }));
  sea.rotation.x = -Math.PI / 2;
  scene.add(sea);
  const seaPos = seaGeo.attributes.position;
  const bX = [];
  const bY = [];
  for (let i = 0; i < seaPos.count; i += 1) { bX.push(seaPos.getX(i)); bY.push(seaPos.getY(i)); }
  function wave(a, b, t, s) { return (Math.sin(a * 0.05 + t * 0.8) * 0.7 + Math.sin(b * 0.08 + t * 1.0) * 0.5 + Math.sin((a + b) * 0.04 - t * 0.6) * 0.45) * s; }
  function seaH(wx, wz, t, s) { return wave(wx, -wz, t, s); }

  // ---- Shared materials ----
  const matSteel = new THREE.MeshStandardMaterial({ color: 0x7a838e, metalness: 0.7, roughness: 0.5 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x515962, metalness: 0.65, roughness: 0.55 });
  const matLight = new THREE.MeshStandardMaterial({ color: 0xc6cdd4, metalness: 0.35, roughness: 0.6 });
  const matYellow = new THREE.MeshStandardMaterial({ color: 0xf2b21e, metalness: 0.3, roughness: 0.5 });
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
  function cyl(rt, rb, h, m, s) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s || 14), m); }

  // ============================================================
  //  NORØNNA — offshore platform
  // ============================================================
  const rig = new THREE.Group();
  scene.add(rig);
  const deckY = 11;
  const legPos = [[-6, -6], [6, -6], [6, 6], [-6, 6]];
  for (let l = 0; l < 4; l += 1) { const leg = cyl(0.7, 0.95, 22, matSteel, 12); leg.position.set(legPos[l][0] * 0.85, deckY - 9, legPos[l][1] * 0.85); rig.add(leg); }
  function brace(ax, ay, az, bx, by, bz) {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const len = a.distanceTo(b);
    const m = cyl(0.22, 0.22, len, matDark, 8);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    rig.add(m);
  }
  const pBrace = legPos.map((q) => [q[0] * 0.9, q[1] * 0.9]);
  for (let e = 0; e < 4; e += 1) { const n = (e + 1) % 4; brace(pBrace[e][0], 3, pBrace[e][1], pBrace[n][0], 8, pBrace[n][1]); brace(pBrace[e][0], 8, pBrace[e][1], pBrace[n][0], 3, pBrace[n][1]); }
  const deck = box(15, 1.2, 15, matDark); deck.position.y = deckY; rig.add(deck);
  const deck2 = box(13.5, 0.4, 13.5, matSteel); deck2.position.y = deckY + 0.8; rig.add(deck2);
  const accom = box(7, 5, 6, matLight); accom.position.set(-3.5, deckY + 3.6, -3); rig.add(accom);
  for (let wq = 0; wq < 2; wq += 1) {
    const win = box(7.05, 0.5, 0.05, new THREE.MeshStandardMaterial({ color: 0x24323d, emissive: 0x8fb9d8, emissiveIntensity: 0.25 }));
    win.position.set(-3.5, deckY + 3 + wq * 1.4, -0.05); rig.add(win);
  }
  const proc = box(6, 3.5, 7, matDark); proc.position.set(4, deckY + 2.85, 2); rig.add(proc);
  for (let pp = 0; pp < 3; pp += 1) { const pipe = cyl(0.25, 0.25, 7, matYellow, 8); pipe.rotation.z = Math.PI / 2; pipe.position.set(4, deckY + 1.6 + pp * 0.7, 2 + (pp - 1) * 1.6); rig.add(pipe); }
  // derrick
  const derrick = new THREE.Group(); derrick.position.set(0.5, deckY + 1, -1);
  const dh = 14;
  const db = 3.2;
  const dt = 1.1;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let c = 0; c < 4; c += 1) {
    const bx = corners[c][0] * db;
    const bz = corners[c][1] * db;
    const tx = corners[c][0] * dt;
    const tz = corners[c][1] * dt;
    const a2 = new THREE.Vector3(bx, 0, bz);
    const b2 = new THREE.Vector3(tx, dh, tz);
    const len2 = a2.distanceTo(b2);
    const leg2 = cyl(0.16, 0.16, len2, matSteel, 8);
    leg2.position.copy(a2).add(b2).multiplyScalar(0.5);
    leg2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b2.clone().sub(a2).normalize());
    derrick.add(leg2);
  }
  for (let r = 0; r < 4; r += 1) { const ry = r / 3; const w = db + (dt - db) * ry; const ring2 = new THREE.Mesh(new THREE.TorusGeometry(w * 1.32, 0.1, 6, 4), matDark); ring2.rotation.x = Math.PI / 2; ring2.rotation.z = Math.PI / 4; ring2.position.y = dh * ry; derrick.add(ring2); }
  rig.add(derrick);
  // helideck
  const heli = cyl(5, 5, 0.4, matDark, 28); heli.position.set(-9.5, deckY + 5.5, 4); rig.add(heli);
  const hring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.12, 8, 40), matYellow); hring.rotation.x = Math.PI / 2; hring.position.set(-9.5, deckY + 5.72, 4); rig.add(hring);
  const hl = box(0.4, 0.08, 3, matYellow); hl.position.set(-10.5, deckY + 5.75, 4); rig.add(hl);
  const hr = box(0.4, 0.08, 3, matYellow); hr.position.set(-8.5, deckY + 5.75, 4); rig.add(hr);
  const hc = box(2, 0.08, 0.4, matYellow); hc.position.set(-9.5, deckY + 5.75, 4); rig.add(hc);
  const strut = cyl(0.3, 0.3, 5, matSteel, 8); strut.rotation.z = 0.5; strut.position.set(-7, deckY + 3, 4); rig.add(strut);
  // crane
  const craneBase = cyl(0.9, 1.1, 3, matYellow, 12); craneBase.position.set(6.5, deckY + 2, -4.5); rig.add(craneBase);
  const boom = box(0.6, 0.6, 11, matYellow); boom.rotation.x = 0.55; boom.position.set(6.5, deckY + 4.5, -1); rig.add(boom);
  // flare
  const flareBoom = cyl(0.35, 0.45, 16, matSteel, 8); flareBoom.position.set(11, deckY + 6, 6); flareBoom.rotation.z = -0.6; flareBoom.rotation.x = 0.4; rig.add(flareBoom);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a3c, transparent: true, opacity: 0.92 });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3, 12), flameMat);
  const flameTip = new THREE.Vector3(17.5, deckY + 13, 8.6); flame.position.copy(flameTip); scene.add(flame);
  const flameLight = new THREE.PointLight(0xff7a30, 1.6, 40); flameLight.position.copy(flameTip); scene.add(flameLight);
  // mast + beacons
  const mast = cyl(0.18, 0.25, 10, matSteel, 8); mast.position.set(-3.5, deckY + 11, -3); rig.add(mast);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), matLight); dish.position.set(-3.5, deckY + 15.5, -3); dish.rotation.x = Math.PI * 0.55; dish.rotation.z = 0.6; rig.add(dish);
  const beaconN = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true })); beaconN.position.set(-3.5, deckY + 16.3, -3); rig.add(beaconN);
  const beaconD = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true })); beaconD.position.set(0.5, deckY + 15.3, -1); rig.add(beaconD);
  const mastTip = new THREE.Vector3(-3.5, deckY + 16.3, -3);
  const foam = new THREE.Mesh(new THREE.TorusGeometry(9, 0.3, 6, 40), new THREE.MeshBasicMaterial({ color: 0xbfe0e8, transparent: true, opacity: 0.4 })); foam.rotation.x = Math.PI / 2; foam.position.y = 0.2; rig.add(foam);

  // ============================================================
  //  AURORA — onshore carbon-capture facility (CCS) + quay
  // ============================================================
  const shore = new THREE.Group();
  shore.position.set(95, 0, -28);
  scene.add(shore);
  const land = box(80, 2, 46, new THREE.MeshStandardMaterial({ color: 0x3c5a48, metalness: 0.1, roughness: 0.95 })); land.position.y = 1; shore.add(land);
  const matPlant = new THREE.MeshStandardMaterial({ color: 0x9aa6ae, metalness: 0.45, roughness: 0.5 });
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xdfe6ea, metalness: 0.2, roughness: 0.6 });
  // absorber/stripper columns
  function column(x, z, h, rr) {
    const col = cyl(rr, rr, h, matWhite, 18); col.position.set(x, 2 + h / 2, z); shore.add(col);
    for (let b = 1; b < 3; b += 1) { const bd = new THREE.Mesh(new THREE.TorusGeometry(rr + 0.15, 0.12, 6, 18), matPlant); bd.rotation.x = Math.PI / 2; bd.position.set(x, 2 + h * b / 3, z); shore.add(bd); }
  }
  column(-22, 6, 18, 1.6); column(-16, 8, 14, 1.3); column(-10, 4, 16, 1.4);
  // CO2 storage spheres
  function sphereTank(x, z, rr) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(rr, 20, 16), matWhite); s.position.set(x, 2 + rr, z); shore.add(s);
    for (let k = 0; k < 4; k += 1) { const leg = cyl(0.18, 0.18, rr, matPlant, 8); const ang = k / 4 * Math.PI * 2; leg.position.set(x + Math.cos(ang) * rr * 0.7, 2 + rr * 0.4, z + Math.sin(ang) * rr * 0.7); shore.add(leg); }
  }
  sphereTank(2, 12, 4); sphereTank(12, 14, 3.2);
  // cylindrical tanks + buildings
  const t1 = cyl(3, 3, 7, matPlant, 20); t1.position.set(-2, 5.5, 2); shore.add(t1);
  const b1 = box(9, 7, 7, new THREE.MeshStandardMaterial({ color: 0x6b7884, metalness: 0.4, roughness: 0.6 })); b1.position.set(16, 5.5, -2); shore.add(b1);
  const b2 = box(6, 5, 6, matPlant); b2.position.set(24, 4.5, 4); shore.add(b2);
  // stacks with vapor
  function stack(x, z) {
    const s = cyl(0.7, 0.9, 12, matWhite, 12); s.position.set(x, 8, z); shore.add(s);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 6, 16), matYellow); ring.rotation.x = Math.PI / 2; ring.position.set(x, 13.8, z); shore.add(ring);
    const puffs = [];
    for (let k = 0; k < 5; k += 1) { const pf = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 })); pf.position.set(x, 14, z); shore.add(pf); puffs.push({ m: pf, o: k / 5, bx: x, bz: z }); }
    return puffs;
  }
  const vapor = stack(-28, -2).concat(stack(20, -6));
  // jetty / quay reaching toward platform
  const quay = box(26, 1, 5, new THREE.MeshStandardMaterial({ color: 0x55626c, metalness: 0.3, roughness: 0.7 }));
  quay.position.set(95 - 40, 1.4, -28 + 12); scene.add(quay);
  // pipework on land
  for (let pq = 0; pq < 4; pq += 1) { const pipe2 = cyl(0.3, 0.3, 18, matYellow, 8); pipe2.rotation.z = Math.PI / 2; pipe2.position.set(-6, 4 + pq * 0.0, -8 + pq * 1.4); shore.add(pipe2); }
  const shoreAnchor = new THREE.Vector3(95 - 14, 17, -28 + 4);

  // ============================================================
  //  OPC UA conduit + packets
  // ============================================================
  const curve = new THREE.QuadraticBezierCurve3(mastTip.clone(), new THREE.Vector3(46, 48, -14), shoreAnchor.clone());
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.2, 8, false), new THREE.MeshBasicMaterial({ color: 0x18b8ac, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(tube);
  const packets = [];
  const NPK = 14;
  const pkGeo = new THREE.SphereGeometry(0.34, 10, 10);
  const pkMat = new THREE.MeshBasicMaterial({ color: 0x0affe6 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x18d8c8, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let k = 0; k < NPK; k += 1) { const g = new THREE.Group(); g.add(new THREE.Mesh(pkGeo, pkMat)); g.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 10), glowMat)); scene.add(g); packets.push({ obj: g, t: k / NPK, dir: (k % 3 === 0) ? -1 : 1, sp: 0.05 + Math.random() * 0.03 }); }

  // ============================================================
  //  Ships (shuttle between platform and facility)
  // ============================================================
  function buildShip(opt) {
    const s = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({ color: opt.hull, metalness: 0.4, roughness: 0.55 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x53606a, metalness: 0.4, roughness: 0.6 });
    const L = opt.len || 6.5;
    const Wd = opt.wid || 1.8;
    const hull = box(Wd, 0.9, L, hullMat); hull.position.y = 0; s.add(hull);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(Wd * 0.5, 2.2, 14), hullMat); bow.rotation.x = -Math.PI / 2; bow.position.set(0, 0, L / 2 + 0.6); s.add(bow);
    const dk = box(Wd * 0.92, 0.18, L * 0.96, deckMat); dk.position.y = 0.5; s.add(dk);
    if (opt.type === 'co2') {
      for (let i2 = 0; i2 < 3; i2 += 1) { const tk = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), matWhite); tk.position.set(0, 1.25, (i2 - 1) * 1.7); s.add(tk); const sad = cyl(0.5, 0.5, 0.5, deckMat, 12); sad.position.set(0, 0.7, (i2 - 1) * 1.7); s.add(sad); }
      const house = box(Wd * 0.85, 1.3, 1.4, matWhite); house.position.set(0, 1.25, -L / 2 + 1.2); s.add(house);
    } else if (opt.type === 'psv') {
      const house2 = box(Wd * 0.9, 1.6, 1.8, matWhite); house2.position.set(0, 1.4, L / 2 - 1.6); s.add(house2);
      for (let c2 = 0; c2 < 2; c2 += 1) { const cargo = box(0.9, 0.7, 1.1, matYellow); cargo.position.set((c2 - 0.5) * 0.9, 0.85, -0.5); s.add(cargo); }
      const cmast = cyl(0.1, 0.1, 2, matSteel, 8); cmast.position.set(0, 2.2, L / 2 - 1.6); s.add(cmast);
    } else {
      const cab = box(Wd * 0.8, 1.0, 1.6, matWhite); cab.position.set(0, 1.0, 0.2); s.add(cab);
    }
    // window strip
    const win = box(Wd * 0.7, 0.3, 0.05, new THREE.MeshStandardMaterial({ color: 0x223038, emissive: 0x9fc7e0, emissiveIntensity: 0.3 }));
    win.position.set(0, 1.3, (opt.type === 'psv') ? (L / 2 - 0.75) : ((opt.type === 'co2') ? (-L / 2 + 1.95) : 0.95)); s.add(win);
    // funnel
    const fn = cyl(0.22, 0.26, 0.9, new THREE.MeshStandardMaterial({ color: opt.funnel || 0xcc3a2a }), 10); fn.position.set(0, 1.9, (opt.type === 'psv') ? (L / 2 - 2.1) : (-L / 2 + 1.1)); s.add(fn);
    // wake
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(Wd * 2.6, 7), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
    wake.rotation.x = -Math.PI / 2; wake.position.set(0, -0.25, -L / 2 - 3); s.add(wake);
    const bowfoam = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    bowfoam.rotation.x = -Math.PI / 2; bowfoam.position.set(0, -0.2, L / 2 + 0.8); s.add(bowfoam);
    if (opt.scale) s.scale.setScalar(opt.scale);
    scene.add(s); return s;
  }
  function qbez(A, C, B, u) { const m = 1 - u; return new THREE.Vector3(m * m * A.x + 2 * m * u * C.x + u * u * B.x, m * m * A.y + 2 * m * u * C.y + u * u * B.y, m * m * A.z + 2 * m * u * C.z + u * u * B.z); }
  function qtan(A, C, B, u) { const m = 1 - u; return new THREE.Vector3(2 * m * (C.x - A.x) + 2 * u * (B.x - C.x), 0, 2 * m * (C.z - A.z) + 2 * u * (B.z - C.z)); }

  const ships = [
    { obj: buildShip({ type: 'co2', hull: 0x2b3a44, len: 8, wid: 2, funnel: 0x1f6f64 }), A: new THREE.Vector3(14, 0, 12), C: new THREE.Vector3(45, 0, 6), B: new THREE.Vector3(72, 0, -14), u: 0.05, dir: 1, sp: 0.045 },
    { obj: buildShip({ type: 'psv', hull: 0xd2542a, len: 6.5, wid: 1.8 }), A: new THREE.Vector3(70, 0, -20), C: new THREE.Vector3(40, 0, -16), B: new THREE.Vector3(10, 0, 5), u: 0.4, dir: 1, sp: 0.05 },
    { obj: buildShip({ type: 'crew', hull: 0x315a78, len: 4, wid: 1.4, scale: 0.8, funnel: 0x2b4a64 }), A: new THREE.Vector3(20, 0, 17), C: new THREE.Vector3(48, 0, 15), B: new THREE.Vector3(68, 0, -8), u: 0.7, dir: -1, sp: 0.075 }
  ];

  // ---- Birds ----
  const birds = [];
  for (let bi = 0; bi < 5; bi += 1) {
    const bg = new THREE.Group();
    const wm = new THREE.MeshBasicMaterial({ color: 0x33404a });
    const wL = box(1.4, 0.06, 0.3, wm); wL.position.x = -0.7; wL.rotation.z = 0.3;
    const wR = box(1.4, 0.06, 0.3, wm); wR.position.x = 0.7; wR.rotation.z = -0.3;
    bg.add(wL); bg.add(wR);
    bg.position.set(-40 + bi * 22, 34 + bi * 4, -30 + bi * 10);
    scene.add(bg);
    birds.push({ obj: bg, wL: wL, wR: wR, sp: 2 + bi * 0.4, ph: bi * 1.3 });
  }

  // ---- Floating labels ----
  function mkLabel(cls, name, meta, color) {
    const d = document.createElement('div');
    d.className = 'opcua-animation-label ' + cls;
    d.style.color = color;
    d.innerHTML = '<span class="marker"></span><span class="name">' + name + '</span><span class="meta">' + meta + '</span>';
    labelEl.appendChild(d);
    return d;
  }
  const labels = [
    { el: mkLabel('site', 'NORØNNA', 'Offshore · VLAN 70 · SL-T 3', '#f2b21e'), pos: new THREE.Vector3(-3.5, deckY + 18, -3) },
    { el: mkLabel('site', 'AURORA', 'Onshore · Karbonfangst (CCS)', '#f2b21e'), pos: shoreAnchor.clone().add(new THREE.Vector3(0, 5, 0)) },
    { el: mkLabel('conduit', 'OPC UA', 'tcp/46040-46041 · DataHub ↔ UaWrapper', '#35e0d0'), pos: curve.getPoint(0.5).clone().add(new THREE.Vector3(0, 2, 0)) }
  ];
  const proj = new THREE.Vector3();
  function updateLabels() {
    for (let n = 0; n < labels.length; n += 1) {
      proj.copy(labels[n].pos).project(camera);
      const vis = proj.z < 1;
      const x = (proj.x * 0.5 + 0.5) * width;
      const y = (-proj.y * 0.5 + 0.5) * height;
      const st = labels[n].el.style;
      st.opacity = vis ? '1' : '0';
      st.left = x + 'px';
      st.top = y + 'px';
    }
  }

  // ---- Orbit ----
  let theta = 0.55;
  let phi = 1.16;
  const radius = 86;
  let autoRotate = true;
  let idleT = 0;
  let dragging = false;
  let lx = 0;
  let ly = 0;
  function down(x, y) { dragging = true; autoRotate = false; idleT = 0; lx = x; ly = y; }
  function moveP(x, y) { if (!dragging) return; theta -= (x - lx) * 0.005; phi -= (y - ly) * 0.005; phi = Math.max(0.45, Math.min(1.45, phi)); lx = x; ly = y; }
  function up() { dragging = false; idleT = 0; }
  sceneEl.addEventListener('mousedown', (e) => down(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => moveP(e.clientX, e.clientY));
  window.addEventListener('mouseup', up);
  sceneEl.addEventListener('touchstart', (e) => { if (e.touches[0]) down(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  window.addEventListener('touchmove', (e) => { if (e.touches[0]) moveP(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  window.addEventListener('touchend', up);

  function resize() {
    width = root.clientWidth || 1200;
    height = root.clientHeight || 620;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(resize);
    observer.observe(root);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- Loop ----
  const clock = new THREE.Clock();
  const pkt = new THREE.Vector3();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const ws = reduce ? 0.3 : 1;
    const mo = reduce ? 0.4 : 1;

    for (let i = 0; i < seaPos.count; i += 1) seaPos.setZ(i, wave(bX[i], bY[i], t, ws));
    seaPos.needsUpdate = true; seaGeo.computeVertexNormals();

    // flame + beacons
    const fl = 0.85 + Math.sin(t * 22) * 0.1 + Math.sin(t * 9) * 0.06; flame.scale.set(0.9 + Math.sin(t * 15) * 0.08, fl, 0.9 + Math.cos(t * 17) * 0.08);
    flameLight.intensity = 1.4 + Math.sin(t * 20) * 0.5; flameMat.opacity = 0.9 + Math.sin(t * 13) * 0.08;
    const blink = (Math.sin(t * 3) > 0.6) ? 1 : 0.15; beaconN.material.opacity = blink; beaconD.material.opacity = blink;

    // vapor puffs
    for (let v = 0; v < vapor.length; v += 1) { const pf = vapor[v]; const ph = (t * 0.12 + pf.o) % 1; pf.m.position.y = 14 + ph * 9; pf.m.position.x = pf.bx + Math.sin(ph * 6 + v) * 0.8; pf.m.position.z = pf.bz + Math.cos(ph * 5 + v) * 0.6; pf.m.scale.setScalar(0.6 + ph * 1.8); pf.m.material.opacity = Math.max(0, 0.5 * (1 - ph)); }

    // packets
    for (let k = 0; k < packets.length; k += 1) { const P = packets[k]; P.t += P.dir * P.sp * dt * mo; if (P.t > 1) P.t -= 1; if (P.t < 0) P.t += 1; curve.getPoint(P.t, pkt); P.obj.position.copy(pkt); P.obj.scale.setScalar(0.8 + Math.sin(t * 6 + k) * 0.2); }

    // ships
    for (let sI = 0; sI < ships.length; sI += 1) {
      const sh = ships[sI];
      sh.u += sh.dir * sh.sp * dt * mo; if (sh.u > 1) { sh.u = 1; sh.dir = -1; } if (sh.u < 0) { sh.u = 0; sh.dir = 1; }
      const pos = qbez(sh.A, sh.C, sh.B, sh.u);
      const tan = qtan(sh.A, sh.C, sh.B, sh.u);
      const hy = seaH(pos.x, pos.z, t, ws);
      sh.obj.position.set(pos.x, hy + 0.25, pos.z);
      sh.obj.rotation.y = Math.atan2(tan.x * sh.dir, tan.z * sh.dir);
      sh.obj.rotation.z = Math.sin(t * 1.3 + sI) * 0.04;
      sh.obj.rotation.x = Math.sin(t * 0.9 + sI) * 0.03;
    }

    // birds
    for (let bI = 0; bI < birds.length; bI += 1) {
      const br = birds[bI];
      br.obj.position.x += dt * br.sp * mo; if (br.obj.position.x > 70) br.obj.position.x = -55;
      br.obj.position.y = 34 + bI * 4 + Math.sin(t * 0.6 + br.ph) * 1.5;
      const flap = Math.sin(t * br.sp * 2 + br.ph) * 0.5; br.wL.rotation.z = 0.3 + flap; br.wR.rotation.z = -0.3 - flap;
    }

    if (autoRotate && !reduce) theta += 0.0008;
    if (!dragging) { idleT += dt; if (idleT > 3.5) autoRotate = true; }
    camera.position.set(target.x + radius * Math.sin(phi) * Math.sin(theta), target.y + radius * Math.cos(phi), target.z + radius * Math.sin(phi) * Math.cos(theta));
    camera.lookAt(target);
    updateLabels();
    renderer.render(scene, camera);
  }
  animate();
})();
