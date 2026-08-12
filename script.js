(() => {
  "use strict";

  const TAU = Math.PI * 2;

  const CONFIG = {
    seed: 1,
    systemCount: 500,
    clusterScale: 18,
    systemScale: 22,
    starCount: 220,

    // Stellar population mix (of the 100 systems).
    neutronCount: 50,
    pulsarCount: 35,
    blackHoleCount: 40,
    // remaining 45 are ordinary stars (Red Dwarf / Yellow / Blue Giant / White / Orange)
  };

  const NAME_A = [
    "Ash","Bel","Cor","Dal","Esh","Fyr","Gal","Hex","Iru","Jex",
    "Kel","Lum","Mev","Nox","Orv","Pex","Qur","Rex","Syx","Tel",
    "Ulv","Vex","Wor","Xen","Yar","Zel","Brev","Cyn","Eph","Grel",
    "Keth","Lyv","Myr","Nev","Oph","Pral","Quil","Riv","Stel","Thar",
    "Vor","Wyv","Dov","Frel","Hux","Zeph","Trev","Drel","Crav","Ski",
    "Lix","Sorn","Phel","Yorv","Varn","Cres","Dax","Ulm","Ith","Jor"
  ];

  const NAME_B = [
    "al","an","el","en","ir","ix","on","or","ul","ur",
    "ax","ex","ov","um","av","em","yr","ob","ag","ec",
    "id","og","ud","ak","ek","ok","ar","er","ot","bidi",
    "is","as","es","os","un","il","yl","op","enx","olv"
  ];

  const NAME_C = [
    "ara","eth","ion","ova","ula","ani","eum","iro","oma","ura",
    "ane","eis","ite","ono","uri","ora","alis","urus","aris","eon",
    "oria","yra","elle","aris","uvis","enos","une","oriax","ivia"
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

  // Ordinary stellar classes (used for ~45 of the 100 systems).
  const STAR_TYPES = ["Red Dwarf", "Yellow Star", "Blue Giant", "White Star", "Orange Star"];

  // Terrain catalog. "Ice World" added as the thermal opposite of "Volcanic".
  // Safe Start / Terra / Forest / Tundra / Desert / Barren / Exotic / Gas Giant
  // description reference kept intact from the brief; Volcanic + new Ice World
  // are handled as temperature-extreme terrains layered on top of the base set.
  const TERRAINS = ["Safe Start", "Terra", "Forest", "Tundra", "Desert", "Barren", "Exotic", "Volcanic", "Ice World"];

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
    mode: "Cluster", // Cluster, System, Surface  (Galaxy tier removed - single cluster now)
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
    moveKeys: { up: false, down: false, left: false, right: false },
    stars: [],
    uiCreated: false,

    dragging: false,
    dragPointerId: null,
    dragStartX: 0,
    dragStartY: 0,
    dragStartCameraX: 0,
    dragStartCameraY: 0,
    dragMoved: false,
    pressedButton: -1,
    pressedItem: null,
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

  // ---------------------------------------------------------------------
  // STELLAR OBJECT CLASSIFICATION
  //
  // 100 systems total, distributed as:
  //   25 Neutron Stars   - very small, extremely dense/heavy
  //   15 Pulsars         - same family as neutron stars, small + dense,
  //                        with beamed radiation (visually distinguished)
  //   15 Black Holes     - 50% SMALLER radius than an average ordinary
  //                        star, but 150% HEAVIER than an average ordinary
  //                        star (per spec)
  //   45 Ordinary stars  - Red Dwarf / Yellow / Blue Giant / White / Orange
  //
  // "Average star" baseline used for the black hole size/mass rule:
  //   AVG_STAR_RADIUS_KM and AVG_STAR_MASS_SOL below.
  // ---------------------------------------------------------------------

  const AVG_STAR_RADIUS_KM = 700000; // ~1 solar radius, rounded for gameplay
  const AVG_STAR_MASS_SOL = 1.0;     // solar masses

  function buildStellarSlots(rng) {
    // Build an array of 100 "kind" tags (one of which is consumed by Sol,
    // an ordinary Yellow Star), then shuffle deterministically.
    const slots = [];
    for (let i = 0; i < CONFIG.neutronCount; i++) slots.push("Neutron Star");
    for (let i = 0; i < CONFIG.pulsarCount; i++) slots.push("Pulsar");
    for (let i = 0; i < CONFIG.blackHoleCount; i++) slots.push("Black Hole");
    const ordinaryCount = CONFIG.systemCount - slots.length;
    for (let i = 0; i < ordinaryCount; i++) slots.push("Star");

    // Fisher-Yates using the deterministic rng so layout is stable per seed.
    for (let i = slots.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      const tmp = slots[i];
      slots[i] = slots[j];
      slots[j] = tmp;
    }
    return slots;
  }

  function buildStarProfile(kind, sysRng) {
    // Returns { starType, starColor, starTemperature, starRadiusKm,
    //           starMassSol, isCompact, isBlackHole, isNeutronFamily }
    if (kind === "Star") {
      const starType = sysRng.pick(STAR_TYPES);
      const starTemperature = Math.floor(sysRng.float(2500, 13000));
      const starColor = hsvToCss(sysRng.next(), sysRng.float(0.25, 0.65), 1);
      // Ordinary stars vary around the "average star" baseline.
      const starRadiusKm = AVG_STAR_RADIUS_KM * sysRng.float(0.4, 2.2);
      const starMassSol = AVG_STAR_MASS_SOL * sysRng.float(0.3, 3.0);
      return {
        starType, starColor, starTemperature, starRadiusKm, starMassSol,
        isCompact: false, isBlackHole: false, isNeutronFamily: false,
      };
    }

    if (kind === "Neutron Star" || kind === "Pulsar") {
      // Very small (city-sized, ~10-14km typical), but extremely heavy
      // (roughly 1.1-2.3 solar masses packed into that radius).
      const starRadiusKm = sysRng.float(10, 14);
      const starMassSol = sysRng.float(1.1, 2.3);
      const starTemperature = Math.floor(sysRng.float(600000, 1800000)); // surface temps are enormous
      const baseColor = kind === "Pulsar"
        ? hsvToCss(0.56, sysRng.float(0.55, 0.85), 1)   // beamed cyan-blue
        : hsvToCss(0.62, sysRng.float(0.15, 0.35), 1);  // pale blue-white
      return {
        starType: kind,
        starColor: baseColor,
        starTemperature,
        starRadiusKm,
        starMassSol,
        isCompact: true,
        isBlackHole: false,
        isNeutronFamily: true,
        isPulsar: kind === "Pulsar",
      };
    }

    // Black Hole: 50% smaller (radius) than an average star, 150% heavier
    // (mass) than an average star, per spec. Interpreted as the *event
    // horizon* radius standing in for its visual/gameplay size.
    const starRadiusKm = AVG_STAR_RADIUS_KM * 0.5 * sysRng.float(0.85, 1.15);
    const starMassSol = AVG_STAR_MASS_SOL * 2.5 * sysRng.float(0.85, 1.15); // "150% heavier" = 2.5x baseline
    return {
      starType: "Black Hole",
      starColor: "rgb(10, 8, 16)",
      starTemperature: 0,
      starRadiusKm,
      starMassSol,
      isCompact: true,
      isBlackHole: true,
      isNeutronFamily: false,
    };
  }

  function terrainTemperatureBias(terrain) {
    // How strongly a terrain wants to appear at extreme distances.
    // Positive = prefers far/cold, negative = prefers close/hot.
    if (terrain === "Ice World") return 1;
    if (terrain === "Volcanic") return -1;
    return 0;
  }

  function pickTerrainForBody(rng, orbitRadius, starProfile) {
    // starProfile: from buildStarProfile - used so neutron/pulsar systems
    // skew heavily toward Ice World (their stars run cold in visible/IR
    // terms despite extreme physics), and black holes can never roll
    // Volcanic (no stellar heat source to sustain it).

    const isDeadStar = starProfile.isNeutronFamily; // neutron star or pulsar
    const isBlackHole = starProfile.isBlackHole;

    // Base weight table per terrain (relative weights, not percentages).
    const weights = {
      "Safe Start": 14,
      "Terra": 10,
      "Forest": 10,
      "Tundra": 9,
      "Desert": 10,
      "Barren": 12,
      "Exotic": 6,
      "Volcanic": 8,
      "Ice World": 8,
    };

    // Terrain now biases against the SAME temperature estimate used to set
    // the body's actual Temperature stat (see createPlanetBody), instead of
    // raw orbital position. Previously Ice World/Volcanic leaned on orbit
    // position alone while Terra/Forest/Safe Start had no positional bias
    // at all, so a "Forest" world could just as easily land in scorching
    // or frozen temperature bands as a temperate one - making its
    // breathable/life rolls essentially never hit. Now temperate-leaning
    // terrains (Terra, Forest, Safe Start) are weighted toward orbits that
    // land near Earth-like temperature, the same way Ice World/Volcanic
    // are weighted toward the cold/hot extremes.
    let effectiveStarHeat = starProfile.starTemperature;
    if (isDeadStar) effectiveStarHeat = 40;
    if (isBlackHole) effectiveStarHeat = 3;

    const REFERENCE_TEMP = 5778;
    const REFERENCE_ORBIT = 6;

    let estTemp;
    if (starProfile.isCompact) {
      estTemp = effectiveStarHeat - orbitRadius * 2;
    } else {
      const luminosityRatio = Math.pow(effectiveStarHeat / REFERENCE_TEMP, 4);
      const distanceRatio = REFERENCE_ORBIT / Math.max(orbitRadius, 1);
      estTemp = 288 * Math.sqrt(luminosityRatio * distanceRatio * distanceRatio);
    }

    // How close this orbit's estimated temperature sits to the temperate
    // band (260-330K, center ~295K). 1 = dead-on temperate, 0 = far off.
    const temperateCloseness = clamp(1 - Math.abs(estTemp - 295) / 260, 0, 1);
    // How far into "hot" or "cold" extremes this orbit sits, relative to
    // the temperate band, used to drive Volcanic / Ice World bias.
    const hotness = clamp((estTemp - 330) / 900, 0, 1);
    const coldness = clamp((260 - estTemp) / 260, 0, 1);

    weights["Volcanic"] *= 1 + hotness * 9;
    weights["Ice World"] *= 1 + coldness * 9;
    weights["Terra"] *= 1 + temperateCloseness * 7;
    weights["Forest"] *= 1 + temperateCloseness * 7;
    weights["Safe Start"] *= 1 + temperateCloseness * 5;

    // HARD SAFETY FLOOR for Safe Start.
    //
    // Previously Safe Start only got a soft weighting bonus toward
    // temperate orbits, same mechanism as Terra/Forest - which meant nothing
    // actually stopped it from rolling around a black hole or way out past
    // the temperate band, producing "safe" spawn worlds at 2K or 800+K.
    // A spawn world being dangerously cold/hot defeats the entire point of
    // the terrain's name, so this is now a hard exclusion rather than a
    // weight: Safe Start can ONLY be selected when the estimated temp is
    // realistically livable (240-350K, a bit more forgiving than the strict
    // 260-330K breathable band so it isn't vanishingly rare), and NEVER
    // around a compact/dead star or black hole, since no orbit around those
    // is safe regardless of estimated temperature.
    const inSafeBand = estTemp >= 240 && estTemp <= 350;
    if (!inSafeBand || starProfile.isCompact || isBlackHole) {
      weights["Safe Start"] = 0;
    }

    // Around dead/compact stars, almost everything runs cold: neutron
    // stars and pulsars emit intense radiation but negligible broad-
    // spectrum warmth for orbiting worlds at gameplay distances, so ice
    // dominates and volcanic is nearly extinguished. "Rarely non ice
    // world" per spec.
    if (isDeadStar) {
      for (const t of Object.keys(weights)) {
        if (t === "Ice World") weights[t] *= 9;
        else if (t === "Volcanic") weights[t] *= 0.05;
        else weights[t] *= 0.35;
      }
    }

    // Black holes: no volcanic worlds at all (zero stellar heat source),
    // and skew colder/exotic in general since there's no real "sunlight."
    if (isBlackHole) {
      weights["Volcanic"] = 0;
      weights["Ice World"] *= 3;
      weights["Exotic"] *= 2;
    }

    const entries = Object.entries(weights).filter(([, w]) => w > 0);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = rng.float(0, total);
    for (const [terrain, w] of entries) {
      if (roll < w) return terrain;
      roll -= w;
    }
    return entries[entries.length - 1][0];
  }

  function planetClassToColor(rng, cls, terrain) {
    if (cls === "Gas Giant") {
      return hsvToCss(rng.float(0.07, 0.13), rng.float(0.35, 0.75), rng.float(0.75, 1));
    }
    if (cls === "Ice Giant") {
      return hsvToCss(rng.float(0.50, 0.58), rng.float(0.20, 0.55), rng.float(0.80, 1));
    }

    if (terrain === "Terra") {
      return hsvToCss(0.58, rng.float(0.45, 0.80), rng.float(0.70, 1));
    }
    if (terrain === "Forest") {
      return hsvToCss(rng.float(0.28, 0.38), rng.float(0.45, 0.75), rng.float(0.55, 0.90));
    }
    if (terrain === "Tundra") {
      return hsvToCss(rng.float(0.50, 0.56), rng.float(0.10, 0.30), rng.float(0.80, 0.98));
    }
    if (terrain === "Desert") {
      return hsvToCss(rng.float(0.08, 0.12), rng.float(0.35, 0.70), rng.float(0.70, 1));
    }
    if (terrain === "Barren") {
      return hsvToCss(rng.float(0.05, 0.12), rng.float(0.12, 0.35), rng.float(0.35, 0.75));
    }
    if (terrain === "Exotic") {
      return hsvToCss(rng.next(), rng.float(0.45, 0.85), rng.float(0.65, 1));
    }
    if (terrain === "Volcanic") {
      return hsvToCss(rng.float(0.00, 0.04), rng.float(0.65, 0.95), rng.float(0.65, 1));
    }
    if (terrain === "Ice World") {
      return hsvToCss(rng.float(0.53, 0.58), rng.float(0.15, 0.40), rng.float(0.88, 1));
    }
    if (terrain === "Safe Start") {
      return hsvToCss(rng.float(0.09, 0.14), rng.float(0.20, 0.40), rng.float(0.55, 0.80));
    }

    return hsvToCss(rng.next(), rng.float(0.15, 0.65), rng.float(0.55, 1));
  }

  function createPlanetBody(systemSeed, bodyId, orbitRadius, orbitAlpha, starProfile, rng) {
    const classRoll = rng.next();
    let cls;
    if (classRoll < 0.68) cls = "Terrestrial";
    else if (classRoll < 0.84) cls = "Gas Giant";
    else cls = "Ice Giant";

    let terrain = cls;
    if (cls === "Terrestrial") {
      terrain = pickTerrainForBody(rng, orbitRadius, starProfile);
    }

    let size;
    if (cls === "Terrestrial") size = rng.int(25, 60);
    else if (cls === "Gas Giant") size = rng.int(400, 1000);
    else size = rng.int(150, 450);

    let gravity;
    if (cls === "Gas Giant") gravity = rng.float(1.8, 4.5);
    else if (cls === "Ice Giant") gravity = rng.float(0.8, 2.8);
    else if (terrain === "Safe Start") gravity = rng.float(0.8, 1.3); // walkable, near-Earth gravity - matches the "safe to spawn" guarantee
    else gravity = rng.float(0.1, 2.0);

    const roughness = rng.int(0, 5);

    // Temperature model — inverse-square style falloff, normalized so that
    // an ordinary Sun-like star (~5778K) produces Earth-like temperatures
    // (~288K) around orbit radius 6 (Earth's own OrbitRadius in this sim's
    // units). The previous linear model (temp - orbit*75) barely dented a
    // 5-figure surface temperature over the orbit ranges actually used,
    // so almost nothing ever fell inside the 260-330K breathable band -
    // meaning Terra/Forest/Safe Start worlds were rolling breathable=false
    // essentially 100% of the time. This model scales luminosity with the
    // stellar temperature (T^4, like real blackbody flux) and then applies
    // inverse-square distance falloff, which reliably produces some worlds
    // in the temperate band regardless of star brightness or orbit spread.
    let effectiveStarHeat = starProfile.starTemperature;
    if (starProfile.isNeutronFamily) effectiveStarHeat = 40; // negligible warmth, near absolute-cold backdrop
    if (starProfile.isBlackHole) effectiveStarHeat = 3; // no fusion, no sunlight

    const REFERENCE_TEMP = 5778;   // Sun-like reference surface temp (K)
    const REFERENCE_ORBIT = 6;     // orbit radius that yields ~288K around a reference star

    let baseTemp;
    if (starProfile.isCompact) {
      baseTemp = effectiveStarHeat + rng.float(-15, 15) - orbitRadius * 2;
    } else {
      const luminosityRatio = Math.pow(effectiveStarHeat / REFERENCE_TEMP, 4);
      const distanceRatio = REFERENCE_ORBIT / Math.max(orbitRadius, 1);
      baseTemp = 288 * Math.sqrt(luminosityRatio * distanceRatio * distanceRatio) + rng.float(-35, 35);
    }

    const temperature = Math.max(2, Math.floor(baseTemp));

    let breathable = false;
    let hasLife = false;
    let lifeType = "None";

    if (cls === "Terrestrial" && !starProfile.isCompact && !starProfile.isBlackHole) {
      if (terrain === "Safe Start") {
        // "Safe Start" worlds are, by definition, where new players spawn.
        // A spawn world that isn't breathable and doesn't have plant life
        // defeats the entire point of the terrain's name - it can't be a
        // coin flip the way ordinary Terra/Forest habitability is. The
        // hard temperature/orbital-safety floor in pickTerrainForBody
        // already guarantees this terrain only appears in a genuinely
        // livable zone (never around a compact star or black hole, only
        // within a livable temperature band), so once a world IS Safe
        // Start, breathability and basic plant life are guaranteed rather
        // than re-rolled here.
        breathable = true;
        hasLife = true;
        lifeType = "Plant";
      } else {
        breathable =
          (terrain === "Terra" || terrain === "Forest") &&
          temperature >= 260 && temperature <= 330 &&
          gravity >= 0.7 && gravity <= 1.4 &&
          rng.next() > 0.30;

        if (breathable && rng.next() < 0.22) {
          hasLife = true;
          lifeType = rng.next() < 0.72 ? "Plant" : "Fungus";
        } else if (rng.next() < 0.05 && (terrain === "Tundra" || terrain === "Volcanic" || terrain === "Ice World")) {
          hasLife = true;
          lifeType = "Fungus";
        }
      }
    }

    const color = planetClassToColor(rng, cls, terrain);
    const hasRings =
      cls !== "Terrestrial"
        ? rng.next() < 0.35
        : (terrain === "Tundra" || terrain === "Ice World") && rng.next() < 0.15;

    let tidallyLocked =
      orbitRadius <= 6 ? rng.next() < 0.80 :
      orbitRadius <= 10 ? rng.next() < 0.35 :
      rng.next() < 0.10;

    if (cls === "Terrestrial" && breathable && (terrain === "Terra" || terrain === "Safe Start")) {
      // A tidally-locked world has one face in permanent day and one in
      // permanent night - inconsistent with "Earth-like" (Terra) or
      // "safe to spawn on" (Safe Start) once breathability is guaranteed.
      // This previously only excluded Terra, not Safe Start, even after
      // Safe Start became a guaranteed-breathable terrain above.
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

  function makeFixedBody(data) {
    return {
      BodyID: data.BodyID,
      Name: data.Name,
      SystemX: data.SystemX,
      SystemY: data.SystemY,
      OrbitRadius: data.OrbitRadius,
      Class: data.Class,
      Type: data.Type,
      Size: data.Size,
      Color: data.Color,
      Gravity: data.Gravity,
      Roughness: data.Roughness,
      Temperature: data.Temperature,
      Breathable: data.Breathable,
      HasLife: data.HasLife || false,
      LifeType: data.LifeType || "None",
      HasRings: data.HasRings || false,
      TidallyLocked: data.TidallyLocked || false,
    };
  }

  function makeSolSystem() {
    const bodies = [
      makeFixedBody({
        BodyID: 1, Name: "Mercury", SystemX: 2, SystemY: 0, OrbitRadius: 2,
        Class: "Terrestrial", Type: "Barren", Size: 48,
        Color: "rgb(169, 159, 149)", Gravity: 0.38, Roughness: 4, Temperature: 440,
        Breathable: false, HasRings: false, TidallyLocked: true
      }),
      makeFixedBody({
        BodyID: 2, Name: "Venus", SystemX: -4, SystemY: 1, OrbitRadius: 4,
        Class: "Terrestrial", Type: "Volcanic", Size: 115,
        Color: "rgb(220, 160, 90)", Gravity: 0.91, Roughness: 5, Temperature: 737,
        Breathable: false, HasRings: false, TidallyLocked: true
      }),
      makeFixedBody({
        BodyID: 3, Name: "Earth", SystemX: 6, SystemY: -1, OrbitRadius: 6,
        Class: "Terrestrial", Type: "Terra", Size: 116,
        Color: "rgb(60, 120, 200)", Gravity: 1.00, Roughness: 2, Temperature: 288,
        Breathable: true, HasLife: true, LifeType: "Plant", HasRings: false, TidallyLocked: false
      }),
      makeFixedBody({
        BodyID: 4, Name: "Mars", SystemX: -8, SystemY: -2, OrbitRadius: 8,
        Class: "Terrestrial", Type: "Desert", Size: 62,
        Color: "rgb(200, 80, 40)", Gravity: 0.38, Roughness: 3, Temperature: 210,
        Breathable: false, HasRings: false, TidallyLocked: false
      }),
      makeFixedBody({
        BodyID: 5, Name: "Jupiter", SystemX: 14, SystemY: 3, OrbitRadius: 14,
        Class: "Gas Giant", Type: "Gas Giant", Size: 170,
        Color: "rgb(210, 165, 115)", Gravity: 2.53, Roughness: 1, Temperature: 165,
        Breathable: false, HasRings: false, TidallyLocked: false
      }),
      makeFixedBody({
        BodyID: 6, Name: "Saturn", SystemX: -19, SystemY: -4, OrbitRadius: 19,
        Class: "Gas Giant", Type: "Gas Giant", Size: 155,
        Color: "rgb(230, 200, 160)", Gravity: 1.07, Roughness: 1, Temperature: 134,
        Breathable: false, HasRings: true, TidallyLocked: false
      }),
      makeFixedBody({
        BodyID: 7, Name: "Uranus", SystemX: 25, SystemY: 5, OrbitRadius: 25,
        Class: "Ice Giant", Type: "Ice World", Size: 128,
        Color: "rgb(175, 220, 230)", Gravity: 0.89, Roughness: 2, Temperature: 76,
        Breathable: false, HasRings: true, TidallyLocked: false
      }),
      makeFixedBody({
        BodyID: 8, Name: "Neptune", SystemX: -31, SystemY: -6, OrbitRadius: 31,
        Class: "Ice Giant", Type: "Ice World", Size: 125,
        Color: "rgb(60, 80, 200)", Gravity: 1.12, Roughness: 2, Temperature: 72,
        Breathable: false, HasRings: false, TidallyLocked: false
      }),
    ];

    return {
      SystemID: stableHash("real", "Sol"),
      Name: "Sol",
      SpaceX: 0,
      SpaceY: 0,
      StarType: "Yellow Star",
      StarColor: "rgb(255, 224, 100)",
      StarTemperature: 5778,
      StarRadiusKm: AVG_STAR_RADIUS_KM,
      StarMassSol: 1.0,
      IsCompact: false,
      IsBlackHole: false,
      IsPulsar: false,
      PlanetCount: bodies.length,
      Bodies: bodies,
    };
  }

  function buildSystem(systemSeed, sysX, sysY, kind) {
    const sysRng = makeRng(systemSeed);
    const starProfile = buildStarProfile(kind, sysRng);

    // Compact objects (neutron stars, pulsars, black holes) support far
    // fewer bodies realistically - tight, sparse systems.
    const planetCount = starProfile.isCompact
      ? sysRng.int(0, 4)
      : sysRng.int(1, 12);

    const bodies = [];
    const usedBodies = {};
    const usedBodyNames = {};

    for (let bodyId = 1; bodyId <= planetCount; bodyId++) {
      const bodySeed = stableHash("body", systemSeed, bodyId);
      const bodyRng = makeRng(bodySeed);
      const orbitRadius = bodyId * 4 + bodyRng.float(2, 6);
      const orbitAlpha = planetCount > 1 ? (bodyId - 1) / (planetCount - 1) : 0.5;

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

      const body = createPlanetBody(systemSeed, bodyId, orbitRadius, orbitAlpha, starProfile, bodyRng);
      body.SystemX = bx;
      body.SystemY = by;
      body.Name = generateBodyName(stableHash("bodyname", systemSeed, bodyId, body.Class, body.Type, orbitRadius), usedBodyNames);

      bodies.push(body);
    }

    // ---------------------------------------------------------------
    // WORMHOLE
    //
    // Realism constraint: wormholes are only found within a black hole's
    // gravitational vicinity - never around ordinary stars, neutron
    // stars, or pulsars. A black hole system has a flat 10% chance of
    // hosting exactly one. A wormhole is NOT an orbiting body - it has no
    // orbit, no OrbitRadius, and is never added to `Bodies`, since
    // nothing orbits it and it doesn't orbit the black hole either (it's
    // treated as a fixed local anomaly tied to the system itself). It is
    // stored as its own `Wormhole` field on the system.
    // ---------------------------------------------------------------
    let wormhole = null;
    if (starProfile.isBlackHole) {
      const wormholeRng = makeRng(stableHash("wormhole", systemSeed));
      if (wormholeRng.next() < 0.20) {
        // Fixed position near the black hole, offset just enough to be
        // visually distinct from the black hole marker itself. Not an
        // orbit - this position never changes/animates.
        const angle = wormholeRng.float(0, TAU);
        const dist = wormholeRng.float(3, 6);
        wormhole = {
          Name: `${generateProcName(stableHash("wormholename", systemSeed))} Rift`,
          SystemX: Math.floor(Math.cos(angle) * dist),
          SystemY: Math.floor(Math.sin(angle) * dist),
          StabilityPercent: Math.floor(wormholeRng.float(35, 98)),
        };
      }
    }

    return {
      SystemID: systemSeed,
      Name: generateProcName(systemSeed),
      SpaceX: sysX,
      SpaceY: sysY,
      StarType: starProfile.starType,
      StarColor: starProfile.starColor,
      StarTemperature: starProfile.starTemperature,
      StarRadiusKm: starProfile.starRadiusKm,
      StarMassSol: starProfile.starMassSol,
      IsCompact: starProfile.isCompact,
      IsBlackHole: starProfile.isBlackHole,
      IsPulsar: !!starProfile.isPulsar,
      PlanetCount: planetCount,
      Bodies: bodies,
      Wormhole: wormhole,
    };
  }

  function buildCatalog() {
    if (state.catalog && state.catalog.seed === state.seed) {
      return state.catalog;
    }

    const rng = makeRng(state.seed);
    const usedSystems = {};
    const systems = [];

    // Sol occupies one of the 100 system slots (an ordinary Yellow Star),
    // so the population mix below is built for the remaining 99 slots.
    const slots = buildStellarSlots(rng);

    // Reserve the origin for Sol.
    usedSystems[key2(0, 0)] = true;
    systems.push(makeSolSystem());

    for (let i = 0; i < slots.length - 1; i++) {
      const kind = slots[i];
      const pos = chooseLocalPosition(rng, usedSystems, 18, 148);
      usedSystems[pos.k] = true;

      const systemSeed = stableHash("system", state.seed, pos.x, pos.y, i);
      const system = buildSystem(systemSeed, pos.x, pos.y, kind);
      systems.push(system);
    }

    const cluster = {
      ClusterID: stableHash("cluster", state.seed),
      Name: "Local Cluster",
      SystemCount: systems.length,
      Systems: systems,
    };

    state.catalog = { seed: state.seed, cluster };
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

  function fmtNumber(n, digits = 1) {
    if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return n.toFixed(digits);
  }

  // Display-only Kelvin -> Celsius conversion. All internal temperature
  // math/storage (Temperature, StarTemperature) stays in Kelvin, since the
  // luminosity/distance formulas and habitable-band checks are written in
  // Kelvin - this only affects what's shown to the user. "C*" is the
  // requested unit label in place of "°C".
  function fmtTempC(kelvin) {
    const c = Math.round(kelvin - 273.15);
    return `${c} C*`;
  }

  function getCurrentPathText() {
    const s = state.currentSystem;
    const b = state.currentBody;

    if (state.mode === "Cluster") return s ? `SYS ${s.SpaceX}, ${s.SpaceY}` : "SYS —";
    if (state.mode === "System") return s && b ? `SYS ${s.SpaceX}, ${s.SpaceY}  ·  BODY ${b.SystemX}, ${b.SystemY}` : "SYS / BODY —";
    return b ? `SURFACE · ${b.Name}` : "SURFACE";
  }

  function classifyLabel(kind, obj) {
    if (kind === "system") {
      if (obj.IsBlackHole) return "BLACK HOLE";
      if (obj.IsPulsar) return "PULSAR";
      if (obj.IsCompact) return "NEUTRON STAR";
      return "STAR";
    }
    if (kind === "wormhole") return "WORMHOLE";
    return "PLANET";
  }

  function getMarkerInfo(item) {
    if (!item) return "Right-click a system or body to inspect it.";

    if (item.kind === "system") {
      const s = item.object;
      const lines = [
        `${s.Name}`,
        `CLASS       ${classifyLabel("system", s)}`,
        `TYPE        ${s.StarType}`,
      ];

      if (s.IsBlackHole) {
        lines.push(`RADIUS      ${fmtNumber(s.StarRadiusKm)} km (event horizon)`);
        lines.push(`MASS        ${s.StarMassSol.toFixed(2)} M☉`);
      } else if (s.IsCompact) {
        lines.push(`RADIUS      ${fmtNumber(s.StarRadiusKm)} km`);
        lines.push(`MASS        ${s.StarMassSol.toFixed(2)} M☉`);
        lines.push(`SURF TEMP   ${fmtTempC(s.StarTemperature)}`);
      } else {
        lines.push(`SURF TEMP   ${fmtTempC(s.StarTemperature)}`);
        lines.push(`MASS        ${s.StarMassSol.toFixed(2)} M☉`);
      }

      lines.push(`PLANETS     ${s.PlanetCount}`);
      if (s.IsBlackHole) {
        lines.push(`WORMHOLE    ${s.Wormhole ? "Detected" : "None detected"}`);
      }
      lines.push(`COORDS      [${s.SpaceX}, ${s.SpaceY}]`);
      return lines.join("\n");
    }

    if (item.kind === "wormhole") {
      const w = item.object;
      const lines = [
        `${w.Name}`,
        `CLASS       WORMHOLE`,
        `STABILITY   ${w.StabilityPercent}%`,
        `ORBIT       None — fixed anomaly`,
        `HOST        Black hole gravitational well`,
        `COORDS      [${w.SystemX}, ${w.SystemY}]`,
      ];
      return lines.join("\n");
    }

    if (item.kind === "body") {
      const b = item.object;
      const lines = [
        `${b.Name}`,
        `CLASS       ${b.Class}`,
        `TERRAIN     ${b.Type}`,
        `SIZE        ${b.Size}`,
        `GRAVITY     ${b.Gravity.toFixed(2)} g`,
        `ORBIT       ${Math.round(b.OrbitRadius)} PU`,
        `TEMP        ${fmtTempC(b.Temperature)}`,
        `BREATHABLE  ${b.Breathable ? "Yes" : "No"}`,
        `TIDAL LOCK  ${b.TidallyLocked ? "Yes" : "No"}`,
        `RINGS       ${b.HasRings ? "Yes" : "No"}`,
        `LIFE        ${b.HasLife ? b.LifeType : "None"}`,
      ];
      return lines.join("\n");
    }

    return "Right-click a system or body to inspect it.";
  }

  function setSelection(item) {
    state.selectedItem = item;
    infoEl.textContent = getMarkerInfo(item);
  }

  function setViewCluster() {
    state.mode = "Cluster";
    state.currentSystem = null;
    state.currentBody = null;
    state.zoom = 1;
    state.cameraX = 0;
    state.cameraY = 0;
  }

  function setViewSystem(system) {
    if (!system) return;
    state.mode = "System";
    state.currentSystem = system;
    state.currentBody = null;
    state.zoom = 1;
    state.cameraX = 0;
    state.cameraY = 0;
    setSelection({ kind: "system", object: system });
  }

  function setViewSurface(body, system) {
    if (!body) return;
    state.mode = "Surface";
    if (system) state.currentSystem = system;
    state.currentBody = body;
    state.zoom = 1;
    state.cameraX = 0;
    state.cameraY = 0;
    setSelection({ kind: "body", object: body });
  }

  function openItem(item) {
    if (!item) return;
    if (item.kind === "system") setViewSystem(item.object);
    else if (item.kind === "body") setViewSurface(item.object, item.system || state.currentSystem);
  }

  function getVisibleMarkers() {
    const markers = [];

    if (state.mode === "Cluster") {
      const cluster = state.catalog.cluster;
      if (!cluster) return markers;
      for (const system of cluster.Systems) {
        markers.push({
          kind: "system",
          object: system,
          wx: system.SpaceX,
          wy: system.SpaceY,
          r: system.IsBlackHole ? 5 : system.IsCompact ? 4 : 6,
          color: system.StarColor,
          label: system.Name,
          isBlackHole: system.IsBlackHole,
          isCompact: system.IsCompact,
          isPulsar: system.IsPulsar,
        });
      }
      return markers;
    }

    if (state.mode === "System") {
      const system = state.currentSystem;
      if (!system) return markers;

      markers.push({
        kind: "system",
        object: system,
        wx: 0,
        wy: 0,
        r: system.IsBlackHole ? 10 : system.IsCompact ? 8 : 14,
        color: system.StarColor,
        label: system.Name,
        isStar: true,
        isBlackHole: system.IsBlackHole,
        isCompact: system.IsCompact,
        isPulsar: system.IsPulsar,
      });

      for (const body of system.Bodies) {
        markers.push({
          kind: "body",
          object: body,
          system,
          wx: body.SystemX,
          wy: body.SystemY,
          r: clamp(body.Size / 24, 6, 26),
          color: body.Color,
          label: body.Name,
        });
      }

      // Wormhole marker: fixed position, no orbit ring, not clickable
      // into a sub-view (nothing "inside" a wormhole to open, unlike
      // systems/bodies) - selectable for inspection only.
      if (system.Wormhole) {
        markers.push({
          kind: "wormhole",
          object: system.Wormhole,
          system,
          wx: system.Wormhole.SystemX,
          wy: system.Wormhole.SystemY,
          r: 9,
          color: PALETTE.exotic,
          label: system.Wormhole.Name,
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

  // ---------------------------------------------------------------------
  // RENDERING — observatory / spectrograph inspired palette
  // ---------------------------------------------------------------------

  const PALETTE = {
    voidTop: "#0c0e16",
    voidMid: "#05060a",
    voidEdge: "#020203",
    grid: "rgba(111, 211, 199, 0.05)",
    hairline: "rgba(242, 239, 233, 0.12)",
    starWhite: "#f2efe9",
    amber: "#e8a752",
    cyan: "#6fd3c7",
    exotic: "#b85c7a",
  };

  function drawBackground(width, height) {
    const g = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.8);
    g.addColorStop(0, PALETTE.voidTop);
    g.addColorStop(0.6, PALETTE.voidMid);
    g.addColorStop(1, PALETTE.voidEdge);
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

  function drawTextWithStroke(text, x, y, size = 12, align = "center", fill = PALETTE.starWhite, mono = false) {
    ctx.font = `${mono ? "500 " : ""}${size}px ${mono ? "'IBM Plex Mono', 'Courier New', monospace" : "Arial, Helvetica, sans-serif"}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(2,3,5,0.85)";
    ctx.fillStyle = fill;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  function drawHalo(x, y, r, color = "rgba(232,167,82,0.9)") {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawBlackHoleGlyph(x, y, r) {
    // Accretion ring + void core, no fill glow (it's a light-trap, not a light source)
    const ring = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 1.8);
    ring.addColorStop(0, "rgba(184,92,122,0.85)");
    ring.addColorStop(0.5, "rgba(184,92,122,0.25)");
    ring.addColorStop(1, "rgba(184,92,122,0)");
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.8, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = "#020103";
    ctx.fill();
    ctx.strokeStyle = "rgba(184,92,122,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawCompactStarGlyph(x, y, r, color, isPulsar) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    glow.addColorStop(0, "rgba(255,255,255,0.9)");
    glow.addColorStop(0.3, color);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, Math.max(r, 2), 0, TAU);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    if (isPulsar) {
      ctx.save();
      ctx.strokeStyle = "rgba(111,211,199,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 6);
      ctx.lineTo(x, y + r * 6);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawWormholeGlyph(x, y, r) {
    // Distinct from planet/star glyphs: a rotating-look double ring with
    // a dark violet core, since a wormhole is an anomaly, not a body with
    // mass/orbit. No orbit ring is ever drawn for it (see drawSystemView,
    // which only iterates system.Bodies for orbit rings).
    const outer = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    outer.addColorStop(0, "rgba(184,92,122,0.05)");
    outer.addColorStop(0.7, "rgba(184,92,122,0.35)");
    outer.addColorStop(1, "rgba(184,92,122,0)");
    ctx.fillStyle = outer;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.4, Math.PI / 4, 0, TAU);
    ctx.strokeStyle = "rgba(232,167,82,0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.7, r * 0.28, -Math.PI / 4, 0, TAU);
    ctx.strokeStyle = "rgba(111,211,199,0.85)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, TAU);
    ctx.fillStyle = "#0a0510";
    ctx.fill();
  }

  function drawClusterView(markers, hovered) {
    for (const m of markers) {
      if (m.isBlackHole) {
        drawBlackHoleGlyph(m.sx, m.sy, m.r);
      } else if (m.isCompact) {
        drawCompactStarGlyph(m.sx, m.sy, m.r, m.color, m.isPulsar);
      } else {
        ctx.beginPath();
        ctx.arc(m.sx, m.sy, m.r, 0, TAU);
        ctx.fillStyle = m.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(2,3,5,0.65)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (hovered === m || (state.selectedItem && state.selectedItem.kind === "system" && state.selectedItem.object === m.object)) {
        const haloColor = m.isBlackHole ? "rgba(184,92,122,0.9)" : m.isCompact ? "rgba(111,211,199,0.9)" : "rgba(232,167,82,0.9)";
        drawHalo(m.sx, m.sy, m.r + 8, haloColor);
        drawTextWithStroke(m.label, m.sx, m.sy + m.r + 14, 12, "center", PALETTE.starWhite, true);
      }
    }
  }

  function drawSystemView(markers, hovered) {
    const system = state.currentSystem;
    if (!system) return;

    const star = markers.find(m => m.isStar);
    if (star) {
      if (star.isBlackHole) {
        drawBlackHoleGlyph(star.sx, star.sy, star.r);
      } else if (star.isCompact) {
        drawCompactStarGlyph(star.sx, star.sy, star.r, star.color, star.isPulsar);
      } else {
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
      }

      drawTextWithStroke(system.Name, star.sx, star.sy - (star.isBlackHole ? 34 : 28), 13, "center", PALETTE.starWhite, true);

      if (hovered === star || (state.selectedItem && state.selectedItem.kind === "system" && state.selectedItem.object === star.object)) {
        const haloColor = star.isBlackHole ? "rgba(184,92,122,0.9)" : star.isCompact ? "rgba(111,211,199,0.9)" : "rgba(255,255,255,0.95)";
        drawHalo(star.sx, star.sy, 20, haloColor);
      }
    }

    for (const body of system.Bodies) {
      const orbitPx = body.OrbitRadius * getModeScale();
      ctx.beginPath();
      ctx.arc(star.sx, star.sy, orbitPx, 0, TAU);
      ctx.strokeStyle = PALETTE.grid;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (const m of markers) {
      if (m.isStar) continue;

      if (m.kind === "wormhole") {
        drawWormholeGlyph(m.sx, m.sy, m.r);

        if (hovered === m || (state.selectedItem && state.selectedItem.kind === "wormhole" && state.selectedItem.object === m.object)) {
          drawHalo(m.sx, m.sy, m.r + 8, "rgba(184,92,122,0.9)");
        }
        drawTextWithStroke(m.label, m.sx, m.sy + m.r + 14, 12, "center", PALETTE.exotic, true);
        continue;
      }

      ctx.beginPath();
      ctx.arc(m.sx, m.sy, m.r, 0, TAU);
      ctx.fillStyle = m.color;
      ctx.fill();

      ctx.strokeStyle = "rgba(2,3,5,0.65)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (hovered === m || (state.selectedItem && state.selectedItem.kind === "body" && state.selectedItem.object === m.object)) {
        drawHalo(m.sx, m.sy, m.r + 7, "rgba(232,167,82,0.9)");
        drawTextWithStroke(m.label, m.sx, m.sy + m.r + 12, 12, "center", PALETTE.starWhite, true);
      }
    }
  }

  const TERRAIN_GRADIENT_HINT = {
    "Ice World": (r) => `rgba(255,255,255,0.35)`,
    "Volcanic": (r) => `rgba(255,140,60,0.30)`,
  };

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
      ctx.strokeStyle = "rgba(242,239,233,0.18)";
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

    // Terrain-specific atmospheric hint (frost haze for Ice World, heat
    // shimmer tint for Volcanic) layered subtly over the sphere.
    const hint = TERRAIN_GRADIENT_HINT[body.Type];
    if (hint) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.clip();
      ctx.fillStyle = hint(r);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

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

    drawTextWithStroke(body.Name, cx, cy - r - 26, 19, "center", PALETTE.starWhite, true);
    drawTextWithStroke(body.Type.toUpperCase() + " WORLD".replace("WORLD WORLD", "WORLD"), cx, cy - r - 4, 12, "center", "rgba(111,211,199,0.9)", true);
    drawTextWithStroke("SURFACE SCAN", cx, height - 28, 12, "center", "rgba(242,239,233,0.6)", true);
  }

  function updateUiTexts() {
    coords2El.textContent = getCurrentPathText();

    if (state.hoverItem) {
      if (state.hoverItem.kind === "system") coords1El.textContent = `[${state.hoverItem.object.SpaceX}, ${state.hoverItem.object.SpaceY}]`;
      else if (state.hoverItem.kind === "body") coords1El.textContent = `[${state.hoverItem.object.SystemX}, ${state.hoverItem.object.SystemY}]`;
      else coords1El.textContent = "[—, —]";
    } else {
      coords1El.textContent = "[—, —]";
    }

    infoEl.textContent = state.selectedItem ? getMarkerInfo(state.selectedItem) : "Right-click a system or body to inspect it.";
    hintEl.textContent = "Cluster: 100 systems · System: bodies · WASD: move · Left drag: pan · Scroll: zoom · Left click: open · Middle click: select · Right click: inspect";
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

    if (state.mode === "Cluster") drawClusterView(markers, state.hoverItem);
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

  function parseJumpInput(raw) {
    const text = String(raw || "").trim().toLowerCase();
    if (!text) return null;

    if (/(^|\b)(earth|sol|sun)(\b|$)/.test(text)) {
      return { kind: "earth" };
    }

    const nums = text.match(/-?\d+/g);
    if (!nums || nums.length < 2) return null;

    return {
      kind: "coords",
      systemX: Number(nums[0]),
      systemY: Number(nums[1]),
      wantBody: /(body|planet|surface|moon)/.test(text),
    };
  }

  function getEarthDestination() {
    const cluster = state.catalog?.cluster;
    if (!cluster) return null;
    const system = cluster.Systems.find(s => s.Name === "Sol") || cluster.Systems[0] || null;
    if (!system) return null;
    const body = system.Bodies.find(b => b.Name === "Earth") || null;
    if (!body) return null;
    return { system, body };
  }

  function createOverlayControls() {
    if (state.uiCreated) return;
    state.uiCreated = true;

    const panel = document.createElement("div");
    panel.id = "controlPanel";

    const jumpRow = document.createElement("div");
    jumpRow.id = "jumpRow";

    const jumpInput = document.createElement("input");
    jumpInput.type = "text";
    jumpInput.id = "jumpInput";
    jumpInput.placeholder = "earth · or system coords 12, -5";

    const goBtn = document.createElement("button");
    goBtn.textContent = "Go";
    goBtn.className = "panelBtn";

    const earthBtn = document.createElement("button");
    earthBtn.textContent = "Go Earth";
    earthBtn.className = "panelBtn panelBtnAccent";

    jumpRow.appendChild(jumpInput);
    jumpRow.appendChild(goBtn);
    jumpRow.appendChild(earthBtn);

    const pad = document.createElement("div");
    pad.id = "dpad";

    function makePadButton(label, area) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.className = "padBtn";
      btn.style.gridArea = area;
      btn.style.touchAction = "none";
      return btn;
    }

    const upBtn = makePadButton("▲", "up");
    const leftBtn = makePadButton("◀", "left");
    const rightBtn = makePadButton("▶", "right");
    const downBtn = makePadButton("▼", "down");

    pad.appendChild(upBtn);
    pad.appendChild(leftBtn);
    pad.appendChild(rightBtn);
    pad.appendChild(downBtn);

    panel.appendChild(jumpRow);
    panel.appendChild(pad);
    document.body.appendChild(panel);

    function holdButton(btn, keyName) {
      const on = () => { state.moveKeys[keyName] = true; };
      const off = () => { state.moveKeys[keyName] = false; };

      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        btn.setPointerCapture?.(e.pointerId);
        on();
      });

      btn.addEventListener("pointerup", off);
      btn.addEventListener("pointercancel", off);
      btn.addEventListener("pointerleave", off);
      btn.addEventListener("lostpointercapture", off);
    }

    holdButton(upBtn, "up");
    holdButton(leftBtn, "left");
    holdButton(rightBtn, "right");
    holdButton(downBtn, "down");

    function jumpToEarth() {
      const earth = getEarthDestination();
      if (!earth) {
        infoEl.textContent = "Earth not available in this catalog.";
        return;
      }

      state.currentSystem = earth.system;
      state.currentBody = earth.body;
      state.mode = "Surface";
      state.cameraX = 0;
      state.cameraY = 0;
      setSelection({ kind: "body", object: earth.body, system: earth.system });
      infoEl.textContent = getMarkerInfo(state.selectedItem);
    }

    function jumpToParsedInput() {
      const parsed = parseJumpInput(jumpInput.value);

      if (!parsed) {
        infoEl.textContent = "Use Earth, Sol, or coords like 12, -5";
        return;
      }

      if (parsed.kind === "earth") {
        jumpToEarth();
        return;
      }

      const cluster = state.catalog?.cluster;
      const system = cluster?.Systems.find(s => s.SpaceX === parsed.systemX && s.SpaceY === parsed.systemY) || null;

      if (!system) {
        infoEl.textContent = `System not found: [${parsed.systemX}, ${parsed.systemY}]`;
        return;
      }

      state.currentSystem = system;
      state.mode = "System";
      state.currentBody = null;
      state.cameraX = 0;
      state.cameraY = 0;

      if (parsed.wantBody) {
        const body = system.Bodies.find(b => b.SystemX === parsed.systemX && b.SystemY === parsed.systemY) || null;
        if (body) {
          state.currentBody = body;
          state.mode = "Surface";
          setSelection({ kind: "body", object: body, system });
          infoEl.textContent = getMarkerInfo(state.selectedItem);
          return;
        }
      }

      setSelection({ kind: "system", object: system });
      infoEl.textContent = getMarkerInfo(state.selectedItem);
    }

    goBtn.addEventListener("click", jumpToParsedInput);
    earthBtn.addEventListener("click", jumpToEarth);
    jumpInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        jumpToParsedInput();
      }
    });

    state.jumpInput = jumpInput;
  }

  function setViewFromSelectionOnClick(item) {
    if (!item) return false;

    if (item.kind === "system") {
      setViewSystem(item.object);
      return true;
    }

    if (item.kind === "body") {
      setViewSurface(item.object, item.system || state.currentSystem);
      return true;
    }

    return false;
  }

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;
    state.mouseY = e.clientY - rect.top;
    state.mouseInside = true;

    if (state.dragging && state.dragPointerId !== null) {
      applyPanFromDrag(e.clientX, e.clientY);
      state.dragMoved = true;
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

    canvas.setPointerCapture?.(e.pointerId);
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
      const wasDrag = state.dragging && state.dragMoved;
      const item = state.hoverItem;

      if (!wasDrag && item) {
        setViewFromSelectionOnClick(item);
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
      setViewSystem(state.currentSystem);
      return;
    }
    if (state.mode === "System") {
      setViewCluster();
    }
  });

  teleportBtn.addEventListener("click", () => {
    if (state.selectedItem) openItem(state.selectedItem);
  });

  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    if (e.key === "w" || e.key === "W") state.keys.W = true;
    if (e.key === "a" || e.key === "A") state.keys.A = true;
    if (e.key === "s" || e.key === "S") state.keys.S = true;
    if (e.key === "d" || e.key === "D") state.keys.D = true;

    if (e.key === "ArrowUp") state.moveKeys.up = true;
    if (e.key === "ArrowDown") state.moveKeys.down = true;
    if (e.key === "ArrowLeft") state.moveKeys.left = true;
    if (e.key === "ArrowRight") state.moveKeys.right = true;

    if (e.key === "Escape") {
      if (state.mode === "Surface" && state.currentSystem) setViewSystem(state.currentSystem);
      else if (state.mode === "System") setViewCluster();
    }

    if (e.key === "Enter" && state.jumpInput) {
      state.jumpInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "w" || e.key === "W") state.keys.W = false;
    if (e.key === "a" || e.key === "A") state.keys.A = false;
    if (e.key === "s" || e.key === "S") state.keys.S = false;
    if (e.key === "d" || e.key === "D") state.keys.D = false;

    if (e.key === "ArrowUp") state.moveKeys.up = false;
    if (e.key === "ArrowDown") state.moveKeys.down = false;
    if (e.key === "ArrowLeft") state.moveKeys.left = false;
    if (e.key === "ArrowRight") state.moveKeys.right = false;
  });

  function tick(ts) {
    if (!tick.last) tick.last = ts;
    const dt = Math.min((ts - tick.last) / 1000, 0.05);
    tick.last = ts;

    if (state.mode !== "Surface") {
      const speedBase = state.mode === "Cluster" ? 22 : 18;
      const speed = (speedBase / state.zoom) * dt;

      if (state.keys.W) state.cameraY += speed;
      if (state.keys.S) state.cameraY -= speed;
      if (state.keys.A) state.cameraX -= speed;
      if (state.keys.D) state.cameraX += speed;

      if (state.moveKeys.up) state.cameraY += speed;
      if (state.moveKeys.down) state.cameraY -= speed;
      if (state.moveKeys.left) state.cameraX -= speed;
      if (state.moveKeys.right) state.cameraX += speed;

      state.cameraX = clamp(state.cameraX, -150, 150);
      state.cameraY = clamp(state.cameraY, -150, 150);
    }

    render();
    requestAnimationFrame(tick);
  }

  createOverlayControls();
  resizeCanvas();
  buildCatalog();

  state.currentSystem = state.catalog.cluster.Systems.find(s => s.Name === "Sol") || state.catalog.cluster.Systems[0] || null;
  state.currentBody = null;
  state.selectedItem = state.currentSystem ? { kind: "system", object: state.currentSystem } : null;
  state.mode = "Cluster";
  state.cameraX = 0;
  state.cameraY = 0;

  if (state.currentSystem) {
    infoEl.textContent = getMarkerInfo(state.selectedItem);
  }

  requestAnimationFrame(tick);
})();
