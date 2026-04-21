const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const backBtn = document.getElementById("backBtn");
const teleportBtn = document.getElementById("teleportBtn");
const coords1 = document.getElementById("coords1");
const coords2 = document.getElementById("coords2");
const info = document.getElementById("info");

const Universe = {
  Debug: true,
  DefaultUniverseSeed: 902177,
  UniverseSeed: 902177,
  SystemCount: 100,
  MinCoord: -100,
  MaxCoord: 100,
  CatalogByCoord: null,
  CatalogArray: null,
  CatalogSeed: null
};

function dprint(...args) {
  if (Universe.Debug) console.log("[Universe]", ...args);
}

function key2(x, y) {
  return `${x},${y}`;
}

function stableHash(...args) {
  const s = args.join("|");
  let h = 7;
  for (let i = 0; i < s.length; i++) {
    h = (h * 131 + s.charCodeAt(i) + i) % 2147483647;
  }
  return Math.abs(h);
}

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class RNG {
  constructor(seed) {
    this.r = mulberry32(seed >>> 0);
  }
  next() {
    return this.r();
  }
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  num(min, max) {
    return this.next() * (max - min) + min;
  }
  chance(p) {
    return this.next() < p;
  }
}

function hsvToRgb(h, s, v) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function rgbString(c) {
  return `rgb(${c.r},${c.g},${c.b})`;
}

function pickSurfaceMaterial(roughness) {
  if (roughness <= 1) return "Sand";
  if (roughness <= 3) return "Sandstone";
  if (roughness === 4) return "Slate";
  return "Basalt";
}

function setUniverseSeed(seed) {
  seed = Number(seed) || Universe.DefaultUniverseSeed;
  if (seed !== Universe.UniverseSeed) {
    Universe.UniverseSeed = seed;
    Universe.CatalogByCoord = null;
    Universe.CatalogArray = null;
    Universe.CatalogSeed = null;
    dprint("Universe seed set to", seed);
  }
}

function buildCatalog() {
  if (Universe.CatalogByCoord && Universe.CatalogArray && Universe.CatalogSeed === Universe.UniverseSeed) {
    return [Universe.CatalogByCoord, Universe.CatalogArray];
  }

  const rng = new RNG(Universe.UniverseSeed);
  const usedPositions = new Set();
  const catalogByCoord = {};
  const catalogArray = [];

  const starTypes = [
    "Red Dwarf",
    "Yellow Star",
    "Blue Giant",
    "White Star",
    "Orange Star"
  ];

  const planetTypes = [
    "Rocky",
    "Desert",
    "Ice",
    "Ocean",
    "Volcanic",
    "Metal",
    "Temperate",
    "Barren"
  ];

  for (let systemIndex = 1; systemIndex <= Universe.SystemCount; systemIndex++) {
    let sx, sy, k;
    do {
      sx = rng.int(Universe.MinCoord, Universe.MaxCoord);
      sy = rng.int(Universe.MinCoord, Universe.MaxCoord);
      k = key2(sx, sy);
    } while (usedPositions.has(k));
    usedPositions.add(k);

    const systemSeed = stableHash("system", Universe.UniverseSeed, sx, sy, systemIndex);
    const systemRng = new RNG(systemSeed);

    const planetCount = systemRng.int(1, 12);
    const starType = starTypes[systemRng.int(0, starTypes.length - 1)];
    const starColor = hsvToRgb(systemRng.next(), systemRng.num(0.25, 0.65), 1);
    const starTemperature = Math.floor(systemRng.num(2500, 13000));

    const bodies = [];
    const usedLocal = new Set();

    for (let bodyId = 1; bodyId <= planetCount; bodyId++) {
      const bodySeed = stableHash("body", systemSeed, bodyId);
      const brng = new RNG(bodySeed);

      const bodyType = planetTypes[brng.int(0, planetTypes.length - 1)];
      const size = brng.int(50, 170);
      const gravity = brng.num(0.1, 2.0);
      const roughness = brng.int(0, 5);
      const orbitRadius = bodyId * 4 + brng.num(2, 6);
      let angle = brng.num(0, Math.PI * 2);

      let localX = Math.floor(Math.cos(angle) * orbitRadius);
      let localY = Math.floor(Math.sin(angle) * orbitRadius);
      let localKey = key2(localX, localY);

      while (usedLocal.has(localKey)) {
        angle += 0.37;
        localX = Math.floor(Math.cos(angle) * orbitRadius);
        localY = Math.floor(Math.sin(angle) * orbitRadius);
        localKey = key2(localX, localY);
      }
      usedLocal.add(localKey);

      const temperature = Math.floor(starTemperature - (orbitRadius * 85) + brng.num(-50, 50));
      const breathable =
        (bodyType === "Ocean" || bodyType === "Temperate") &&
        temperature >= 260 &&
        temperature <= 330 &&
        gravity >= 0.7 &&
        gravity <= 1.4 &&
        brng.next() > 0.25;

      let hasRings = brng.next() < 0.18;
      if (bodyType === "Ice" && brng.next() < 0.30) {
        hasRings = true;
      }

      const color = hsvToRgb(brng.next(), brng.num(0.2, 0.7), brng.num(0.65, 1));

      bodies.push({
        BodyID: bodyId,
        LocalX: localX,
        LocalY: localY,
        OrbitRadius: orbitRadius,
        Type: bodyType,
        Size: size,
        Color: color,
        Gravity: gravity,
        Roughness: roughness,
        Temperature: temperature,
        Breathable: breathable,
        HasRings: hasRings
      });
    }

    const system = {
      SpaceX: sx,
      SpaceY: sy,
      SystemID: systemSeed,
      Seed: systemSeed,
      StarType: starType,
      StarColor: starColor,
      StarTemperature: starTemperature,
      PlanetCount: planetCount,
      Bodies: bodies
    };

    catalogByCoord[k] = system;
    catalogArray.push(system);
  }

  catalogArray.sort((a, b) => {
    if (a.SpaceX === b.SpaceX) return a.SpaceY - b.SpaceY;
    return a.SpaceX - b.SpaceX;
  });

  Universe.CatalogSeed = Universe.UniverseSeed;
  Universe.CatalogByCoord = catalogByCoord;
  Universe.CatalogArray = catalogArray;

  dprint("Built catalog with", catalogArray.length, "systems using seed", Universe.UniverseSeed);
  return [catalogByCoord, catalogArray];
}

