<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Deep Space Universe Map</title>
  <style>
    * {
      box-sizing: border-box;
      user-select: none;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #030408;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    #app {
      position: relative;
      width: 100vw;
      height: 100vh;
    }
    #map {
      width: 100%;
      height: 100%;
      display: block;
      background: #030408;
    }
    #ui {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .glass-panel {
      pointer-events: auto;
      background: rgba(13, 17, 28, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
    }
    /* Top Bar */
    #topBar {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
    }
    #navPath {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #38bdf8;
    }
    #coordsBadge {
      font-family: monospace;
      font-size: 14px;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 4px 10px;
      border-radius: 6px;
      color: #7dd3fc;
    }
    /* Buttons */
    .btn {
      pointer-events: auto;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 8px 16px;
      color: #ffffff;
      background: rgba(30, 41, 59, 0.8);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover {
      background: rgba(51, 65, 85, 0.9);
      border-color: #38bdf8;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
    }
    .btn-green {
      background: rgba(20, 83, 45, 0.8);
      border-color: rgba(34, 197, 94, 0.4);
    }
    .btn-green:hover {
      background: rgba(22, 101, 52, 0.9);
      border-color: #22c55e;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
    }
    /* Info Card */
    #infoCard {
      position: absolute;
      right: 16px;
      bottom: 16px;
      width: 320px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #infoTitle {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 6px;
    }
    #infoBody {
      font-size: 13px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .info-label {
      color: #94a3b8;
    }
    .info-value {
      font-weight: 600;
      color: #f1f5f9;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    /* Controls Overlay */
    #controlsPanel {
      position: absolute;
      left: 16px;
      bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    #jumpRow {
      display: flex;
      gap: 8px;
    }
    #jumpInput {
      pointer-events: auto;
      width: 180px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(15, 23, 42, 0.8);
      color: white;
      outline: none;
      font-size: 13px;
    }
    #jumpInput:focus {
      border-color: #38bdf8;
    }
    #hint {
      font-size: 11px;
      color: #64748b;
      max-width: 380px;
    }
  </style>
