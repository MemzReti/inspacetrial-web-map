(() => {
  "use strict";

  const TAU = Math.PI * 2;

  const CONFIG = {
    seed: 9115,
    clusterCount: 16,
    clusterMinCoord: -150,
    clusterMaxCoord: 150,
    systemCountMin: 100,
    systemCountMax: 150,
    systemLocalMin: -70,
    systemLocalMax: 70,
    bodyLocalRadius: 14,
    galaxyScale: 16,
    clusterScale: 18,
    systemScale: 22,
    starCount: 180,
  };

  const NAME_A = [
    "Ash","Bel","Cor","Dal","Esh","Fyr","Gal","Hex","Iru","Jex",
    "Kel","Lum","Mev","Nox","Orv","Pex","Qur","Rex","Syx","Tel",
    "Ulv","Vex","Wor","Xen","Yar","Zel","Brev","Cyn","Eph","Grel",
    "Keth","Lyv","Myr","Nev","Oph","Pral","Quil","Riv","Stel","Thar",
    "Vor","Wyv","Dov","Frel","Hux","Zeph","Trev","Drel","Crav","Meth",
    "Lix","Sorn","Phel","Yorv","Varn","Cres","Dax","Ulm","Ith","Jor"
  ];

  const NAME_B = [
    "al","an","el","en","ir","ix","on","or","ul","ur",
    "ax","ex","ov","um","av","em","yr","ob","ag","ec",
    "id","og","ud","ak","ek","ok","ar","er","ot","ut",
    "is","as","es","os","un","il","yl","op","enx","olv"
  ];

  const NAME_C = [
    "ara","eth","ion","ova","ula","ani","eum","iro","oma","ura",
    "ane","eis","ite","ono","uri","ora","alis","urus","aris","eon",
    "oria","yra","elle","aris","uvis","enos","aris","une","oriax","ivia"
  ];

  const BODY_NAMES = [
    "Platipus","Congratie","Julie","Juyna","Aurelia","Mira","Nova","Vela",
    "Kora","Luna","Orlena","Saffy","Mallow","Iona","Tessia","Elara",
    "Cinder","Rivie","Daphne","Nerina","Tindra","Calyx","Moxie","Anika",
    "Sorrel","Eos","Ylva","Maren","Solene","Pavia","Liora","Zinnia",
    "Orchid","Pax","Runa","Sora","Talia","Yuna","Zuri","Astra",
    "Myra","Nessa","Pella","Vion","Cora","Levia","Aira","Nola"
  ];

  const BODY_SUFFIXES = ["", "", "", "", " 2", " 4", " 7", " 12", " 19", " 33", " 88", " 200", " Prime", " IV", " VII"];
  const STAR_TYPES = ["Red Dwarf", "Yellow Star", "Blue Giant", "White Star", "Orange Star"];
  const TERRAINS = ["Rocky", "Desert", "Ocean", "Temperate", "Barren", "Volcanic", "Frozen", "Metal"];
  const bodyLetterNames = ["b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"];

  const canvas = document.getElementById("map");
  const ctx = canvas.getContext("2d", { alpha: true });

  const backBtn = document.getElementById("backBtn");
  const teleportBtn = document.getElementById("teleportBtn");
  const coords1El = document.getElementById("coords1");
  const coords2El = document.getElementById("coords2");
  const infoEl = document.getElementById("info");
  const hintEl = document.getElementById("hint");

  const state = {
    seed: CONFIG.seed,
    catalog: null,
    mode: "Galaxy",
    currentCluster: null,
    currentSystem: null,
    currentBody: null,
    selectedItem: null,
    hoverItem: null,
    cameraX: 0,
    cameraY: 0,
    zoom: 1,
    mouseX: 0,
    mouseY: 0,
    mouseInside: false,
    keys: { W: false, A: false, S: false, D: false },
    stars: [],

    dragging: false,
    dragPointerId: null,
    dragStartX: 0,
    dragStartY: 0,
    dragStartCameraX: 0,
    dragStartCameraY: 0,
    dragMoved: false,
    pressedItem: null,
    pressedButton: -1,
  };

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function fract(n) {
    return n - Math.floor(n);
  }

  function key2(a, b) {
    return `${a},${b}`;
  }

  function stableHash(...args) {
    const s = args.map(v => String(v)).join("|");
    let h = 7;
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(h, 131) + s.charCodeAt(i) + i) % 2147483647;
    }
    return Math.abs(h);
  }

  function makeRng(seed) {
    let t = seed >>> 0;
    const next = () => {
      t += 0x6D2B79F5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };

    return {
      next,
      float(min = 0, max = 1) {
        return min + next() * (max - min);
      },
      int(min, max) {
        return Math.floor(this.float(min, max + 1));
      },
      pick(arr) {
        return arr[this.int(0, arr.length - 1)];
      },
    };
  }

  function hsvToRgb(h, s, v) {
    h = fract(h);
    s = clamp(s, 0, 1);
    v = clamp(v, 0, 1);

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r = 0, g = 0, b = 0;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function hsvToCss(h, s, v) {
    const [r, g, b] = hsvToRgb(h, s, v);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function chooseClusterPosition(rng, used) {
    let x, y, k;
    let tries = 0;

    do {
      tries++;
      const angle = rng.float(0, TAU);
      const radius = rng.float(20, 148);

      const stretchX = 1.0 + Math.sin(angle * 2) * 0.15;
      const stretchY = 0.78 + Math.cos(angle * 3) * 0.10;

      x = Math.floor(Math.cos(angle) * radius * stretchX);
      y = Math.floor(Math.sin(angle) * radius * stretchY);

      x = clamp(x, CONFIG.clusterMinCoord, CONFIG.clusterMaxCoord);
      y = clamp(y, CONFIG.clusterMinCoord, CONFIG.clusterMaxCoord);
      if (x === 0 && y === 0) x = 1;
      k = key2(x, y);
    } while (used[k] && tries < 300);

    return { x, y, k };
  }

  function chooseLocalPosition(rng, used, minRadius, maxRadius) {
    let x, y, k;
    let tries = 0;

    do {
      tries++;
      const angle = rng.float(0, TAU);
      const radius = rng.float(minRadius, maxRadius);
      x = Math.floor(Math.cos(angle) * radius);
      y = Math.floor(Math.sin(angle) * radius);
      k = key2(x, y);
    } while (used[k] && tries < 200);

    return { x, y, k };
  }

  function generateProcName(seed) {
    const rng = makeRng(seed + 8191);
    const a = rng.pick(NAME_A);
    const b = rng.pick(NAME_B);
    const c = rng.pick(NAME_C);
    const style = rng.int(1, 4);
    const num = rng.int(10, 9999);

    if (style === 1) return a + c;
    if (style === 2) return a + b + c;
    if (style === 3) return `${a} ${num}`;
    return `${a}-${num}`;
  }

  function generateBodyName(seed, usedNames) {
    const rng = makeRng(seed + 271828);
    const base = rng.pick(BODY_NAMES);
    const suffix = rng.pick(BODY_SUFFIXES);
    let name = base + suffix;
    let tries = 0;

    while (usedNames[name] && tries < 30) {
      tries++;
      name = `${base}${suffix}-${rng.int(2, 99)}`;
    }

    usedNames[name] = true;
    return name;
  }

  function planetClassToColor(rng, cls, terrain) {
    if (cls === "Gas Giant") {
      return hsvToCss(rng.float(0.07, 0.13), rng.float(0.35, 0.75), rng.float(0.75, 1));
    }
    if (cls === "Ice Giant") {
      return hsvToCss(rng.float(0.50, 0.58), rng.float(0.20, 0.55), rng.float(0.80, 1));
    }

    if (terrain === "Ocean") {
      return hsvToCss(0.58, rng.float(0.45, 0.80), rng.float(0.70, 1));
    }
    if (terrain === "Temperate") {
      return hsvToCss(rng.float(0.25, 0.42), rng.float(0.35, 0.70), rng.float(0.65, 0.95));
    }
    if (terrain === "Desert") {
      return hsvToCss(rng.float(0.08, 0.12), rng.float(0.35, 0.70), rng.float(0.70, 1));
    }
    if (terrain === "Volcanic") {
      return hsvToCss(rng.float(0.00, 0.04), rng.float(0.60, 0.95), rng.float(0.70, 1));
    }
    if (terrain === "Frozen") {
      return hsvToCss(0.53, rng.float(0.10, 0.35), rng.float(0.85, 1));
    }
    if (terrain === "Metal") {
      return hsvToCss(rng.float(0.08, 0.12), rng.float(0.05, 0.35), rng.float(0.50, 0.95));
    }
    if (terrain === "Barren") {
      return hsvToCss(rng.float(0.05, 0.12), rng.float(0.12, 0.35), rng.float(0.35, 0.75));
    }

    return hsvToCss(rng.next(), rng.float(0.15, 0.65), rng.float(0.55, 1));
  }

  function createPlanetBody(systemSeed, bodyId, orbitRadius, starTemperature, rng) {
    const classRoll = rng.next();
    let cls;
    if (classRoll < 0.68) cls = "Terrestrial";
    else if (classRoll < 0.84) cls = "Gas Giant";
    else cls = "Ice Giant";

    let terrain = cls;
    if (cls === "Terrestrial") terrain = rng.pick(TERRAINS);

    let size;
    if (cls === "Terrestrial") size = rng.int(25, 60);
    else if (cls === "Gas Giant") size = rng.int(400, 1000);
    else size = rng.int(150, 450);

    let gravity;
    if (cls === "Gas Giant") gravity = rng.float(1.8, 4.5);
    else if (cls === "Ice Giant") gravity = rng.float(0.8, 2.8);
    else gravity = rng.float(0.1, 2.0);

    const roughness = rng.int(0, 5);
    const temperature = Math.floor(starTemperature - (orbitRadius * 75) + rng.float(-55, 55));

    let breathable = false;
    let hasLife = false;
    let lifeType = "None";

    if (cls === "Terrestrial") {
      breathable = (
        (terrain === "Ocean" || terrain === "Temperate") &&
        temperature >= 260 && temperature <= 330 &&
        gravity >= 0.7 && gravity <= 1.4 &&
        rng.next() > 0.30
      );

      if (breathable && rng.next() < 0.22) {
        hasLife = true;
        lifeType = rng.next() < 0.72 ? "Plant" : "Fungus";
      } else if (rng.next() < 0.05 && (terrain === "Frozen" || terrain === "Volcanic")) {
        hasLife = true;
        lifeType = "Fungus";
      }
    }

    const color = planetClassToColor(rng, cls, terrain);
    const hasRings = cls !== "Terrestrial" ? rng.next() < 0.35 : terrain === "Frozen" && rng.next() < 0.15;
    let tidallyLocked = orbitRadius <= 6 ? rng.next() < 0.80 : orbitRadius <= 10 ? rng.next() < 0.35 : rng.next() < 0.10;

    if (cls === "Terrestrial" && terrain === "Temperate" && breathable) {
      tidallyLocked = false;
    }

    return {
      BodyID: bodyId,
      OrbitRadius: orbitRadius,
      Class: cls,
      Type: terrain,
      Size: size,
      Color: color,
      Gravity: gravity,
      Roughness: roughness,
      Temperature: temperature,
      Breathable: breathable,
      HasLife: hasLife,
      LifeType: lifeType,
      HasRings: hasRings,
      TidallyLocked: tidallyLocked,
    };
  }

  function buildCluster(clusterSeed, clusterX, clusterY, clusterIndex) {
    const clusterRng = makeRng(clusterSeed);
    const clusterName = `${generateProcName(clusterSeed)} Cluster`;
    const clusterID = stableHash("cluster", state.seed, clusterX, clusterY, clusterIndex);
    const systemCount = clusterRng.int(CONFIG.systemCountMin, CONFIG.systemCountMax);

    const systems = [];
    const usedSystems = {};

    for (let systemIndex = 1; systemIndex <= systemCount; systemIndex++) {
      const sysPos = chooseLocalPosition(clusterRng, usedSystems, 18, 70);
      usedSystems[sysPos.k] = true;

      const systemSeed = stableHash("system", clusterSeed, sysPos.x, sysPos.y, systemIndex);
      const sysRng = makeRng(systemSeed);

      const starType = sysRng.pick(STAR_TYPES);
      const starColor = hsvToCss(sysRng.next(), sysRng.float(0.25, 0.65), 1);
      const starTemperature = Math.floor(sysRng.float(2500, 13000));
      const planetCount = sysRng.int(1, 12);

      const bodies = [];
      const usedBodies = {};
      const usedBodyNames = {};

      for (let bodyId = 1; bodyId <= planetCount; bodyId++) {
        const bodySeed = stableHash("body", systemSeed, bodyId);
        const bodyRng = makeRng(bodySeed);

        const orbitRadius = bodyId * 4 + bodyRng.float(2, 6);
        let angle = bodyRng.float(0, TAU);
        let bx = Math.floor(Math.cos(angle) * orbitRadius);
        let by = Math.floor(Math.sin(angle) * orbitRadius);
        let bk = key2(bx, by);

        while (usedBodies[bk]) {
          angle += 0.37;
          bx = Math.floor(Math.cos(angle) * orbitRadius);
          by = Math.floor(Math.sin(angle) * orbitRadius);
          bk = key2(bx, by);
        }

        usedBodies[bk] = true;

        const body = createPlanetBody(systemSeed, bodyId, orbitRadius, starTemperature, bodyRng);
        body.SystemX = bx;
        body.SystemY = by;
        body.Name = generateBodyName(stableHash("bodyname", systemSeed, bodyId, body.Class, body.Type, orbitRadius), usedBodyNames);

        bodies.push(body);
      }

      systems.push({
        SystemID: systemSeed,
        Name: generateProcName(systemSeed),
        SpaceX: sysPos.x,
        SpaceY: sysPos.y,
        StarType: starType,
        StarColor: starColor,
        StarTemperature: starTemperature,
        PlanetCount: planetCount,
        Bodies: bodies,
        HasDyson: sysRng.next() < 0.03,
      });
    }

    return {
      ClusterID: clusterID,
      Name: clusterName,
      ClusterX: clusterX,
      ClusterY: clusterY,
      SystemCount: systemCount,
      Systems: systems,
    };
  }

  function buildCatalog() {
    if (state.catalog && state.catalog.seed === state.seed) {
      return state.catalog;
    }

    const rng = makeRng(state.seed);
    const usedClusters = {};
    const clusters = [];
    const byCluster = {};

    for (let i = 1; i <= CONFIG.clusterCount; i++) {
      const pos = chooseClusterPosition(rng, usedClusters);
      usedClusters[pos.k] = true;

      const clusterSeed = stableHash("clusterSeed", state.seed, pos.x, pos.y, i);
      const cluster = buildCluster(clusterSeed, pos.x, pos.y, i);
      clusters.push(cluster);
      byCluster[key2(pos.x, pos.y)] = cluster;
    }

    clusters.sort((a, b) => {
      if (a.ClusterX === b.ClusterX) return a.ClusterY - b.ClusterY;
      return a.ClusterX - b.ClusterX;
    });

    state.catalog = { seed: state.seed, clusters, byCluster };
    return state.catalog;
  }

  function generateBackgroundStars() {
    const rng = makeRng(stableHash("background", state.seed));
    const stars = [];
    for (let i = 0; i < CONFIG.starCount; i++) {
      stars.push({
        x: rng.next(),
        y: rng.next(),
        r: rng.float(0.5, 1.8),
        a: rng.float(0.20, 0.95),
      });
    }
    state.stars = stars;
  }

  function getModeScale() {
    if (state.mode === "Galaxy") return CONFIG.galaxyScale * state.zoom;
    if (state.mode === "Cluster") return CONFIG.clusterScale * state.zoom;
    if (state.mode === "System") return CONFIG.systemScale * state.zoom;
    return 1;
  }

  function getCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height, rect };
  }

  function resizeCanvas() {
    const { width, height } = getCanvasSize();
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    generateBackgroundStars();
  }

  function worldToScreen(wx, wy) {
    const { width, height } = getCanvasSize();
    const scale = getModeScale();
    const cx = width * 0.5;
    const cy = height * 0.5;
    return {
      x: cx + ((wx - state.cameraX) * scale),
      y: cy + ((-wy + state.cameraY) * scale),
    };
  }

  function getCurrentPathText() {
    const c = state.currentCluster;
    const s = state.currentSystem;
    const b = state.currentBody;

    if (state.mode === "Galaxy") return c ? `Cluster: [${c.ClusterX}, ${c.ClusterY}]` : "Cluster: [?, ?]";
    if (state.mode === "Cluster") return c && s ? `Cluster: [${c.ClusterX}, ${c.ClusterY}]  |  System: [${s.SpaceX}, ${s.SpaceY}]` : "Cluster / System: [?, ?]";
    if (state.mode === "System") return c && s && b ? `Cluster: [${c.ClusterX}, ${c.ClusterY}]  |  System: [${s.SpaceX}, ${s.SpaceY}]  |  Body: [${b.SystemX}, ${b.SystemY}]` : "Cluster / System / Body: [?, ?]";
    return b ? `Surface: ${b.Name}` : "Surface";
  }

  function getMarkerInfo(item) {
    if (!item) return "Right click a cluster, system, or body.";

    if (item.kind === "cluster") {
      const c = item.object;
      return [
        c.Name,
        `Systems: ${c.SystemCount}`,
        `Cluster ID: ${c.ClusterID}`,
        `Coords: [${c.ClusterX}, ${c.ClusterY}]`,
      ].join("\n");
    }

    if (item.kind === "system") {
      const s = item.object;
      return [
        s.Name,
        `Star Type: ${s.StarType}`,
        `Planets: ${s.PlanetCount}`,
        `Star Temp: ${s.StarTemperature} K`,
        `Dyson: ${s.HasDyson ? "Yes" : "No"}`,
        `System ID: ${s.SystemID}`,
        `Coords: [${s.SpaceX}, ${s.SpaceY}]`,
      ].join("\n");
    }

    if (item.kind === "body") {
      const b = item.object;
      return [
        b.Name,
        `Class: ${b.Class}`,
        `Type: ${b.Type}`,
        `Size: ${b.Size}`,
        `Gravity: ${b.Gravity.toFixed(2)}`,
        `Orbit: ${Math.round(b.OrbitRadius)} PU`,
        `Temp: ${b.Temperature} K`,
        `Breathable: ${b.Breathable ? "Yes" : "No"}`,
        `Tidally Locked: ${b.TidallyLocked ? "Yes" : "No"}`,
        `Rings: ${b.HasRings ? "Yes" : "No"}`,
        `Life: ${b.HasLife ? b.LifeType : "None"}`,
      ].join("\n");
    }

    return "Right click a cluster, system, or body.";
  }

  function setSelection(item) {
    state.selectedItem = item;
    infoEl.textContent = getMarkerInfo(item);
  }

  function setViewGalaxy() {
    state.mode = "Galaxy";
    state.zoom = 1;
    state.currentSystem = null;
    state.currentBody = null;
    if (state.currentCluster) {
      state.cameraX = state.currentCluster.ClusterX;
      state.cameraY = state.currentCluster.ClusterY;
    } else {
      state.cameraX = 0;
      state.cameraY = 0;
    }
    if (state.currentCluster) setSelection({ kind: "cluster", object: state.currentCluster });
  }

  function setViewCluster(cluster) {
    if (!cluster) return;
    state.mode = "Cluster";
    state.currentCluster = cluster;
    state.currentSystem = cluster.Systems[0] || null;
    state.currentBody = null;
    state.zoom = 1;
    state.cameraX = 0;
    state.cameraY = 0;
    setSelection({ kind: "cluster", object: cluster });
  }

  function setViewSystem(system, cluster) {
    if (!system) return;
    state.mode = "System";
    if (cluster) state.currentCluster = cluster;
    state.currentSystem = system;
    state.currentBody = null;
    state.zoom = 1;
    state.cameraX = 0;
    state.cameraY = 0;
    setSelection({ kind: "system", object: system });
  }

  function setViewSurface(body, system, cluster) {
    if (!body) return;
    state.mode = "Surface";
    if (cluster) state.currentCluster = cluster;
    if (system) state.currentSystem = system;
    state.currentBody = body;
    state.zoom = 1;
    state.cameraX = 0;
    state.cameraY = 0;
    setSelection({ kind: "body", object: body });
  }

  function openItem(item) {
    if (!item) return;
    if (item.kind === "cluster") setViewCluster(item.object);
    else if (item.kind === "system") setViewSystem(item.object, item.cluster || state.currentCluster);
    else if (item.kind === "body") setViewSurface(item.object, item.system || state.currentSystem, item.cluster || state.currentCluster);
  }

  function teleportToSelection() {
    if (!state.selectedItem) return;
    openItem(state.selectedItem);
  }

  function getVisibleMarkers() {
    const markers = [];

    if (state.mode === "Galaxy") {
      for (const cluster of state.catalog.clusters) {
        markers.push({
          kind: "cluster",
          object: cluster,
          wx: cluster.ClusterX,
          wy: cluster.ClusterY,
          r: clamp(9 + cluster.SystemCount * 0.04, 9, 18),
          color: hsvToCss(fract((cluster.ClusterID % 1000) / 1000), 0.65, 1),
          label: cluster.Name,
        });
      }
      return markers;
    }

    if (state.mode === "Cluster") {
      const cluster = state.currentCluster;
      if (!cluster) return markers;
      for (const system of cluster.Systems) {
        markers.push({
          kind: "system",
          object: system,
          cluster,
          wx: system.SpaceX,
          wy: system.SpaceY,
          r: 6,
          color: system.StarColor,
          label: system.Name,
        });
      }
      return markers;
    }

    if (state.mode === "System") {
      const cluster = state.currentCluster;
      const system = state.currentSystem;
      if (!system) return markers;

      markers.push({
        kind: "system",
        object: system,
        cluster,
        wx: 0,
        wy: 0,
        r: 14,
        color: system.StarColor,
        label: system.Name,
        isStar: true,
      });

      for (const body of system.Bodies) {
        markers.push({
          kind: "body",
          object: body,
          cluster,
          system,
          wx: body.SystemX,
          wy: body.SystemY,
          r: clamp(body.Size / 24, 6, 26),
          color: body.Color,
          label: body.Name,
        });
      }
      return markers;
    }

    if (state.mode === "Surface") {
      const body = state.currentBody;
      if (body) {
        markers.push({
          kind: "body",
          object: body,
          cluster: state.currentCluster,
          system: state.currentSystem,
          wx: 0,
          wy: 0,
          r: 0,
          color: body.Color,
          label: body.Name,
        });
      }
    }

    return markers;
  }

  function findMarkerAtScreen(x, y, markers) {
    let best = null;
    let bestDist = Infinity;

    for (const m of markers) {
      const dx = x - m.sx;
      const dy = y - m.sy;
      const dist = Math.hypot(dx, dy);
      const hitRadius = (m.r || 8) + 8;

      if (dist <= hitRadius && dist < bestDist) {
        best = m;
        bestDist = dist;
      }
    }

    return best;
  }

  function drawBackground(width, height) {
    const g = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.8);
    g.addColorStop(0, "#0e1020");
    g.addColorStop(0.6, "#05060a");
    g.addColorStop(1, "#020203");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    for (const s of state.stars) {
      const x = s.x * width;
      const y = s.y * height;
      ctx.globalAlpha = s.a;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawTextWithStroke(text, x, y, size = 12, align = "center", fill = "#ffffff") {
    ctx.font = `${size}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.fillStyle = fill;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  function drawHalo(x, y, r, color = "rgba(255,255,140,0.95)") {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  function drawClusterView(markers, hovered) {
    for (const m of markers) {
      ctx.beginPath();
      ctx.arc(m.sx, m.sy, m.r, 0, TAU);
      ctx.fillStyle = m.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (hovered === m || (state.selectedItem && state.selectedItem.kind === "cluster" && state.selectedItem.object === m.object)) {
        drawHalo(m.sx, m.sy, m.r + 8);
        drawTextWithStroke(m.label, m.sx, m.sy + m.r + 12, 12, "center");
      }
    }
  }

  function drawClusterSystemView(markers, hovered) {
    const star = markers.find(m => m.kind === "system" && m.isStar);

    if (star) {
      ctx.beginPath();
      ctx.arc(star.sx, star.sy, 18, 0, TAU);
      ctx.fillStyle = star.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(star.sx, star.sy, 30, 0, TAU);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (hovered === star || (state.selectedItem && state.selectedItem.kind === "system" && state.selectedItem.object === star.object)) {
        drawHalo(star.sx, star.sy, 24, "rgba(255,255,255,0.95)");
        drawTextWithStroke(star.label, star.sx, star.sy - 28, 12, "center");
      }
    }

    for (const m of markers) {
      if (m.isStar) continue;
      ctx.beginPath();
      ctx.arc(m.sx, m.sy, m.r, 0, TAU);
      ctx.fillStyle = m.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (hovered === m || (state.selectedItem && state.selectedItem.kind === "system" && state.selectedItem.object === m.object)) {
        drawHalo(m.sx, m.sy, m.r + 7);
        drawTextWithStroke(m.label, m.sx, m.sy + m.r + 12, 12, "center");
      }
    }
  }

  function drawSystemView(markers, hovered) {
    const system = state.currentSystem;
    if (!system) return;

    const star = markers.find(m => m.isStar);
    if (star) {
      const glow = ctx.createRadialGradient(star.sx, star.sy, 0, star.sx, star.sy, 60);
      glow.addColorStop(0, "rgba(255,255,255,0.45)");
      glow.addColorStop(0.2, star.color);
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(star.sx, star.sy, 60, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(star.sx, star.sy, 14, 0, TAU);
      ctx.fillStyle = star.color;
      ctx.fill();
      drawTextWithStroke(system.Name, star.sx, star.sy - 28, 13, "center");

      if (hovered === star || (state.selectedItem && state.selectedItem.kind === "system" && state.selectedItem.object === star.object)) {
        drawHalo(star.sx, star.sy, 20, "rgba(255,255,255,0.95)");
      }
    }

    for (const body of system.Bodies) {
      const orbitPx = body.OrbitRadius * getModeScale();
      ctx.beginPath();
      ctx.arc(star.sx, star.sy, orbitPx, 0, TAU);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (const m of markers) {
      if (m.isStar) continue;
      ctx.beginPath();
      ctx.arc(m.sx, m.sy, m.r, 0, TAU);
      ctx.fillStyle = m.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (hovered === m || (state.selectedItem && state.selectedItem.kind === "body" && state.selectedItem.object === m.object)) {
        drawHalo(m.sx, m.sy, m.r + 7);
        drawTextWithStroke(m.label, m.sx, m.sy + m.r + 12, 12, "center");
      }
    }
  }

  function drawSurfaceView(width, height) {
    const body = state.currentBody;
    if (!body) return;

    const bg = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.8);
    bg.addColorStop(0, "#11131e");
    bg.addColorStop(1, "#05060a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.52;
    const r = Math.min(width, height) * 0.27;

    if (body.HasRings) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.55, r * 0.55, 0, 0, TAU);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.restore();
    }

    const sphere = ctx.createRadialGradient(cx - r * 0.30, cy - r * 0.35, r * 0.12, cx, cy, r);
    sphere.addColorStop(0, "rgba(255,255,255,0.25)");
    sphere.addColorStop(0.35, body.Color);
    sphere.addColorStop(1, "rgba(0,0,0,0.45)");

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = body.Color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = sphere;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.clip();
    const shadow = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    shadow.addColorStop(0, body.TidallyLocked ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)");
    shadow.addColorStop(0.45, "rgba(0,0,0,0.05)");
    shadow.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = shadow;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    drawTextWithStroke(body.Name, cx, cy - r - 24, 18, "center");
    drawTextWithStroke(body.Type + " world", cx, cy - r - 2, 12, "center", "rgba(255,255,255,0.9)");
    drawTextWithStroke("Surface View", cx, height - 28, 12, "center", "rgba(255,255,255,0.75)");
  }

  function updateUiTexts() {
    coords2El.textContent = getCurrentPathText();

    if (state.hoverItem) {
      if (state.hoverItem.kind === "cluster") coords1El.textContent = `[${state.hoverItem.object.ClusterX}, ${state.hoverItem.object.ClusterY}]`;
      else if (state.hoverItem.kind === "system") coords1El.textContent = `[${state.hoverItem.object.SpaceX}, ${state.hoverItem.object.SpaceY}]`;
      else if (state.hoverItem.kind === "body") coords1El.textContent = `[${state.hoverItem.object.SystemX}, ${state.hoverItem.object.SystemY}]`;
      else coords1El.textContent = "[?, ?]";
    } else {
      coords1El.textContent = "[?, ?]";
    }

    infoEl.textContent = state.selectedItem ? getMarkerInfo(state.selectedItem) : "Right click a cluster, system, or body.";
    hintEl.textContent = "Galaxy: clusters · Cluster: systems · System: bodies · WASD: move · Left drag: pan · Scroll: zoom · Left click: open · Middle click: select teleport target · Right click: info";
  }

  function getVisibleMarkers() {
    const markers = [];

    if (state.mode === "Galaxy") {
      for (const cluster of state.catalog.clusters) {
        markers.push({
          kind: "cluster",
          object: cluster,
          wx: cluster.ClusterX,
          wy: cluster.ClusterY,
          r: clamp(9 + cluster.SystemCount * 0.04, 9, 18),
          color: hsvToCss(fract((cluster.ClusterID % 1000) / 1000), 0.65, 1),
          label: cluster.Name,
        });
      }
      return markers;
    }

    if (state.mode === "Cluster") {
      const cluster = state.currentCluster;
      if (!cluster) return markers;
      for (const system of cluster.Systems) {
        markers.push({
          kind: "system",
          object: system,
          cluster,
          wx: system.SpaceX,
          wy: system.SpaceY,
          r: 6,
          color: system.StarColor,
          label: system.Name,
        });
      }
      return markers;
    }

    if (state.mode === "System") {
      const cluster = state.currentCluster;
      const system = state.currentSystem;
      if (!system) return markers;

      markers.push({
        kind: "system",
        object: system,
        cluster,
        wx: 0,
        wy: 0,
        r: 14,
        color: system.StarColor,
        label: system.Name,
        isStar: true,
      });

      for (const body of system.Bodies) {
        markers.push({
          kind: "body",
          object: body,
          cluster,
          system,
          wx: body.SystemX,
          wy: body.SystemY,
          r: clamp(body.Size / 24, 6, 26),
          color: body.Color,
          label: body.Name,
        });
      }
      return markers;
    }

    if (state.mode === "Surface") {
      const body = state.currentBody;
      if (body) {
        markers.push({
          kind: "body",
          object: body,
          cluster: state.currentCluster,
          system: state.currentSystem,
          wx: 0,
          wy: 0,
          r: 0,
          color: body.Color,
          label: body.Name,
        });
      }
    }

    return markers;
  }

  function refreshHoverItem() {
    const markers = getVisibleMarkers();
    for (const m of markers) {
      const p = worldToScreen(m.wx, m.wy);
      m.sx = p.x;
      m.sy = p.y;
    }
    state.hoverItem = state.mouseInside ? findMarkerAtScreen(state.mouseX, state.mouseY, markers) : null;
  }

  function render() {
    const { width, height } = getCanvasSize();
    drawBackground(width, height);

    const markers = getVisibleMarkers();
    for (const m of markers) {
      const p = worldToScreen(m.wx, m.wy);
      m.sx = p.x;
      m.sy = p.y;
    }

    state.hoverItem = state.mouseInside ? findMarkerAtScreen(state.mouseX, state.mouseY, markers) : null;

    if (state.mode === "Galaxy") drawClusterView(markers, state.hoverItem);
    else if (state.mode === "Cluster") drawClusterSystemView(markers, state.hoverItem);
    else if (state.mode === "System") drawSystemView(markers, state.hoverItem);
    else if (state.mode === "Surface") drawSurfaceView(width, height);

    updateUiTexts();
  }

  function applyPanFromDrag(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const dx = clientX - rect.left - state.dragStartX;
    const dy = clientY - rect.top - state.dragStartY;
    const scale = getModeScale();

    state.cameraX = state.dragStartCameraX - (dx / scale);
    state.cameraY = state.dragStartCameraY + (dy / scale);
    state.cameraX = clamp(state.cameraX, -150, 150);
    state.cameraY = clamp(state.cameraY, -150, 150);
  }

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;
    state.mouseY = e.clientY - rect.top;
    state.mouseInside = true;

    if (state.dragging && state.dragPointerId !== null) {
      applyPanFromDrag(e.clientX, e.clientY);
      state.dragMoved = true;
      return;
    }
  });

  canvas.addEventListener("mouseleave", () => {
    state.mouseInside = false;
    state.hoverItem = null;
  });

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;
    state.mouseY = e.clientY - rect.top;
    state.mouseInside = true;

    const item = state.hoverItem || getVisibleMarkers().reduce((best, m) => best, null);
    canvas.setPointerCapture(e.pointerId);

    state.pressedButton = e.button;
    state.pressedItem = state.hoverItem;

    if (e.button === 0) {
      state.dragPointerId = e.pointerId;
      state.dragStartX = e.clientX - rect.left;
      state.dragStartY = e.clientY - rect.top;
      state.dragStartCameraX = state.cameraX;
      state.dragStartCameraY = state.cameraY;
      state.dragMoved = false;
      state.dragging = false;
    } else if (e.button === 1) {
      if (state.hoverItem) setSelection(state.hoverItem);
    } else if (e.button === 2) {
      if (state.hoverItem) setSelection(state.hoverItem);
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;
    state.mouseY = e.clientY - rect.top;
    state.mouseInside = true;

    if (state.dragPointerId === e.pointerId && state.pressedButton === 0) {
      const dx = (e.clientX - rect.left) - state.dragStartX;
      const dy = (e.clientY - rect.top) - state.dragStartY;
      if (!state.dragging && Math.hypot(dx, dy) > 5) {
        state.dragging = true;
      }
      if (state.dragging && state.mode !== "Surface") {
        applyPanFromDrag(e.clientX, e.clientY);
        state.dragMoved = true;
      }
    }
  });

  function endPointer(e) {
    if (state.dragPointerId === e.pointerId && state.pressedButton === 0) {
      const item = state.hoverItem;
      const wasDrag = state.dragging && state.dragMoved;

      if (!wasDrag && item) {
        openItem(item);
      }

      state.dragPointerId = null;
      state.dragging = false;
      state.dragMoved = false;
      state.pressedButton = -1;
      state.pressedItem = null;
    }
  }

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    state.zoom = clamp(state.zoom + (e.deltaY < 0 ? 0.12 : -0.12), 0.5, 3);
  }, { passive: false });

  backBtn.addEventListener("click", () => {
    if (state.mode === "Surface" && state.currentSystem) {
      setViewSystem(state.currentSystem, state.currentCluster);
      return;
    }
    if (state.mode === "System" && state.currentCluster) {
      setViewCluster(state.currentCluster);
      return;
    }
    if (state.mode === "Cluster") {
      setViewGalaxy();
    }
  });

  teleportBtn.addEventListener("click", () => {
    teleportToSelection();
  });

  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    if (e.key === "m" || e.key === "M") {
      canvas.style.display = canvas.style.display === "none" ? "block" : "block";
      return;
    }

    if (e.key === "w" || e.key === "W") state.keys.W = true;
    if (e.key === "a" || e.key === "A") state.keys.A = true;
    if (e.key === "s" || e.key === "S") state.keys.S = true;
    if (e.key === "d" || e.key === "D") state.keys.D = true;

    if (e.key === "Escape") {
      if (state.mode === "Surface" && state.currentSystem) setViewSystem(state.currentSystem, state.currentCluster);
      else if (state.mode === "System" && state.currentCluster) setViewCluster(state.currentCluster);
      else if (state.mode === "Cluster") setViewGalaxy();
    }

    if (e.key === "Enter") teleportToSelection();
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "w" || e.key === "W") state.keys.W = false;
    if (e.key === "a" || e.key === "A") state.keys.A = false;
    if (e.key === "s" || e.key === "S") state.keys.S = false;
    if (e.key === "d" || e.key === "D") state.keys.D = false;
  });

  function tick(ts) {
    if (!tick.last) tick.last = ts;
    const dt = Math.min((ts - tick.last) / 1000, 0.05);
    tick.last = ts;

    if (state.mode !== "Surface") {
      const speedBase = state.mode === "Galaxy" ? 30 : state.mode === "Cluster" ? 22 : 18;
      const speed = (speedBase / state.zoom) * dt;

      if (state.keys.W) state.cameraY += speed;
      if (state.keys.S) state.cameraY -= speed;
      if (state.keys.A) state.cameraX -= speed;
      if (state.keys.D) state.cameraX += speed;

      state.cameraX = clamp(state.cameraX, -150, 150);
      state.cameraY = clamp(state.cameraY, -150, 150);
    }

    render();
    requestAnimationFrame(tick);
  }

  resizeCanvas();
  buildCatalog();
  state.currentCluster = state.catalog.clusters[0] || null;
  state.currentSystem = state.currentCluster ? state.currentCluster.Systems[0] || null : null;
  state.currentBody = state.currentSystem ? state.currentSystem.Bodies[0] || null : null;
  state.selectedItem = state.currentCluster ? { kind: "cluster", object: state.currentCluster } : null;
  state.cameraX = state.currentCluster ? state.currentCluster.ClusterX : 0;
  state.cameraY = state.currentCluster ? state.currentCluster.ClusterY : 0;
  infoEl.textContent = getMarkerInfo(state.selectedItem);

  canvas.focus?.();
  requestAnimationFrame(tick);
})();