function getSystemsArray() {
  return buildCatalog()[1];
}

function getSystem(spaceX, spaceY) {
  const catalogByCoord = buildCatalog()[0];
  return catalogByCoord[key2(spaceX, spaceY)];
}

function findBody(system, systemX, systemY) {
  if (!system) return null;
  for (const body of system.Bodies) {
    if (body.LocalX === systemX && body.LocalY === systemY) return body;
  }
  return null;
}

function isValidDestination(spaceX, spaceY, systemX, systemY, zone) {
  const system = getSystem(spaceX, spaceY);
  if (!system) return false;
  if (zone === "F") return true;
  if (zone === "T") return findBody(system, systemX, systemY) !== null;
  return false;
}

function getDefaultDestination() {
  const arr = getSystemsArray();
  const first = arr[0];
  if (!first) return { spaceX: 0, spaceY: 0, systemX: 0, systemY: 0, zone: "F" };
  return { spaceX: first.SpaceX, spaceY: first.SpaceY, systemX: 0, systemY: 0, zone: "F" };
}

function getDestinationData(spaceX, spaceY, systemX, systemY, zone) {
  const system = getSystem(spaceX, spaceY);
  if (!system) return null;

  const body = findBody(system, systemX, systemY);

  if (zone === "T") {
    if (!body) return null;
    return {
      UniverseSeed: Universe.UniverseSeed,
      SpaceX: spaceX,
      SpaceY: spaceY,
      SystemX: systemX,
      SystemY: systemY,
      Zone: "T",
      SystemID: system.SystemID,
      Seed: system.Seed,
      CelestialBodyID: body.BodyID,
      CelestialBodyType: 0,
      System: system,
      Body: body,
      World: {
        Color: body.Color,
        Gravity: body.Gravity,
        Roughness: body.Roughness
      }
    };
  }

  return {
    UniverseSeed: Universe.UniverseSeed,
    SpaceX: spaceX,
    SpaceY: spaceY,
    SystemX: systemX,
    SystemY: systemY,
    Zone: "F",
    SystemID: system.SystemID,
    Seed: system.Seed,
    CelestialBodyID: body ? body.BodyID : 0,
    CelestialBodyType: 1,
    System: system,
    Body: body,
    World: {
      Color: body ? body.Color : system.StarColor,
      Gravity: 0,
      Roughness: 0
    }
  };
}