</head>
<body>
  <div id="app">
    <canvas id="map"></canvas>
    
    <div id="ui">
      <!-- Top Header Navigation -->
      <div id="topBar" class="glass-panel">
        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="backBtn" class="btn">◀ Back</button>
          <div id="navPath">Cluster Overview</div>
        </div>
        <div id="coordsBadge">Target: [?, ?]</div>
      </div>

      <!-- Left Controls Panel -->
      <div id="controlsPanel">
        <div id="jumpRow">
          <input id="jumpInput" type="text" placeholder="Coordinates e.g. 12, -8" />
          <button id="goBtn" class="btn">Go</button>
        </div>
        <div id="hint" class="glass-panel" style="padding: 8px 12px;">
          🎮 WASD / Drag: Pan · Scroll: Zoom · Left Click: Open · Right Click: Info
        </div>
      </div>

      <!-- Right Info Card -->
      <div id="infoCard" class="glass-panel">
        <div id="infoTitle">System Information</div>
        <div id="infoBody">Right click any star system or planet to inspect details.</div>
        <button id="teleportBtn" class="btn btn-green" style="width: 100%; justify-content: center; margin-top: 6px;">
          🚀 Enter System / Surface
        </button>
      </div>
    </div>
  </div>

  <script>
    "use strict";

    const TAU = Math.PI * 2;

    // --- CONFIGURATION & GENERATION SPECS ---
    const CONFIG = {
      seed: 88219,
      totalStars: 100,
      mapRadius: 160,
      scale: 18,
    };

    // Planetary Types and Properties
    const PLANET_TYPES = {
      Safe: { color: "#38bdf8", desc: "Safe starting worlds; rich in basic metallic resources like iron, copper, and coal." },
      Terra: { color: "#22c55e", desc: "Hospitable worlds with diverse biomes, oceans, and varied materials." },
      Forest: { color: "#15803d", desc: "Green environments filled with dense vegetation and building timber." },
      Tundra: { color: "#94a3b8", desc: "Cold, snow-covered icy landscapes with specialized environmental conditions." },
      Desert: { color: "#f59e0b", desc: "Arid, sand-dominant regions with extreme heat and sparse vegetation." },
      Barren: { color: "#78716c", desc: "Rugged, ore-rich rocky worlds optimized for heavy mining." },
      Exotic: { color: "#a855f7", desc: "Randomized continents, deep trenches, tall peaks, and bizarre materials." },
      GasGiant: { color: "#f97316", desc: "Massive gas spheres with extreme weather and resource-rich ring systems." },
      Volcanic: { color: "#ef4444", desc: "Molten lava worlds with fierce tectonic activity and high warmth." },
      IceWorld: { color: "#06b6d4", desc: "Opposite of volcanic; extreme deep-frozen glacier environments." }
    };

    const NAME_A = ["Aegis","Boreas","Cygnus","Drakon","Elysium","Helios","Hyperion","Ignis","Kratos","Lumina","Nexus","Orion","Pyros","Solaria","Titan","Vesper","Zephyrus","Astra","VORTEX","Solis"];
    const NAME_B = ["Prime","Major","Minor","Zero","IX","IV","VII","Alpha","Omega","Core","Reach","Haven","Deep","Nova"];

    // App State
    const state = {
      mode: "Cluster", // Cluster, System, Surface
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
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragCamX: 0,
      dragCamY: 0,
      keys: { w: false, a: false, s: false, d: false },
      catalog: [],
      starsBg: []
    };

    // Helper Math & RNG
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    
    function makeRng(seed) {
      let t = seed >>> 0;
      return {
        next() {
          t += 0x6D2B79F5;
          let x = t;
          x = Math.imul(x ^ (x >>> 15), x | 1);
          x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
          return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
        },
        float(min = 0, max = 1) { return min + this.next() * (max - min); },
        int(min, max) { return Math.floor(this.float(min, max + 1)); },
        pick(arr) { return arr[this.int(0, arr.length - 1)]; }
      };
    }

    // --- CATALOG GENERATOR (1 Cluster, 100 Stars) ---
    function generateUniverseCatalog() {
      const rng = makeRng(CONFIG.seed);
      const catalog = [];
      const usedPos = {};

      // Star Distribution Setup (Strict total = 100)
      const starTypeList = [];
      for (let i = 0; i < 25; i++) starTypeList.push("Neutron Star");
      for (let i = 0; i < 15; i++) starTypeList.push("Pulsar");
      for (let i = 0; i < 15; i++) starTypeList.push("Black Hole");
      
      const standardTypes = ["Yellow Star", "Red Dwarf", "Blue Giant", "White Dwarf", "Orange Star"];
      while (starTypeList.length < 100) {
        starTypeList.push(rng.pick(standardTypes));
      }

      // Shuffle star types
      for (let i = starTypeList.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [starTypeList[i], starTypeList[j]] = [starTypeList[j], starTypeList[i]];
      }

      // Generate 100 Star Systems
      for (let i = 0; i < 100; i++) {
        const type = starTypeList[i];
        let x, y, k;
        let tries = 0;

        // Choose spatial coordinates in cluster
        do {
          const angle = rng.float(0, TAU);
          const dist = Math.pow(rng.float(0.1, 1), 0.8) * CONFIG.mapRadius;
          x = Math.floor(Math.cos(angle) * dist);
          y = Math.floor(Math.sin(angle) * dist);
          k = `${x},${y}`;
          tries++;
        } while (usedPos[k] && tries < 500);

        usedPos[k] = true;

        // Physical Properties
        let size, mass, color, temp;
        if (type === "Black Hole") {
          size = 5; // 50% smaller than average stars (avg ~10)
          mass = 2.5; // 150% heavier
          color = "#000000";
          temp = 0;
        } else if (type === "Neutron Star") {
          size = 4; // Very small
          mass = 2.0; // Very heavy
          color = "#38bdf8";
          temp = 100000;
        } else if (type === "Pulsar") {
          size = 4; // Very small
          mass = 2.2; // Heavy
          color = "#a855f7";
          temp = 120000;
        } else if (type === "Blue Giant") {
          size = 18; mass = 1.8; color = "#60a5fa"; temp = 25000;
        } else if (type === "Red Dwarf") {
          size = 8; mass = 0.5; color = "#ef4444"; temp = 3200;
        } else {
          size = 11; mass = 1.0; color = "#facc15"; temp = 5800;
        }

        // Generate Orbiting Bodies
        const planetCount = rng.int(2, 8);
        const bodies = [];

        for (let b = 1; b <= planetCount; b++) {
          const orbitRadius = b * 5 + rng.float(2, 4);
          let pType;

          if (type === "Black Hole") {
            // BLACK HOLE RULE: CANNOT have Volcanic worlds!
            const allowed = ["IceWorld", "IceWorld", "Tundra", "Barren", "Exotic", "GasGiant"];
            pType = rng.pick(allowed);
          } else if (type === "Neutron Star" || type === "Pulsar") {
            // NEUTRON / PULSAR RULE: Mostly Ice Worlds (~75% chance)
            if (rng.next() < 0.75) {
              pType = "IceWorld";
            } else {
              pType = rng.pick(["Tundra", "Barren", "Exotic", "GasGiant"]);
            }
          } else {
            // STANDARD STARS: Distance & Temp Logic
            if (orbitRadius < 8) {
              pType = rng.pick(["Volcanic", "Desert", "Barren", "Exotic"]);
            } else if (orbitRadius <= 16) {
              pType = rng.pick(["Safe", "Terra", "Forest", "Exotic", "Barren"]);
            } else {
              pType = rng.pick(["IceWorld", "Tundra", "GasGiant"]);
            }
          }

          // Angle positioning in orbit
          const pAngle = rng.float(0, TAU);
          const px = Math.floor(Math.cos(pAngle) * orbitRadius);
          const py = Math.floor(Math.sin(pAngle) * orbitRadius);

          let pSize = pType === "GasGiant" ? rng.int(28, 42) : rng.int(10, 22);
          let pGravity = pType === "GasGiant" ? rng.float(2.0, 4.0) : rng.float(0.4, 1.6);
          let pTemp = Math.floor(temp / Math.sqrt(orbitRadius) * 0.15) - 100;
          if (pType === "IceWorld") pTemp = Math.min(pTemp, -80);
          if (pType === "Volcanic") pTemp = Math.max(pTemp, 450);

          bodies.push({
            id: b,
            name: `${rng.pick(NAME_A)} ${b}`,
            type: pType,
            orbitRadius: orbitRadius,
            x: px,
            y: py,
            size: pSize,
            gravity: pGravity,
            temp: pTemp,
            hasRings: (pType === "GasGiant" || pType === "IceWorld") && rng.next() < 0.5,
            info: PLANET_TYPES[pType]
          });
        }

        catalog.push({
          id: i + 1,
          name: `${rng.pick(NAME_A)} System`,
          type: type,
          x: x,
          y: y,
          size: size,
          mass: mass,
          color: color,
          temp: temp,
          bodies: bodies
        });
      }

      return catalog;
    }

    // --- CANVAS ENGINE & RENDERING ---
    const canvas = document.getElementById("map");
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function generateStarfield() {
      const rng = makeRng(12345);
      state.starsBg = [];
      for (let i = 0; i < 300; i++) {
        state.starsBg.push({
          x: rng.next(),
          y: rng.next(),
          r: rng.float(0.5, 1.6),
          alpha: rng.float(0.2, 0.8)
        });
      }
    }

    function worldToScreen(wx, wy) {
      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.5;
      const s = CONFIG.scale * state.zoom;
      return {
        x: cx + (wx - state.cameraX) * s,
        y: cy - (wy - state.cameraY) * s
      };
    }

    function screenToWorld(sx, sy) {
      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.5;
      const s = CONFIG.scale * state.zoom;
      return {
        x: (sx - cx) / s + state.cameraX,
        y: -(sy - cy) / s + state.cameraY
      };
    }

    // Dynamic Render Loops
    function drawBackground() {
      ctx.fillStyle = "#030408";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Deep Space Nebula Glow
      const grad = ctx.createRadialGradient(canvas.width*0.5, canvas.height*0.5, 50, canvas.width*0.5, canvas.height*0.5, canvas.width*0.8);
      grad.addColorStop(0, "rgba(15, 23, 42, 0.6)");
      grad.addColorStop(0.5, "rgba(8, 11, 20, 0.8)");
      grad.addColorStop(1, "#030408");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars background
      for (const s of state.starsBg) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, TAU);
        ctx.fill();
      }
    }

    function drawClusterView() {
      const time = Date.now() * 0.002;

      for (const sys of state.catalog) {
        const p = worldToScreen(sys.x, sys.y);
        
        // Skip out of view
        if (p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50) continue;

        // Custom Render by Star Type
        if (sys.type === "Black Hole") {
          // Gravitational Accretion Disk Lensing
          ctx.beginPath();
          ctx.arc(p.x, p.y, sys.size * 2.8, 0, TAU);
          const bhGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, sys.size * 3);
          bhGrad.addColorStop(0, "#000");
          bhGrad.addColorStop(0.4, "rgba(234, 88, 12, 0.9)");
          bhGrad.addColorStop(0.8, "rgba(251, 146, 60, 0.3)");
          bhGrad.addColorStop(1, "transparent");
          ctx.fillStyle = bhGrad;
          ctx.fill();

          // Event Horizon
          ctx.beginPath();
          ctx.arc(p.x, p.y, sys.size, 0, TAU);
          ctx.fillStyle = "#000000";
          ctx.fill();
          ctx.strokeStyle = "#fdba74";
          ctx.lineWidth = 1.5;
          ctx.stroke();

        } else if (sys.type === "Pulsar") {
          // Polar Energy Jets
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(time * 3);
          ctx.fillStyle = "rgba(168, 85, 247, 0.4)";
          ctx.fillRect(-2, -35, 4, 70);
          ctx.restore();

          // Core
          ctx.beginPath();
          ctx.arc(p.x, p.y, sys.size, 0, TAU);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.strokeStyle = "#c084fc";
          ctx.lineWidth = 3;
          ctx.stroke();

        } else if (sys.type === "Neutron Star") {
          // Cyan Magnetic Aura
          ctx.beginPath();
          ctx.arc(p.x, p.y, sys.size * 2.2, 0, TAU);
          ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, sys.size, 0, TAU);
          ctx.fillStyle = "#e0f2fe";
          ctx.fill();

        } else {
          // Standard Star Glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, sys.size * 1.8, 0, TAU);
          ctx.fillStyle = sys.color;
          ctx.globalAlpha = 0.25;
          ctx.fill();
          ctx.globalAlpha = 1.0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, sys.size * 0.8, 0, TAU);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }

        // Selection / Hover Highlight
        if (state.hoverItem && state.hoverItem.data === sys) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, sys.size + 8, 0, TAU);
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    function drawSystemView() {
      const sys = state.currentSystem;
      if (!sys) return;

      const center = worldToScreen(0, 0);

      // Render Star at center
      if (sys.type === "Black Hole") {
        ctx.beginPath();
        ctx.arc(center.x, center.y, 25, 0, TAU);
        ctx.fillStyle = "#000000";
        ctx.fill();
        ctx.strokeStyle = "#f97316";
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(center.x, center.y, 30, 0, TAU);
        ctx.fillStyle = sys.color;
        ctx.fill();
      }

      // Orbits & Planets
      for (const body of sys.bodies) {
        const orbitPx = body.orbitRadius * CONFIG.scale * state.zoom;
        
        // Draw Orbit Line
        ctx.beginPath();
        ctx.arc(center.x, center.y, orbitPx, 0, TAU);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Planet Position
        const p = worldToScreen(body.x, body.y);

        // Gas Giant Rings
        if (body.hasRings) {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, body.size * 0.8, body.size * 0.3, 0.4, 0, TAU);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Planet Sphere
        ctx.beginPath();
        ctx.arc(p.x, p.y, body.size * 0.4, 0, TAU);
        ctx.fillStyle = body.info.color;
        ctx.fill();

        // Hover Ring
        if (state.hoverItem && state.hoverItem.data === body) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, body.size * 0.4 + 6, 0, TAU);
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    function drawSurfaceView() {
      const body = state.currentBody;
      if (!body) return;

      const cx = canvas.width * 0.5;
      const cy = canvas.height * 0.5;
      const r = Math.min(canvas.width, canvas.height) * 0.25;

      // Planet Sphere Render with Dynamic Atmosphere Gradient
      const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.5, body.info.color);
      grad.addColorStop(1, "#000000");

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fillStyle = grad;
      ctx.fill();

      // Atmospheric Glow Ring
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, TAU);
      ctx.strokeStyle = body.info.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    function render() {
      drawBackground();

      if (state.mode === "Cluster") drawClusterView();
      else if (state.mode === "System") drawSystemView();
      else if (state.mode === "Surface") drawSurfaceView();

      updateHoverAndUI();
      requestAnimationFrame(render);
    }

    // --- INTERACTION & HIT DETECTION ---
    function updateHoverAndUI() {
      let foundHover = null;

      if (state.mode === "Cluster") {
        for (const sys of state.catalog) {
          const p = worldToScreen(sys.x, sys.y);
          const dist = Math.hypot(state.mouseX - p.x, state.mouseY - p.y);
          if (dist < sys.size + 10) {
            foundHover = { kind: "system", data: sys };
            break;
          }
        }
      } else if (state.mode === "System" && state.currentSystem) {
        for (const body of state.currentSystem.bodies) {
          const p = worldToScreen(body.x, body.y);
          const dist = Math.hypot(state.mouseX - p.x, state.mouseY - p.y);
          if (dist < body.size * 0.4 + 8) {
            foundHover = { kind: "body", data: body };
            break;
          }
        }
      }

      state.hoverItem = foundHover;

      // Coordinates display update
      const coordsBadge = document.getElementById("coordsBadge");
      if (foundHover) {
        coordsBadge.textContent = `Target: [${foundHover.data.x || 0}, ${foundHover.data.y || 0}]`;
      } else {
        const w = screenToWorld(state.mouseX, state.mouseY);
        coordsBadge.textContent = `Cursor: [${Math.round(w.x)}, ${Math.round(w.y)}]`;
      }
    }

    function displayInfo(item) {
      const title = document.getElementById("infoTitle");
      const body = document.getElementById("infoBody");

      if (!item) {
        title.textContent = "Information";
        body.innerHTML = "Right click any celestial object to view detailed metrics.";
        return;
      }

      state.selectedItem = item;

      if (item.kind === "system") {
        const sys = item.data;
        title.textContent = sys.name;
        body.innerHTML = `
          <div class="info-row"><span class="info-label">Star Type:</span><span class="info-value">${sys.type}</span></div>
          <div class="info-row"><span class="info-label">Coordinates:</span><span class="info-value">[${sys.x}, ${sys.y}]</span></div>
          <div class="info-row"><span class="info-label">Solar Mass:</span><span class="info-value">${sys.mass} M☉</span></div>
          <div class="info-row"><span class="info-label">Temperature:</span><span class="info-value">${sys.temp} K</span></div>
          <div class="info-row"><span class="info-label">Planets:</span><span class="info-value">${sys.bodies.length} Worlds</span></div>
        `;
      } else if (item.kind === "body") {
        const p = item.data;
        title.textContent = p.name;
        body.innerHTML = `
          <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${p.type} World</span></div>
          <div class="info-row"><span class="info-label">Gravity:</span><span class="info-value">${p.gravity.toFixed(2)} G</span></div>
          <div class="info-row"><span class="info-label">Temperature:</span><span class="info-value">${p.temp} K</span></div>
          <div class="info-row"><span class="info-label">Rings:</span><span class="info-value">${p.hasRings ? "Yes" : "No"}</span></div>
          <p style="margin-top: 8px; color: #94a3b8; font-size: 12px;">${p.info.desc}</p>
        `;
      }
    }

    // --- NAVIGATION & EVENT LISTENERS ---
    const backBtn = document.getElementById("backBtn");
    const teleportBtn = document.getElementById("teleportBtn");
    const navPath = document.getElementById("navPath");

    function setMode(mode, system = null, body = null) {
      state.mode = mode;
      state.currentSystem = system;
      state.currentBody = body;
      state.zoom = 1;
      state.cameraX = 0;
      state.cameraY = 0;

      if (mode === "Cluster") {
        navPath.textContent = "Cluster Overview (100 Stars)";
      } else if (mode === "System") {
        navPath.textContent = `Cluster → ${system.name}`;
      } else if (mode === "Surface") {
        navPath.textContent = `Cluster → ${system.name} → ${body.name}`;
      }
    }

    backBtn.addEventListener("click", () => {
      if (state.mode === "Surface") setMode("System", state.currentSystem);
      else if (state.mode === "System") setMode("Cluster");
    });

    teleportBtn.addEventListener("click", () => {
      if (state.selectedItem) {
        if (state.selectedItem.kind === "system") {
          setMode("System", state.selectedItem.data);
        } else if (state.selectedItem.kind === "body") {
          setMode("Surface", state.currentSystem, state.selectedItem.data);
        }
      }
    });

    // Canvas Mouse Controls
    canvas.addEventListener("mousemove", (e) => {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;

      if (state.dragging) {
        const dx = (e.clientX - state.dragStartX) / (CONFIG.scale * state.zoom);
        const dy = (e.clientY - state.dragStartY) / (CONFIG.scale * state.zoom);
        state.cameraX = state.dragCamX - dx;
        state.cameraY = state.dragCamY + dy;
      }
    });

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) { // Left Click
        state.dragging = true;
        state.dragStartX = e.clientX;
        state.dragStartY = e.clientY;
        state.dragCamX = state.cameraX;
        state.dragCamY = state.cameraY;

        if (state.hoverItem) {
          if (state.hoverItem.kind === "system") setMode("System", state.hoverItem.data);
          else if (state.hoverItem.kind === "body") setMode("Surface", state.currentSystem, state.hoverItem.data);
        }
      } else if (e.button === 2) { // Right Click (Inspect)
        if (state.hoverItem) displayInfo(state.hoverItem);
      }
    });

    window.addEventListener("mouseup", () => { state.dragging = false; });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      state.zoom = clamp(state.zoom * zoomFactor, 0.4, 4.0);
    }, { passive: false });

    // Keyboard WASD Pan
    window.addEventListener("keydown", (e) => {
      const speed = 10 / state.zoom;
      if (e.key === "w" || e.key === "W") state.cameraY += speed;
      if (e.key === "s" || e.key === "S") state.cameraY -= speed;
      if (e.key === "a" || e.key === "A") state.cameraX -= speed;
      if (e.key === "d" || e.key === "D") state.cameraX += speed;
    });

    // Coordinates Jump Input
    document.getElementById("goBtn").addEventListener("click", () => {
      const val = document.getElementById("jumpInput").value;
      const match = val.match(/-?\d+/g);
      if (match && match.length >= 2) {
        state.cameraX = parseInt(match[0]);
        state.cameraY = parseInt(match[1]);
      }
    });

    // --- INITIALIZATION ---
    window.addEventListener("resize", resizeCanvas);
    
    resizeCanvas();
    generateStarfield();
    state.catalog = generateUniverseCatalog();
    requestAnimationFrame(render);
  </script>
</body>
</html>
