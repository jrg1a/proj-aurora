(function () {
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

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  sceneEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x2b3744, 0.0042);

  let width = root.clientWidth || 1200;
  let height = root.clientHeight || 620;
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 800);
  const target = new THREE.Vector3(38, 12, -12);

  const skyGeo = new THREE.SphereGeometry(500, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x0a1828) },
      mid: { value: new THREE.Color(0x294056) },
      hor: { value: new THREE.Color(0xc9824a) }
    },
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: [
      'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 hor;',
      'void main(){',
      '  float h = normalize(vP).y;',
      '  vec3 c = mix(hor, mid, smoothstep(-0.02, 0.18, h));',
      '  c = mix(c, top, smoothstep(0.15, 0.6, h));',
      '  gl_FragColor = vec4(c, 1.0);',
      '}'
    ].join('\n')
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  scene.add(new THREE.HemisphereLight(0x6b8aa8, 0x0c1c28, 0.65));
  const sun = new THREE.DirectionalLight(0xffd7a0, 1.15);
  sun.position.set(120, 26, -70);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x22303c, 0.5));

  const seaGeo = new THREE.PlaneGeometry(600, 600, 90, 90);
  const seaMat = new THREE.MeshStandardMaterial({ color: 0x0c1f2e, metalness: 0.15, roughness: 0.28 });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.rotation.x = -Math.PI / 2;
  scene.add(sea);

  const seaPos = seaGeo.attributes.position;
  const seaBaseX = [];
  const seaBaseY = [];
  for (let i = 0; i < seaPos.count; i += 1) {
    seaBaseX.push(seaPos.getX(i));
    seaBaseY.push(seaPos.getY(i));
  }

  const matSteel = new THREE.MeshStandardMaterial({ color: 0x6e7884, metalness: 0.75, roughness: 0.5 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x4a525c, metalness: 0.7, roughness: 0.55 });
  const matLight = new THREE.MeshStandardMaterial({ color: 0xb9c2cb, metalness: 0.4, roughness: 0.6 });
  const matYellow = new THREE.MeshStandardMaterial({ color: 0xf2b21e, metalness: 0.3, roughness: 0.5 });

  function box(w, h, d, material) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  }

  function cyl(rt, rb, h, material, seg) {
    return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), material);
  }

  const rig = new THREE.Group();
  scene.add(rig);

  const legX = 6;
  const legZ = 6;
  const deckY = 11;
  const legPos = [[-legX, -legZ], [legX, -legZ], [legX, legZ], [-legX, legZ]];

  legPos.forEach(([x, z]) => {
    const leg = cyl(0.7, 0.95, 22, matSteel, 12);
    leg.position.set(x * 0.85, deckY - 9, z * 0.85);
    rig.add(leg);
  });

  function brace(ax, ay, az, bx, by, bz) {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const len = a.distanceTo(b);
    const mesh = cyl(0.22, 0.22, len, matDark, 8);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    rig.add(mesh);
  }

  const p = legPos.map((q) => [q[0] * 0.9, q[1] * 0.9]);
  for (let edge = 0; edge < 4; edge += 1) {
    const next = (edge + 1) % 4;
    brace(p[edge][0], 3, p[edge][1], p[next][0], 8, p[next][1]);
    brace(p[edge][0], 8, p[edge][1], p[next][0], 3, p[next][1]);
  }

  const deck = box(15, 1.2, 15, matDark);
  deck.position.y = deckY;
  rig.add(deck);

  const deck2 = box(13.5, 0.4, 13.5, matSteel);
  deck2.position.y = deckY + 0.8;
  rig.add(deck2);

  const accom = box(7, 5, 6, matLight);
  accom.position.set(-3.5, deckY + 3.6, -3);
  rig.add(accom);

  const windowMat = new THREE.MeshStandardMaterial({ color: 0x1b2a36, emissive: 0xffcf8a, emissiveIntensity: 0.5 });
  for (let i = 0; i < 2; i += 1) {
    const strip = box(7.05, 0.5, 0.05, windowMat);
    strip.position.set(-3.5, deckY + 3 + i * 1.4, -0.05);
    rig.add(strip);
  }

  const proc = box(6, 3.5, 7, matDark);
  proc.position.set(4, deckY + 2.85, 2);
  rig.add(proc);

  for (let i = 0; i < 3; i += 1) {
    const pipe = cyl(0.25, 0.25, 7, matYellow, 8);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(4, deckY + 1.6 + i * 0.7, 2 + (i - 1) * 1.6);
    rig.add(pipe);
  }

  const derrick = new THREE.Group();
  derrick.position.set(0.5, deckY + 1, -1);
  const dh = 14;
  const db = 3.2;
  const dt = 1.1;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

  corners.forEach(([cx, cz]) => {
    const a = new THREE.Vector3(cx * db, 0, cz * db);
    const b = new THREE.Vector3(cx * dt, dh, cz * dt);
    const len = a.distanceTo(b);
    const leg = cyl(0.16, 0.16, len, matSteel, 8);
    leg.position.copy(a).add(b).multiplyScalar(0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    derrick.add(leg);
  });

  for (let r = 0; r < 4; r += 1) {
    const ry = r / 3;
    const w = db + (dt - db) * ry;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(w * 1.32, 0.1, 6, 4), matDark);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = Math.PI / 4;
    ring.position.y = dh * ry;
    derrick.add(ring);
  }
  rig.add(derrick);

  const heli = cyl(5, 5, 0.4, matDark, 28);
  heli.position.set(-9.5, deckY + 5.5, 4);
  rig.add(heli);

  const heliRing = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.12, 8, 40), matYellow);
  heliRing.rotation.x = Math.PI / 2;
  heliRing.position.set(-9.5, deckY + 5.72, 4);
  rig.add(heliRing);

  const hLeft = box(0.4, 0.08, 3, matYellow);
  const hRight = box(0.4, 0.08, 3, matYellow);
  const hCross = box(2, 0.08, 0.4, matYellow);
  hLeft.position.set(-10.5, deckY + 5.75, 4);
  hRight.position.set(-8.5, deckY + 5.75, 4);
  hCross.position.set(-9.5, deckY + 5.75, 4);
  rig.add(hLeft, hRight, hCross);

  const strut = cyl(0.3, 0.3, 5, matSteel, 8);
  strut.rotation.z = 0.5;
  strut.position.set(-7, deckY + 3, 4);
  rig.add(strut);

  const craneBase = cyl(0.9, 1.1, 3, matYellow, 12);
  craneBase.position.set(6.5, deckY + 2, -4.5);
  rig.add(craneBase);

  const boom = box(0.6, 0.6, 11, matYellow);
  boom.rotation.x = 0.55;
  boom.position.set(6.5, deckY + 4.5, -1);
  rig.add(boom);

  const flareBoom = cyl(0.35, 0.45, 16, matSteel, 8);
  flareBoom.position.set(11, deckY + 6, 6);
  flareBoom.rotation.z = -0.6;
  flareBoom.rotation.x = 0.4;
  rig.add(flareBoom);

  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8a3c, transparent: true, opacity: 0.95 });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3, 12), flameMat);
  const flameTip = new THREE.Vector3(17.5, deckY + 13, 8.6);
  flame.position.copy(flameTip);
  scene.add(flame);

  const flameLight = new THREE.PointLight(0xff7a30, 2.2, 40);
  flameLight.position.copy(flameTip);
  scene.add(flameLight);

  const mast = cyl(0.18, 0.25, 10, matSteel, 8);
  mast.position.set(-3.5, deckY + 11, -3);
  rig.add(mast);

  const dish = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), matLight);
  dish.position.set(-3.5, deckY + 15.5, -3);
  dish.rotation.x = Math.PI * 0.55;
  dish.rotation.z = 0.6;
  rig.add(dish);

  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true });
  const beaconN = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), beaconMat.clone());
  beaconN.position.set(-3.5, deckY + 16.3, -3);
  rig.add(beaconN);

  const beaconD = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), beaconMat.clone());
  beaconD.position.set(0.5, deckY + 15.3, -1);
  rig.add(beaconD);

  const mastTip = new THREE.Vector3(-3.5, deckY + 16.3, -3);
  const foam = new THREE.Mesh(new THREE.TorusGeometry(9, 0.3, 6, 40), new THREE.MeshBasicMaterial({ color: 0x6fa8b8, transparent: true, opacity: 0.35 }));
  foam.rotation.x = Math.PI / 2;
  foam.position.y = 0.2;
  rig.add(foam);

  const shore = new THREE.Group();
  shore.position.set(95, 0, -28);
  scene.add(shore);

  const land = box(70, 2, 40, new THREE.MeshStandardMaterial({ color: 0x223240, metalness: 0.2, roughness: 0.9 }));
  land.position.y = 1;
  shore.add(land);

  function shoreBox(w, h, d, x, z, emi) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x586876,
      metalness: 0.4,
      roughness: 0.6,
      emissive: 0xffcf8a,
      emissiveIntensity: emi || 0
    });
    const mesh = box(w, h, d, material);
    mesh.position.set(x, 2 + h / 2, z);
    shore.add(mesh);
    return mesh;
  }

  shoreBox(8, 9, 6, -14, 4, 0.25);
  shoreBox(6, 6, 6, -4, -6, 0.15);
  shoreBox(10, 5, 7, 8, 2, 0.2);
  shoreBox(5, 12, 5, 18, -4, 0.3);

  const tank1 = cyl(4, 4, 7, new THREE.MeshStandardMaterial({ color: 0x788896, metalness: 0.5, roughness: 0.5 }), 20);
  tank1.position.set(-2, 5.5, 10);
  shore.add(tank1);

  const tank2 = cyl(3, 3, 5, matLight, 20);
  tank2.position.set(8, 4.5, 12);
  shore.add(tank2);

  const shoreAnchor = new THREE.Vector3(95 - 8, 16, -28 + 2);
  const ctrl = new THREE.Vector3(46, 46, -16);
  const curve = new THREE.QuadraticBezierCurve3(mastTip.clone(), ctrl, shoreAnchor.clone());

  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.18, 8, false), new THREE.MeshBasicMaterial({
    color: 0x35e0d0,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  scene.add(tube);

  const tubeCore = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.05, 6, false), new THREE.MeshBasicMaterial({
    color: 0xbafff4,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  }));
  scene.add(tubeCore);

  const packets = [];
  const packetGeo = new THREE.SphereGeometry(0.32, 10, 10);
  const packetMat = new THREE.MeshBasicMaterial({ color: 0xcdfff4 });
  const glowGeo = new THREE.SphereGeometry(0.7, 10, 10);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x35e0d0,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (let i = 0; i < 14; i += 1) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(packetGeo, packetMat));
    group.add(new THREE.Mesh(glowGeo, glowMat));
    scene.add(group);
    packets.push({ obj: group, t: i / 14, dir: i % 3 === 0 ? -1 : 1, sp: 0.05 + Math.random() * 0.03 });
  }

  function makeLabel(type, name, meta, color) {
    const label = document.createElement('div');
    label.className = `opcua-animation-label ${type}`;
    label.style.color = color;
    label.innerHTML = `<span class="marker"></span><span class="name">${name}</span><span class="meta">${meta}</span>`;
    labelEl.appendChild(label);
    return label;
  }

  const labels = [
    { el: makeLabel('site', 'NORØNNA', 'Offshore · VLAN 70 · SL-T 3', '#f2b21e'), pos: new THREE.Vector3(-3.5, deckY + 18, -3) },
    { el: makeLabel('site', 'AURORA', 'Onshore · IDMZ / OPC-UA-Zone', '#f2b21e'), pos: shoreAnchor.clone().add(new THREE.Vector3(0, 4, 0)) },
    { el: makeLabel('conduit', 'OPC UA', 'tcp/46040-46041 · DataHub ↔ UaWrapper', '#35e0d0'), pos: curve.getPoint(0.5).clone().add(new THREE.Vector3(0, 2, 0)) }
  ];

  const projected = new THREE.Vector3();
  function updateLabels() {
    labels.forEach((label) => {
      projected.copy(label.pos).project(camera);
      const visible = projected.z < 1;
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      label.el.style.opacity = visible ? '1' : '0';
      label.el.style.left = `${x}px`;
      label.el.style.top = `${y}px`;
    });
  }

  let theta = 0.7;
  let phi = 1.12;
  let radius = 112;
  let autoRotate = true;
  let idleT = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function pointerDown(x, y) {
    dragging = true;
    autoRotate = false;
    idleT = 0;
    lastX = x;
    lastY = y;
  }

  function pointerMove(x, y) {
    if (!dragging) return;
    theta -= (x - lastX) * 0.005;
    phi -= (y - lastY) * 0.005;
    phi = Math.max(0.45, Math.min(1.45, phi));
    lastX = x;
    lastY = y;
  }

  function pointerUp() {
    dragging = false;
    idleT = 0;
  }

  sceneEl.addEventListener('mousedown', (event) => pointerDown(event.clientX, event.clientY));
  window.addEventListener('mousemove', (event) => pointerMove(event.clientX, event.clientY));
  window.addEventListener('mouseup', pointerUp);
  sceneEl.addEventListener('touchstart', (event) => {
    if (event.touches[0]) pointerDown(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchmove', (event) => {
    if (event.touches[0]) pointerMove(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', pointerUp);

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

  const clock = new THREE.Clock();
  const packetPoint = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const waveScale = reduce ? 0.3 : 1;

    for (let i = 0; i < seaPos.count; i += 1) {
      const x = seaBaseX[i];
      const y = seaBaseY[i];
      const z = (
        Math.sin(x * 0.05 + t * 0.8) * 0.7 +
        Math.sin(y * 0.08 + t * 1.0) * 0.5 +
        Math.sin((x + y) * 0.04 - t * 0.6) * 0.45
      ) * waveScale;
      seaPos.setZ(i, z);
    }
    seaPos.needsUpdate = true;
    seaGeo.computeVertexNormals();

    const flameScale = 0.85 + Math.sin(t * 22) * 0.1 + Math.sin(t * 9) * 0.06;
    flame.scale.set(0.9 + Math.sin(t * 15) * 0.08, flameScale, 0.9 + Math.cos(t * 17) * 0.08);
    flameLight.intensity = 2.0 + Math.sin(t * 20) * 0.6;
    flameMat.opacity = 0.9 + Math.sin(t * 13) * 0.08;

    const blink = Math.sin(t * 3) > 0.6 ? 1 : 0.15;
    beaconN.material.opacity = blink;
    beaconD.material.opacity = blink;

    packets.forEach((packet, i) => {
      packet.t += packet.dir * packet.sp * dt * (reduce ? 0.4 : 1);
      if (packet.t > 1) packet.t -= 1;
      if (packet.t < 0) packet.t += 1;
      curve.getPoint(packet.t, packetPoint);
      packet.obj.position.copy(packetPoint);
      packet.obj.scale.setScalar(0.8 + Math.sin(t * 6 + i) * 0.2);
    });

    if (autoRotate && !reduce) theta += 0.0009;
    if (!dragging) {
      idleT += dt;
      if (idleT > 3.5) autoRotate = true;
    }

    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(target);

    updateLabels();
    renderer.render(scene, camera);
  }

  animate();
})();