function canvasSize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", canvasSize);
canvasSize();

let mode = "Galaxy";
let cameraX = 0;
let cameraY = 0;
let zoom = 1;

const keys = { w: false, a: false, s: false, d: false };

let selectedSystem = null;
let selectedBody = null;
let selectedSpaceX = 0;
let selectedSpaceY = 0;
let selectedSystemX = 0;
let selectedSystemY = 0;
let selectedZone = "F";

const world = getDefaultDestination();
selectedSpaceX = world.spaceX;
selectedSpaceY = world.spaceY;
selectedSystem = getSystem(selectedSpaceX, selectedSpaceY);
cameraX = selectedSpaceX;
cameraY = selectedSpaceY;

const markers = [];
let selectedMarker = null;

function showSystemInfo(system) {
  if (!system) {
    info.textContent = "No system.";
    return;
  }

  info.textContent = [
    `System [${system.SpaceX}, ${system.SpaceY}]`,
    `Star Type: ${system.StarType}`,
    `Star Color: rgb(${system.StarColor.r}, ${system.StarColor.g}, ${system.StarColor.b})`,
    `Planets: ${system.PlanetCount}`,
    `Star Temp: ${system.StarTemperature} K`,
    `System ID: ${system.SystemID}`,
    `Seed: ${system.Seed}`
  ].join("\n");
}

function showBodyInfo(body) {
  if (!body) {
    info.textContent = "No celestial body.";
    return;
  }

  info.textContent = [
    `Body ID: ${body.BodyID}`,
    `Type: ${body.Type}`,
    `Size: ${body.Size}`,
    `Has Rings: ${body.HasRings ? "Yes" : "No"}`,
    `Temperature: ${body.Temperature} K`,
    `Breathable: ${body.Breathable ? "Yes" : "No"}`,
    `Gravity: ${body.Gravity.toFixed(2)}`,
    `Orbit: ${body.OrbitRadius} PU`
  ].join("\n");
}

function updateCoords2() {
  if (mode === "Galaxy") {
    coords2.textContent = `[${selectedSpaceX}, ${selectedSpaceY} : 0, 0]`;
  } else {
    coords2.textContent = `[${selectedSpaceX}, ${selectedSpaceY} : ${selectedSystemX}, ${selectedSystemY}]`;
  }
}

function clearMarkers() {
  for (const m of markers) {
    if (m.el && m.el.parentNode) m.el.parentNode.removeChild(m.el);
    if (m.ring && m.ring.parentNode) m.ring.parentNode.removeChild(m.ring);
  }
  markers.length = 0;
}

function createRingElement(parent, x, y, size) {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.left = `${x - size / 2}px`;
  div.style.top = `${y - size / 2}px`;
  div.style.width = `${size}px`;
  div.style.height = `${size}px`;
  div.style.borderRadius = "999px";
  div.style.border = "2px solid rgba(255,255,255,0.9)";
  div.style.boxShadow = "0 0 12px rgba(255,255,255,0.35)";
  div.style.pointerEvents = "none";
  parent.appendChild(div);
  return div;
}

function createMarker(x, y, size, color, text, data) {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "999px";
  el.style.background = color;
  el.style.left = "0px";
  el.style.top = "0px";
  el.style.transform = "translate(-50%, -50%)";
  el.style.cursor = "pointer";
  el.style.pointerEvents = "auto";
  el.style.boxShadow = "0 0 8px rgba(0,0,0,0.7)";
  if (text) el.textContent = text;
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.color = "white";
  el.style.fontSize = "10px";
  el.style.userSelect = "none";

  const ring = document.createElement("div");
  ring.style.position = "absolute";
  ring.style.width = `${size + 16}px`;
  ring.style.height = `${size + 16}px`;
  ring.style.borderRadius = "999px";
  ring.style.border = "2px solid transparent";
  ring.style.pointerEvents = "none";
  ring.style.left = `${x - (size + 16) / 2}px`;
  ring.style.top = `${y - (size + 16) / 2}px`;
  ring.style.display = "none";
  canvas.parentElement.appendChild(ring);

  canvas.parentElement.appendChild(el);

  const marker = { x, y, size, color, el, ring, data };
  markers.push(marker);
  return marker;
}

function currentCenter() {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2
  };
}

function worldToScreen(wx, wy) {
  const c = currentCenter();
  const tile = (mode === "Galaxy" ? 16 : 18) * zoom;
  return {
    x: c.x + (wx - cameraX) * tile,
    y: c.y + (-wy + cameraY) * tile
  };
}

function hoverWorldCoords() {
  const rect = canvas.getBoundingClientRect();
  const mx = mouse.x - rect.left;
  const my = mouse.y - rect.top;

  if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) return null;

  const tile = (mode === "Galaxy" ? 16 : 18) * zoom;
  const gx = Math.round(cameraX + ((mx - rect.width * 0.5) / tile));
  const gy = Math.round(cameraY - ((my - rect.height * 0.5) / tile));
  return { x: gx, y: gy };
}

function setSelectedHalo(marker) {
  selectedMarker = marker;
  for (const m of markers) {
    if (m.ring) m.ring.style.display = "none";
  }
  if (marker && marker.ring) {
    marker.ring.style.display = "block";
  }
}

function buildGalaxyMarkers() {
  clearMarkers();
  const systems = getSystemsArray();

  for (const system of systems) {
    const pos = worldToScreen(system.SpaceX, system.SpaceY);
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    el.style.width = "12px";
    el.style.height = "12px";
    el.style.borderRadius = "999px";
    el.style.background = rgbString(system.StarColor);
    el.style.transform = "translate(-50%, -50%)";
    el.style.cursor = "pointer";
    el.style.pointerEvents = "auto";
    el.style.boxShadow = "0 0 10px rgba(0,0,0,0.7)";
    canvas.parentElement.appendChild(el);

    const ring = createRingElement(canvas.parentElement, pos.x, pos.y, 24);
    ring.style.display = "none";

    const marker = { x: system.SpaceX, y: system.SpaceY, el, ring, data: system, kind: "system" };
    markers.push(marker);

    el.addEventListener("click", () => {
      selectedSystem = system;
      selectedBody = null;
      selectedSpaceX = system.SpaceX;
      selectedSpaceY = system.SpaceY;
      selectedSystemX = 0;
      selectedSystemY = 0;
      selectedZone = "F";
      cameraX = 0;
      cameraY = 0;
      mode = "System";
      showSystemInfo(system);
      rebuildView();
    });

    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showSystemInfo(system);
    });

    el.addEventListener("auxclick", (e) => {
      if (e.button === 1) {
        selectedSystem = system;
        selectedBody = null;
        selectedSpaceX = system.SpaceX;
        selectedSpaceY = system.SpaceY;
        selectedSystemX = 0;
        selectedSystemY = 0;
        selectedZone = "F";
        setSelectedHalo(marker);
        updateCoords2();
      }
    });
  }

  showSystemInfo(selectedSystem);
  updateCoords2();
  dprint("Galaxy markers built:", systems.length);
}

function buildSystemMarkers() {
  clearMarkers();
  if (!selectedSystem) return;

  const c = currentCenter();

  const star = document.createElement("div");
  star.style.position = "absolute";
  star.style.left = `${c.x}px`;
  star.style.top = `${c.y}px`;
  star.style.width = "18px";
  star.style.height = "18px";
  star.style.borderRadius = "999px";
  star.style.background = rgbString(selectedSystem.StarColor);
  star.style.transform = "translate(-50%, -50%)";
  star.style.cursor = "pointer";
  star.style.pointerEvents = "auto";
  star.style.boxShadow = "0 0 14px rgba(255,255,255,0.9)";
  star.textContent = "★";
  star.style.fontSize = "12px";
  star.style.display = "flex";
  star.style.alignItems = "center";
  star.style.justifyContent = "center";
  star.style.color = "white";
  canvas.parentElement.appendChild(star);

  const starRing = createRingElement(canvas.parentElement, c.x, c.y, 36);
  const starMarker = { x: 0, y: 0, el: star, ring: starRing, data: selectedSystem, kind: "star" };
  markers.push(starMarker);

  star.addEventListener("click", () => {
    showSystemInfo(selectedSystem);
  });

  star.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showSystemInfo(selectedSystem);
  });

  star.addEventListener("auxclick", (e) => {
    if (e.button === 1) {
      selectedSpaceX = selectedSystem.SpaceX;
      selectedSpaceY = selectedSystem.SpaceY;
      selectedSystemX = 0;
      selectedSystemY = 0;
      selectedZone = "F";
      setSelectedHalo(starMarker);
      updateCoords2();
      showSystemInfo(selectedSystem);
    }
  });

  for (const body of selectedSystem.Bodies) {
    const pos = worldToScreen(body.LocalX, body.LocalY);
    const size = Math.max(10, Math.min(24, Math.floor(body.Size * 0.14)));

    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = "999px";
    el.style.background = rgbString(body.Color);
    el.style.transform = "translate(-50%, -50%)";
    el.style.cursor = "pointer";
    el.style.pointerEvents = "auto";
    el.style.boxShadow = "0 0 10px rgba(0,0,0,0.75)";
    canvas.parentElement.appendChild(el);

    const ring = createRingElement(canvas.parentElement, pos.x, pos.y, size + 16);
    ring.style.display = "none";

    const marker = { x: body.LocalX, y: body.LocalY, el, ring, data: body, kind: "body" };
    markers.push(marker);

    el.addEventListener("click", () => {
      showBodyInfo(body);
    });

    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showBodyInfo(body);
    });

    el.addEventListener("auxclick", (e) => {
      if (e.button === 1) {
        selectedBody = body;
        selectedSpaceX = selectedSystem.SpaceX;
        selectedSpaceY = selectedSystem.SpaceY;
        selectedSystemX = body.LocalX;
        selectedSystemY = body.LocalY;
        selectedZone = "T";
        setSelectedHalo(marker);
        updateCoords2();
        showBodyInfo(body);
      }
    });
  }

  showSystemInfo(selectedSystem);
  updateCoords2();
  dprint("System markers built for:", selectedSystem.SpaceX, selectedSystem.SpaceY);
}

function rebuildView() {
  if (mode === "Galaxy") {
    buildGalaxyMarkers();
  } else {
    buildSystemMarkers();
  }
  updateSelectionStyles();
}

function updateSelectionStyles() {
  for (const m of markers) {
    if (m.kind === "system") {
      if (mode === "Galaxy" && selectedSystem === m.data) {
        m.el.style.width = "16px";
        m.el.style.height = "16px";
        m.ring.style.display = "block";
      } else {
        m.el.style.width = "12px";
        m.el.style.height = "12px";
      }
    } else if (m.kind === "body") {
      if (selectedBody === m.data) {
        m.ring.style.display = "block";
      } else if (selectedMarker !== m) {
        m.ring.style.display = "none";
      }
    } else if (m.kind === "star") {
      if (selectedMarker === m) {
        m.ring.style.display = "block";
      } else if (selectedMarker !== m) {
        m.ring.style.display = "none";
      }
    }
  }
}

function refreshMarkerPositions() {
  for (const m of markers) {
    const pos = worldToScreen(m.x, m.y);
    m.el.style.left = `${pos.x}px`;
    m.el.style.top = `${pos.y}px`;
    if (m.ring) {
      const size = m.kind === "system" ? 24 : m.kind === "star" ? 36 : Math.max(20, Math.min(40, Math.floor(m.data.Size * 0.14) + 16));
      m.ring.style.left = `${pos.x - size / 2}px`;
      m.ring.style.top = `${pos.y - size / 2}px`;
      m.ring.style.width = `${size}px`;
      m.ring.style.height = `${size}px`;
    }
  }
  updateSelectionStyles();
}

function syncFromCurrentSelection() {
  const currentSystem = getSystem(selectedSpaceX, selectedSpaceY) || getSystemsArray()[0];
  selectedSystem = currentSystem;

  if (selectedSystem) {
    selectedSpaceX = selectedSystem.SpaceX;
    selectedSpaceY = selectedSystem.SpaceY;
  }

  if (selectedZone === "T" && selectedSystem) {
    const body = findBody(selectedSystem, selectedSystemX, selectedSystemY);
    if (body) {
      selectedBody = body;
    } else {
      selectedBody = null;
      selectedZone = "F";
      selectedSystemX = 0;
      selectedSystemY = 0;
    }
  } else {
    selectedBody = null;
  }

  if (selectedSystem) {
    cameraX = selectedSystem.SpaceX;
    cameraY = selectedSystem.SpaceY;
  }

  updateCoords2();
}

function sendTeleport() {
  const payload = {
    UniverseSeed: Universe.UniverseSeed,
    SpaceX: selectedSpaceX,
    SpaceY: selectedSpaceY,
    SystemX: selectedSystemX,
    SystemY: selectedSystemY,
    Zone: selectedZone
  };

  if (!isValidDestination(payload.SpaceX, payload.SpaceY, payload.SystemX, payload.SystemY, payload.Zone)) {
    info.textContent = "Invalid destination.";
    return;
  }

  console.log("[Map] Teleport request:", payload.SpaceX, payload.SpaceY, payload.SystemX, payload.SystemY, payload.Zone);
  dprint("Teleport payload:", payload);
}

backBtn.addEventListener("click", () => {
  mode = "Galaxy";
  cameraX = selectedSpaceX;
  cameraY = selectedSpaceY;
  selectedMarker = null;
  showSystemInfo(selectedSystem);
  rebuildView();
});

teleportBtn.addEventListener("click", () => {
  sendTeleport();
});

let mouse = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "w") keys.w = true;
  if (e.key.toLowerCase() === "a") keys.a = true;
  if (e.key.toLowerCase() === "s") keys.s = true;
  if (e.key.toLowerCase() === "d") keys.d = true;
  if (e.key.toLowerCase() === "m") {
    canvas.style.display = canvas.style.display === "none" ? "block" : "none";
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key.toLowerCase() === "w") keys.w = false;
  if (e.key.toLowerCase() === "a") keys.a = false;
  if (e.key.toLowerCase() === "s") keys.s = false;
  if (e.key.toLowerCase() === "d") keys.d = false;
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  zoom = Math.max(0.5, Math.min(3, zoom + (e.deltaY < 0 ? 0.12 : -0.12)));
  refreshMarkerPositions();
}, { passive: false });

canvas.addEventListener("mousemove", () => {
  const hover = hoverWorldCoords();
  if (!hover) {
    coords1.textContent = "[?, ? : ?, ?]";
    return;
  }

  if (mode === "Galaxy") {
    coords1.textContent = `[${hover.x}, ${hover.y} : 0, 0]`;
  } else {
    coords1.textContent = `[${selectedSpaceX}, ${selectedSpaceY} : ${hover.x}, ${hover.y}]`;
  }
});

canvas.addEventListener("mouseleave", () => {
  coords1.textContent = "[?, ? : ?, ?]";
});

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const c = currentCenter();
  const tile = (mode === "Galaxy" ? 16 : 18) * zoom;
  const gridRange = mode === "Galaxy" ? 100 : 40;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;

  for (let i = -gridRange; i <= gridRange; i++) {
    const x = c.x + (i - cameraX) * tile;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let j = -gridRange; j <= gridRange; j++) {
    const y = c.y + (-j + cameraY) * tile;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function update() {
  const speed = (mode === "Galaxy" ? 30 : 20) / zoom;

  if (keys.w) cameraY += speed * (1 / 60);
  if (keys.s) cameraY -= speed * (1 / 60);
  if (keys.a) cameraX -= speed * (1 / 60);
  if (keys.d) cameraX += speed * (1 / 60);

  cameraX = Math.max(-100, Math.min(100, cameraX));
  cameraY = Math.max(-100, Math.min(100, cameraY));

  drawGrid();
  refreshMarkerPositions();

  const hover = hoverWorldCoords();
  if (hover) {
    if (mode === "Galaxy") {
      coords1.textContent = `[${hover.x}, ${hover.y} : 0, 0]`;
    } else {
      coords1.textContent = `[${selectedSpaceX}, ${selectedSpaceY} : ${hover.x}, ${hover.y}]`;
    }
  }

  requestAnimationFrame(update);
}

setUniverseSeed(Universe.DefaultUniverseSeed);
selectedSystem = getSystem(selectedSpaceX, selectedSpaceY) || getSystemsArray()[0];
selectedSpaceX = selectedSystem.SpaceX;
selectedSpaceY = selectedSystem.SpaceY;
cameraX = selectedSpaceX;
cameraY = selectedSpaceY;
showSystemInfo(selectedSystem);
updateCoords2();
rebuildView();
update();
