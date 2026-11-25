/* Topografie-oefenspel. Werkt op window.LESSON (inhoud) en window.MAP (kaart).
   Geen build-stap, geen libraries. Voortgang in localStorage (alleen op dit apparaat). */
(function () {
  "use strict";
  const L = window.LESSON, M = window.MAP;
  const SVGNS = "http://www.w3.org/2000/svg";
  const app = document.getElementById("app");
  const ITEMS = L.items;
  const byId = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
  const MAX = 4; // hoogste niveau per vaardigheid

  /* ================= opslag ================= */
  let KEY = null; // per speler, gezet in boot()
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} }
  function fresh() {
    const p = { items: {}, seen: {}, tests: [], mute: false };
    ITEMS.forEach((it) => (p.items[it.id] = { loc: it.zwak ? 0 : 1, spell: it.zwak ? 0 : 1 }));
    return p;
  }
  let P = null, SPELER_NAAM = "";
  function boot(naam) {
    SPELER_NAAM = naam;
    KEY = window.SPELER.sleutel(L.id);
    P = load() || fresh();
    ITEMS.forEach((it) => { if (!P.items[it.id]) P.items[it.id] = { loc: 0, spell: 0 }; });
    P.seen = P.seen || {}; P.tests = P.tests || [];
    home();
  }

  function bump(id, skill, delta, cap) {
    const s = P.items[id];
    if (delta > 0) s[skill] = Math.max(s[skill], Math.min(cap || MAX, s[skill] + delta));
    else s[skill] = Math.max(0, s[skill] + delta);
    save();
  }
  function stars(id) { const s = P.items[id]; return Math.round(((s.loc + s.spell) / (2 * MAX)) * 3); }
  function known(id) { const s = P.items[id]; return s.loc >= 3 && s.spell >= 3; }

  /* ================= hulpjes ================= */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "html") el.innerHTML = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
    return el;
  }
  function s(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    return el;
  }
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const kind = (it) => it.type || "plaats";
  const answers = (it) => [it.name].concat(it.ook || []);

  /* ================= eigen toetsenbord =================
     Het iPad-toetsenbord duwt de pagina weg en bedekt de halve kaart. Daarom typ je in de
     oefeningen op een toetsenbord in de app. Een los (bluetooth-)toetsenbord werkt ook. */
  const KB = { target: null, shift: false, paint: null };
  function kField(label) {
    const txt = h("span", { class: "ktxt" }), caret = h("span", { class: "kcaret" }), ph = h("span", { class: "kph" });
    const el = h("div", { class: "kfield", role: "textbox", "aria-label": label || "Antwoord" }, txt, caret, ph);
    let value = "", cls = "", ro = false;
    const paint = () => { el.className = "kfield" + (cls ? " " + cls : "") + (ro ? " ro" : "") + (KB.target === f ? " on" : ""); };
    const f = {
      el, onenter: null, oninput: null, onfocus: null,
      get value() { return value; },
      set value(v) { value = v || ""; txt.textContent = value; el.classList.toggle("filled", !!value); },
      get placeholder() { return ph.textContent; }, set placeholder(v) { ph.textContent = v || ""; },
      get className() { return cls; }, set className(v) { cls = v || ""; paint(); el.classList.toggle("filled", !!value); },
      get readOnly() { return ro; }, set readOnly(v) { ro = !!v; paint(); },
      focus() {
        const prev = KB.target; KB.target = f;
        if (prev && prev !== f && prev.repaint) prev.repaint();
        paint(); el.classList.toggle("filled", !!value);
        if (f.onfocus && prev !== f) f.onfocus();
      },
      repaint() { paint(); el.classList.toggle("filled", !!value); },
    };
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); if (!ro) f.focus(); });
    return f;
  }
  function kbType(key) {
    const t = KB.target;
    if (!t || !t.el.isConnected) return;
    if (key === "Enter") { if (t.onenter) t.onenter(); return; }
    if (t.readOnly) return;
    if (key === "Backspace") t.value = t.value.slice(0, -1);
    else if (t.value.length < 40) t.value += key;
    if (t.oninput) t.oninput();
  }
  function setShift(on) { KB.shift = on; if (KB.paint) KB.paint(); }
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const ae = document.activeElement;
    if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA")) return; // bv. 'Wie speelt er?'
    if (!KB.target || !KB.target.el.isConnected) return;
    if (ae && ae.tagName === "BUTTON" && (e.key === "Enter" || e.key === " ")) return; // die knop handelt het af
    if (e.key === "Enter" || e.key === "Backspace" || e.key.length === 1) {
      e.preventDefault(); kbType(e.key);
      if (e.key.length === 1 && KB.shift) setShift(false);
    }
  });
  function keyboard(enterLabel) {
    const keys = [];
    const key = (label, cls, onpress, span) => {
      const b = h("button", { type: "button", tabindex: "-1", class: "key" + (cls ? " " + cls : ""), style: span ? `grid-column: span ${span}` : null }, label);
      b.addEventListener("pointerdown", (e) => e.preventDefault()); // nooit de focus pakken
      b.addEventListener("click", onpress);
      return b;
    };
    const letter = (c) => { const b = key(c, "", () => { kbType(KB.shift ? c.toUpperCase() : c); if (KB.shift) setShift(false); }); b.dataset.c = c; keys.push(b); return b; };
    const shiftKey = key("⇧", "mod shift", () => setShift(!KB.shift), 2);
    shiftKey.setAttribute("aria-label", "Hoofdletter");
    const back = key("⌫", "mod", () => kbType("Backspace")); back.setAttribute("aria-label", "Wissen");
    const enter = key(enterLabel || "Klaar ↵", "enter", () => kbType("Enter"), 4);
    const row = (...k) => h("div", { class: "kb-row" }, ...k);
    const el = h("div", { class: "kb", role: "group", "aria-label": "Toetsenbord" },
      row(..."qwertyuiop".split("").map(letter)),
      row(..."asdfghjkl".split("").map(letter), back),
      row(shiftKey, ..."zxcvbnm".split("").map(letter), key("-", "", () => kbType("-"))),
      row(key("spatie", "space", () => kbType(" "), 6), enter));
    KB.paint = () => { keys.forEach((b) => (b.textContent = KB.shift ? b.dataset.c.toUpperCase() : b.dataset.c)); shiftKey.classList.toggle("on", KB.shift); };
    setShift(false);
    return { el, setEnter(label) { enter.textContent = label; } };
  }
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const spelHTML = (it) => esc(it.spel || it.name).replace(/\[([^\]]*)\]/g, "<mark>$1</mark>");
  const deze = (it) => ({ plaats: "deze plaats", kanaal: "dit kanaal", rug: "deze zandrug" }[kind(it)]);
  const norm = (t) => t.replace(/[‐-―]/g, "-").replace(/\s+/g, " ").replace(/\s*-\s*/g, "-").trim();

  /* ================= geluid en spraak ================= */
  let actx = null;
  function beep(type) {
    if (P.mute) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = type === "good" ? [660, 880] : type === "win" ? [523, 659, 784, 1047] : [220, 180];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type === "bad" ? "triangle" : "sine"; o.frequency.value = f;
        const t = actx.currentTime + i * 0.11;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.25);
      });
    } catch (e) {}
  }
  // Spraak: vooraf opgenomen mp3's (ElevenLabs, zie tools/make_audio.py).
  // Ontbreekt een bestand, dan valt het terug op de ingebouwde browserstem.
  let nlVoice = null;
  function pickVoice() {
    try {
      const v = speechSynthesis.getVoices().filter((v) => /^nl/i.test(v.lang));
      nlVoice = v.find((x) => /nl-NL/i.test(x.lang)) || v[0] || null;
    } catch (e) {}
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function tts(text) {
    if (!text || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "nl-NL"; if (nlVoice) u.voice = nlVoice; u.rate = 0.9;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  const player = new Audio(); // één element: iOS geeft het na de eerste tik vrij
  player.preload = "auto";
  let queued = null;
  const busy = () => !player.paused && !player.ended;
  player.addEventListener("ended", () => { const f = queued; queued = null; if (f) f(); });
  function play(src, fallback, force) {
    if (P.mute && !force) return;
    try { speechSynthesis.cancel(); } catch (e) {}
    queued = null;
    player.onerror = () => tts(fallback);
    player.src = src;
    const pr = player.play();
    if (pr && pr.catch) pr.catch(() => {});
  }
  function say(it, opt) { // alleen de naam, of naam + feitje als één doorlopende opname
    opt = opt || {};
    if (opt.feit) play(`audio/item-${it.id}.mp3`, it.name, opt.force);
    else play(`audio/naam-${it.id}.mp3`, it.name, opt.force);
  }
  const LINES = { goed: 8, fout: 3, caps: 1, space: 1, reeks3: 1, reeks5: 1, reeks10: 1, eindeTop: 1, eindeGoed: 1, eindeOefen: 1, toets10: 1, toetsGoed: 1, toetsOefen: 1, sessieStart: 1, sessieKlaar: 1, volgende: 1 };
  function playNext(src) { if (P.mute) return; if (busy()) queued = () => play(src); else play(src); }
  function cheer(key, chance) { // compliment of aanmoediging; wacht tot de naam is uitgesproken
    if (P.mute || !LINES[key] || Math.random() > (chance == null ? 1 : chance)) return;
    const src = `../shared/audio/${key}-${1 + Math.floor(Math.random() * LINES[key])}.mp3`;
    if (busy()) queued = () => play(src); else play(src);
  }
  const speakBtn = (it, feit) => h("button", { class: "icon-btn", "aria-label": "Hardop zeggen", onclick: (e) => { e.stopPropagation(); say(it, { force: true, feit }); } }, "🔊");

  /* ================= kaart ================= */
  function parsePath(d) {
    const lines = []; let cur = null;
    d.replace(/([MLZ])([^MLZ]*)/g, (m, c, args) => {
      if (c === "M") { cur = []; lines.push(cur); }
      if (c === "Z") { if (cur && cur.length) cur.push(cur[0]); return m; }
      const n = args.split(/[ ,]/).filter(Boolean).map(Number);
      for (let i = 0; i + 1 < n.length; i += 2) cur.push([n[i], n[i + 1]]);
      return m;
    });
    return lines;
  }
  const GEOM = {};
  ITEMS.forEach((it) => {
    if (kind(it) === "plaats") GEOM[it.id] = { pt: M.points[it.id] };
    else GEOM[it.id] = { lines: parsePath(kind(it) === "kanaal" ? M.canals[it.id] : M.ridges[it.id]), d: kind(it) === "kanaal" ? M.canals[it.id] : M.ridges[it.id] };
  });
  function segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
    let t = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function distTo(id, p) {
    const g = GEOM[id];
    if (g.pt) return Math.hypot(p[0] - g.pt[0], p[1] - g.pt[1]);
    let best = Infinity;
    g.lines.forEach((ln) => { for (let i = 1; i < ln.length; i++) best = Math.min(best, segDist(p, ln[i - 1], ln[i])); });
    return best;
  }
  function anchor(id) { // plek voor een naam of nummer
    if (M.tags && M.tags[id]) return M.tags[id];
    const g = GEOM[id];
    if (g.pt) return g.pt;
    const ln = g.lines.reduce((a, b) => (b.length > a.length ? b : a));
    return ln[Math.floor(ln.length / 2)];
  }

  function createMap(host, opt) {
    opt = opt || {};
    const svg = s("svg", { viewBox: `0 0 ${M.width} ${M.height}`, class: "map", preserveAspectRatio: "xMidYMid meet", role: "img", "aria-label": "Kaart van " + L.region });
    svg.append(s("rect", { class: "de", width: M.width, height: M.height }));
    for (const [name, d] of Object.entries(M.provinces)) svg.append(s("path", { d, class: "prov" + (name === M.focus ? " focus" : "") }));
    for (const [name, p] of Object.entries(M.labels || {})) { const t = s("text", { x: p[0], y: p[1], class: "land-label" }); t.textContent = name; svg.append(t); }
    const ridgeG = s("g", {}); svg.append(ridgeG);
    for (const [id, d] of Object.entries(M.ridges || {})) ridgeG.append(s("path", { d, class: "ridge", "data-id": id }));
    for (const [id, d] of Object.entries(M.canals)) svg.append(s("path", { d, class: "canal", "data-id": id }));
    const hlUnder = s("g", {}); svg.append(hlUnder);
    const statusLines = s("g", {}); svg.append(statusLines);
    ITEMS.filter((it) => kind(it) === "plaats").forEach((it) => {
      const [x, y] = M.points[it.id];
      const r = it.size === "hoofdstad" ? 15 : it.size === "stad" ? 10 : 7.5;
      svg.append(s("circle", { cx: x, cy: y, r, class: "pt" + (it.size === "stad" ? " stad" : "") }));
    });
    const statusPts = s("g", {}); svg.append(statusPts);
    const over = s("g", {}); svg.append(over);
    const tagsG = s("g", {}); svg.append(tagsG);
    const namesG = s("g", {}); svg.append(namesG);
    host.append(svg);

    // Inzoomen op de les-provincie plus alle plekken: geen ruimte verspillen aan de buren.
    let VB = { x: 0, y: 0, w: M.width, h: M.height };
    try {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const add = (b) => { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); };
      svg.querySelectorAll(".prov.focus, .canal, .ridge").forEach((el) => add(el.getBBox()));
      Object.values(M.points).forEach(([x, y]) => add({ x, y, width: 0, height: 0 }));
      x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(M.width, x1); y1 = Math.min(M.height, y1);
      if (x1 - x0 > 100 && y1 - y0 > 100) {
        const pad = 0.06 * Math.max(x1 - x0, y1 - y0);
        VB = { x: Math.max(0, x0 - pad), y: Math.max(0, y0 - pad), w: 0, h: 0 };
        VB.w = Math.min(M.width, x1 + pad) - VB.x; VB.h = Math.min(M.height, y1 + pad) - VB.y;
        svg.setAttribute("viewBox", `${VB.x} ${VB.y} ${VB.w} ${VB.h}`);
      }
    } catch (e) {}

    const api = {
      vb: VB,
      svg,
      showRidge(on) { ridgeG.style.display = on ? "" : "none"; },
      clear() { over.replaceChildren(); hlUnder.replaceChildren(); namesG.replaceChildren(); },
      mark(id, cls) {
        const g = GEOM[id];
        if (g.pt) {
          const it = byId[id];
          const r = it.size === "hoofdstad" ? 27 : 21;
          over.append(s("circle", { cx: g.pt[0], cy: g.pt[1], r, class: "hl-pt " + cls }));
        } else {
          (kind(byId[id]) === "rug" ? over : hlUnder).append(s("path", { d: g.d, class: "hl-line " + cls, "stroke-width": kind(byId[id]) === "rug" ? 40 : 18 }));
        }
      },
      name(id, text, cls) {
        let [x, y] = anchor(id);
        const t = s("text", { class: "name " + (cls || "") });
        const isPt = !!GEOM[id].pt && !(M.tags && M.tags[id]);
        if (isPt) {
          const right = x > VB.x + VB.w - 230;
          t.setAttribute("x", right ? x - 18 : x + 18);
          t.setAttribute("y", y - 14);
          t.setAttribute("text-anchor", right ? "end" : "start");
        } else { t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", "middle"); }
        t.textContent = text;
        namesG.append(t);
      },
      bubble(id, text) { // groot oranje nummer op de plek waar je nu mee bezig bent
        const [x, y] = anchor(id);
        const isPt = !!GEOM[id].pt && !(M.tags && M.tags[id]);
        const cx = isPt ? x - 4 : x, cy = isPt ? y - 46 : y;
        over.append(s("circle", { cx, cy, r: 26, class: "bubble" }));
        const t = s("text", { x: cx, y: cy + 9, class: "bubble-t" }); t.textContent = text; over.append(t);
      },
      tags(on) {
        tagsG.replaceChildren();
        if (!on) return;
        ITEMS.forEach((it) => {
          let [x, y] = anchor(it.id);
          const isPt = !!GEOM[it.id].pt;
          const t = s("text", { x: isPt ? x - 4 : x, y: isPt ? y - 16 : y, class: "tag", "text-anchor": "middle" });
          t.textContent = it.nr; tagsG.append(t);
        });
      },
      status(seen) { // ontdekt = groen met vinkje, nog niet = gele ring
        statusLines.replaceChildren(); statusPts.replaceChildren();
        if (!seen) return;
        ITEMS.forEach((it) => {
          const g = GEOM[it.id], ok = !!seen[it.id];
          if (g.pt) {
            const r = it.size === "hoofdstad" ? 15 : 11;
            if (ok) {
              statusPts.append(s("circle", { cx: g.pt[0], cy: g.pt[1], r, class: "seen-dot" }));
              const t = s("text", { x: g.pt[0], y: g.pt[1] + 5, class: "seen-tick" }); t.textContent = "✓"; statusPts.append(t);
            } else statusPts.append(s("circle", { cx: g.pt[0], cy: g.pt[1], r: r + 8, class: "todo-ring" }));
          } else if (kind(it) === "kanaal") {
            statusLines.append(s("path", { d: g.d, class: ok ? "seen-line" : "todo-line" }));
          } else if (ok) statusLines.append(s("path", { d: g.d, class: "seen-ridge" }));
        });
      },
      tapmark(p) { over.append(s("circle", { cx: p[0], cy: p[1], r: 9, class: "tapmark" })); },
      toSvg(e) {
        const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        const m = svg.getScreenCTM(); if (!m) return [0, 0];
        const r = pt.matrixTransform(m.inverse()); return [r.x, r.y];
      },
      pxToUnits(px) { const m = svg.getScreenCTM(); return m ? px / m.a : px; },
      nearest(p, ids) {
        // Plaatsen gaan voor: tik je binnen een vingerbreedte van een stip, dan is het die plaats,
        // ook als er een kanaal of zandrug dichterbij loopt. Lijnen pak je toch wel ergens anders.
        const vinger = api.pxToUnits(30);
        let best = null, bd = Infinity, bestPt = null, bdPt = Infinity;
        ids.forEach((id) => {
          const d = distTo(id, p);
          if (d < bd) { bd = d; best = id; }
          if (GEOM[id].pt && d < bdPt) { bdPt = d; bestPt = id; }
        });
        return bdPt < vinger ? { id: bestPt, d: bdPt } : { id: best, d: bd };
      },
      onTap(fn) {
        let down = null;
        svg.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
        svg.addEventListener("pointerup", (e) => {
          if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 14) return;
          fn(api.toSvg(e), e);
        });
      },
    };
    api.showRidge(opt.ridge !== false);
    api.tags(!!opt.tags);
    return api;
  }

  /* ================= confetti ================= */
  function confetti() {
    const c = h("canvas", { class: "confetti" }); document.body.append(c);
    const ctx = c.getContext("2d"), W = (c.width = innerWidth), H = (c.height = innerHeight);
    const cols = ["#ff8a3d", "#ffd23f", "#22a35a", "#2f7de1", "#7a5cf0", "#e2453c"];
    const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, r: 5 + Math.random() * 6, a: Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] }));
    let n = 0;
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.a += 0.1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
      if (++n < 200) requestAnimationFrame(frame); else c.remove();
    })();
  }

  /* ================= vergelijken (spelling) ================= */
  function align(a, b) { // Levenshtein-uitlijning: lijst van [type, char]
    const n = a.length, m = b.length, D = [];
    for (let i = 0; i <= n; i++) { D[i] = [i]; }
    for (let j = 1; j <= m; j++) D[0][j] = j;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
      D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    const ops = []; let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) { ops.unshift([a[i - 1] === b[j - 1] ? "ok" : "sub", b[j - 1], a[i - 1]]); i--; j--; }
      else if (j > 0 && D[i][j] === D[i][j - 1] + 1) { ops.unshift(["miss", b[j - 1]]); j--; }
      else { ops.unshift(["extra", null, a[i - 1]]); i--; }
    }
    return { ops, dist: D[n][m] };
  }
  function diffHTML(typed, correct) {
    const { ops } = align(typed, correct);
    const mine = ops.map(([t, c, a]) => t === "ok" ? `<span class="ok">${esc(a)}</span>` : t === "miss" ? "" : `<span class="x">${a === " " ? "&nbsp;" : esc(a)}</span>`).join("");
    const good = ops.map(([t, c]) => t === "ok" ? esc(c) : t === "extra" ? "" : `<span class="miss">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
    return { mine, good };
  }
  function check(it, typed) {
    const t = norm(typed);
    if (!t) return { res: "empty" };
    if (answers(it).some((a) => norm(a) === t)) return { res: "good" };
    if (answers(it).some((a) => norm(a).toLowerCase() === t.toLowerCase())) return { res: "caps" };
    if (answers(it).some((a) => norm(a).replace(/[- ]/g, "").toLowerCase() === t.replace(/[- ]/g, "").toLowerCase())) return { res: "space" };
    const other = ITEMS.find((o) => o !== it && answers(o).some((a) => norm(a).toLowerCase() === t.toLowerCase()));
    if (other) return { res: "other", other };
    return { res: "bad", dist: align(t, it.name).dist };
  }

  /* ================= schermen ================= */
  const MODES = [
    { id: "ontdek", emoji: "🧭", title: "Ontdekken", text: "Tik op de kaart en leer alle plekken kennen." },
    { id: "waar", emoji: "📍", title: "Waar ligt het?", text: "Je krijgt een naam. Tik de goede plek aan." },
    { id: "kies", emoji: "🔤", title: "Hoe heet het?", text: "Een plek knippert. Kies de goede naam." },
    { id: "speur", emoji: "🔍", title: "Spellingspeurder", text: "Welke naam is goed geschreven? Pas op voor foutjes!" },
    { id: "schrijf", emoji: "✏️", title: "Schrijf het op", text: "Een plek knippert. Typ de naam, zonder fouten." },
    { id: "toets", emoji: "📝", title: "Oefentoets", text: "Net als de echte toets: alle nummers invullen. Krijg je een 10?" },
  ];
  function advice() {
    const seen = ITEMS.filter((it) => P.seen[it.id]).length;
    const avg = (k) => ITEMS.reduce((a, it) => a + P.items[it.id][k], 0) / ITEMS.length;
    if (seen < ITEMS.length) return "ontdek";
    if (avg("loc") < 1.6) return "waar";
    if (avg("loc") < 1.9) return "kies";
    if (avg("spell") < 1.8) return "speur";
    if (avg("spell") < 3.2 || avg("loc") < 3) return "schrijf";
    return "toets";
  }

  const avgOf = (k) => ITEMS.reduce((a, it) => a + P.items[it.id][k], 0) / ITEMS.length;
  const seenCount = () => ITEMS.filter((it) => P.seen[it.id]).length;
  const DONE = {
    ontdek: () => seenCount() >= ITEMS.length,
    waar: () => avgOf("loc") >= 1.6,
    kies: () => avgOf("loc") >= 1.9,
    speur: () => avgOf("spell") >= 1.8,
    schrijf: () => avgOf("spell") >= 3.2 && avgOf("loc") >= 3,
    toets: () => P.tests.some((t) => t.good / t.total >= 0.9),
  };
  const ROUTE = [
    { title: "Leren", ids: ["ontdek"] },
    { title: "Oefenen", ids: ["waar", "kies", "speur", "schrijf"] },
    { title: "Toets", ids: ["toets"] },
  ];

  function home() {
    stopSpeech();
    const nKnown = ITEMS.filter((it) => known(it.id)).length;
    const pct = Math.round((ITEMS.reduce((a, it) => a + stars(it.id), 0) / (ITEMS.length * 3)) * 100);
    const tip = advice();
    const mode = (id) => MODES.find((m) => m.id === id);
    const last = P.tests[P.tests.length - 1];
    const extra = (id) => id === "ontdek" ? `👀 ${seenCount()}/${ITEMS.length}` : id === "toets" && last ? `laatste: ${last.grade}` : "";
    let resetArmed = false;
    const resetBtn = h("button", { class: "btn small ghost", onclick: () => {
      if (!resetArmed) { resetArmed = true; resetBtn.textContent = "Zeker weten? Tik nog een keer"; return; }
      P = fresh(); save(); home();
    } }, "Opnieuw beginnen");
    const muteBtn = h("button", { class: "btn small ghost", onclick: () => { P.mute = !P.mute; save(); muteBtn.textContent = P.mute ? "🔇 Geluid uit" : "🔊 Geluid aan"; } }, P.mute ? "🔇 Geluid uit" : "🔊 Geluid aan");
    app.replaceChildren(h("div", { class: "wrap narrow" },
      h("div", { class: "topbar" }, h("a", { class: "crumb", href: "../" }, "← Alle lessen"),
        h("button", { class: "crumb linkish", onclick: () => window.SPELER.kies(boot) }, `👤 ${SPELER_NAAM} · wissel`)),
      h("div", { class: "hero" }, h("div", { class: "badge" }, "🗺️"), h("div", {}, h("h1", {}, L.title), h("p", {}, `Hoi ${SPELER_NAAM}! Leer waar alles ligt én hoe je het goed schrijft.`))),
      kwartierKaart(),
      h("div", { class: "route" },
        h("div", { class: "route-head" }, h("h2", {}, "Of kies zelf"),
          h("span", { class: "route-meter" }, h("span", { title: "Helemaal kennen = je weet waar het ligt én je schrijft het goed" }, `⭐ ${nKnown} van ${ITEMS.length} ken je al`), h("span", { class: "meter-bar" }, h("i", { style: `width:${pct}%` })))),
        ROUTE.map((g) => h("div", { class: "route-group" },
          h("div", { class: "route-title" }, `${ROUTE.indexOf(g) + 1}. ${g.title}`),
          g.ids.map((id) => {
            const m = mode(id), done = DONE[id](), isNow = id === tip;
            return h("button", { class: "route-row" + (done ? " done" : "") + (isNow ? " now" : ""), onclick: () => start(id) },
              h("span", { class: "route-check" }, done ? "✅" : isNow ? "▶" : "○"),
              h("span", { class: "route-emoji" }, m.emoji),
              h("span", { class: "route-name" }, m.title),
              h("span", { class: "route-extra" }, extra(id)));
          })))),
      h("div", { class: "foot" }, muteBtn, resetBtn, h("span", {}, "Je voortgang wordt bewaard op dit apparaat. Kaart: © CBS/PDOK, © OpenStreetMap-bijdragers."))
    ));
    window.scrollTo(0, 0);
  }
  function stopSpeech() { try { speechSynthesis.cancel(); player.pause(); queued = null; } catch (e) {} }

  /* ---------- kwartiertje: een vast plan van 3-4 opdrachten ---------- */
  const MINUTEN = { ontdek: 4, waar: 3, kies: 3, speur: 3, schrijf: 4, toets: 5 };
  const PLANNEN = {
    ontdek: ["ontdek", "waar", "kies", "speur"],
    waar: ["waar", "kies", "speur", "schrijf"],
    kies: ["kies", "speur", "schrijf", "waar"],
    speur: ["waar", "speur", "schrijf", "schrijf"],
    schrijf: ["kies", "schrijf", "schrijf", "toets"],
    toets: ["schrijf", "toets", "waar"],
  };
  const KWARTIER = 15 * 60 * 1000;
  let SESSIE = null; // { plan, i, start }
  const vandaag = () => new Date().toISOString().slice(0, 10);
  function kwartierKaart() {
    const plan = SESSIE ? SESSIE.plan : PLANNEN[advice()];
    const totaal = plan.reduce((a, id) => a + MINUTEN[id], 0);
    const gedaan = (P.sessies || []).includes(vandaag());
    const bezig = !!SESSIE;
    return h("div", { class: "kwartier" },
      h("div", { class: "kw-head" }, h("span", { class: "kw-label" }, "⏱️ Jouw kwartiertje"), h("span", { class: "kw-tijd" }, `± ${totaal} min`)),
      h("div", { class: "kw-sub" }, bezig ? `Je bent bij opdracht ${SESSIE.i + 1} van ${plan.length}.` : gedaan ? "✅ Vandaag al gedaan! Nog een keer mag ook." : `Doe deze ${plan.length} opdrachten na elkaar. Dan ben je klaar!`),
      h("ol", { class: "kw-list" }, plan.map((id, i) => {
        const m = MODES.find((x) => x.id === id), af = bezig && i < SESSIE.i, nu = bezig ? i === SESSIE.i : i === 0;
        return h("li", { class: (af ? "af" : "") + (nu ? " nu" : "") },
          h("span", { class: "kw-nr" }, af ? "✓" : String(i + 1)), h("span", { class: "kw-emoji" }, m.emoji),
          h("span", { class: "kw-name" }, m.title), h("span", { class: "kw-min" }, `${MINUTEN[id]} min`));
      })),
      h("button", { class: "btn kw-btn", onclick: bezig ? () => start(SESSIE.plan[SESSIE.i]) : startSessie }, bezig ? `▶ Verder met opdracht ${SESSIE.i + 1}` : "▶ Start je kwartiertje"));
  }
  function startSessie() {
    SESSIE = { plan: PLANNEN[advice()].slice(), i: 0, start: Date.now() };
    cheer("sessieStart");
    start(SESSIE.plan[0]);
  }
  function volgendeOpdracht() {
    SESSIE.i++;
    if (SESSIE.i >= SESSIE.plan.length || Date.now() - SESSIE.start >= KWARTIER) return sessieKlaar();
    cheer("volgende");
    start(SESSIE.plan[SESSIE.i]);
  }
  function sessieKlaar() {
    const min = Math.max(1, Math.round((Date.now() - SESSIE.start) / 60000));
    const gedaan = SESSIE.i;
    SESSIE = null;
    P.sessies = (P.sessies || []).filter((d) => d !== vandaag()).concat(vandaag()); save();
    stopSpeech(); confetti(); beep("win"); cheer("sessieKlaar");
    app.replaceChildren(h("div", { class: "wrap" }, h("div", { class: "result" },
      h("div", { class: "big-emoji" }, "🏁"),
      h("div", { class: "score" }, "Je kwartiertje zit erop!"),
      h("div", {}, `${gedaan} ${gedaan === 1 ? "opdracht" : "opdrachten"} gedaan in ${min} ${min === 1 ? "minuut" : "minuten"}. Heel goed, ${SPELER_NAAM}!`),
      h("div", {}, "Morgen weer een kwartiertje? Zo onthoud je het het beste."),
      h("div", { class: "buttons" }, h("button", { class: "btn", onclick: home }, "Terug naar menu")))));
  }
  // knoppen onderaan een uitslag: in een kwartiertje door naar de volgende opdracht
  function eindKnoppen(opnieuw, opnieuwTekst) {
    if (SESSIE) {
      const laatste = SESSIE.i + 1 >= SESSIE.plan.length;
      return h("div", { class: "buttons" },
        h("button", { class: "btn green", onclick: volgendeOpdracht }, laatste ? "🏁 Kwartiertje afronden" : "Volgende opdracht →"),
        h("button", { class: "btn ghost", onclick: () => { SESSIE = null; home(); } }, "Stoppen"));
    }
    return h("div", { class: "buttons" },
      h("button", { class: "btn", onclick: opnieuw }, opnieuwTekst),
      h("button", { class: "btn ghost", onclick: home }, "Terug naar menu"));
  }
  const sessieTitel = (t) => SESSIE ? `Opdracht ${SESSIE.i + 1}/${SESSIE.plan.length} · ${t}` : t;

  function start(mode) {
    if (mode === "ontdek") return ontdek();
    if (mode === "toets") return toets();
    round(mode);
  }

  /* ---------- spelscherm-raamwerk ---------- */
  function gameShell(title) {
    const dots = h("div", { class: "dots" });
    const streak = h("div", { class: "streak" });
    const panel = h("div", { class: "panel" });
    const mapbox = h("div", { class: "mapbox" });
    app.replaceChildren(h("div", { class: "game" },
      h("div", { class: "game-head" },
        h("button", { class: "icon-btn", "aria-label": "Terug", onclick: home }, "←"),
        h("div", { class: "title" }, sessieTitel(title)), dots, streak),
      h("div", { class: "game-body" }, panel, mapbox)));
    return { dots, streak, panel, mapbox };
  }

  /* ---------- 1. ontdekken ---------- */
  function ontdek() {
    const ui = gameShell("🧭 Ontdekken");
    ui.dots.remove();
    ui.mapbox.parentNode.classList.add("map-first"); // telefoon: eerst de kaart, dan het doel en de lijst
    const map = createMap(ui.mapbox, { ridge: true, tags: false });
    let showAll = false, current = null;
    const chips = h("div", { class: "chips" });
    const card = h("div", {}, h("div", { class: "feedback info" }, "👆 Tik op een plek met een gele ring. Dan hoor je hoe hij heet en krijg je een weetje."));
    const counter = h("div", { class: "streak" });
    ui.streak.replaceWith(counter);
    const goalBar = h("i", {});
    const goalText = h("span", { class: "goal-count" });
    const goal = h("div", { class: "goal" },
      h("div", { class: "goal-title" }, "🎯 Tik alle plekken aan en kijk goed waar ze liggen"),
      h("div", { class: "goal-row" }, h("div", { class: "meter-bar goal-meter" }, goalBar), goalText),
      h("div", { class: "goal-legend" }, h("span", { class: "lg todo" }, "nog ontdekken"), h("span", { class: "lg ok" }, "✓ al bekeken")));
    const toggle = h("label", { class: "toggle" }, h("input", { type: "checkbox", onchange: (e) => { showAll = e.target.checked; draw(); } }), "Alle namen tonen");
    function updCount() {
      const n = seenCount();
      counter.textContent = `👀 ${n}/${ITEMS.length}`;
      goalBar.style.width = `${(n / ITEMS.length) * 100}%`;
      goalText.textContent = n >= ITEMS.length ? "Alles bekeken! 🎉" : `${n} van de ${ITEMS.length}`;
    }
    function draw() {
      map.clear();
      if (showAll) ITEMS.forEach((it) => map.name(it.id, it.name));
      map.status(P.seen);
      if (current) { map.mark(current.id, "focus-c"); if (!showAll) map.name(current.id, current.name, "good"); }
      chips.replaceChildren(...ITEMS.map((it) => h("span", { class: "chip" + (P.seen[it.id] ? " seen" : " todo") + (current === it ? " active" : "") },
        P.seen[it.id] ? "✓ " : "", it.name)));
      updCount();
      if (SESSIE) {
        const alles = ITEMS.every((x) => P.seen[x.id]);
        verder.disabled = !alles;
        verder.textContent = alles ? "Klaar! Volgende opdracht →" : `Bekijk alle plekken (${seenCount()}/${ITEMS.length})`;
      }
    }
    const verder = h("button", { class: "btn green", onclick: volgendeOpdracht }, "");
    function pick(it) {
      current = it; P.seen[it.id] = true; save();
      card.replaceChildren(
        h("div", { class: "prompt" }, h("div", { class: "q" }, h("div", { class: "card-name spel", html: spelHTML(it) })), speakBtn(it, true)),
        h("div", { class: "feedback info" }, it.feit, it.tip ? h("div", { style: "margin-top:8px" }, "✏️ ", h("b", {}, it.tip)) : null));
      say(it, { feit: true });
      draw();
      if (ITEMS.every((x) => P.seen[x.id]) && !P.seenAllCheered) { P.seenAllCheered = true; save(); confetti(); beep("win"); }
    }
    ui.panel.append(...[goal, card, SESSIE ? verder : null, toggle, chips].filter(Boolean));
    if (seenCount() < ITEMS.length) playNext("../shared/audio/ontdekIntro-1.mp3");
    map.onTap((p) => {
      const near = map.nearest(p, ITEMS.map((it) => it.id));
      if (near.d < map.pxToUnits(36)) pick(byId[near.id]);
    });
    draw();
  }

  /* ---------- rondes (stap 2 t/m 5) ---------- */
  function pickItems(skill, n, filter) {
    const pool = ITEMS.filter(filter || (() => true));
    return pool.map((it) => ({ it, w: P.items[it.id][skill] + Math.random() * 1.6 }))
      .sort((a, b) => a.w - b.w).slice(0, n).map((x) => x.it);
  }
  const ROUND = {
    waar: { title: "📍 Waar ligt het?", skill: "loc", cap: 4, n: 10 },
    kies: { title: "🔤 Hoe heet het?", skill: "loc", cap: 2, n: 10 },
    speur: { title: "🔍 Spellingspeurder", skill: "spell", cap: 2, n: 10 },
    schrijf: { title: "✏️ Schrijf het op", skill: "spell", cap: 4, n: 10, locToo: true },
  };

  function round(mode) {
    const cfg = ROUND[mode];
    const ui = gameShell(cfg.title);
    const map = createMap(ui.mapbox, { ridge: false, tags: false });
    let tapHandler = null, W = null;
    map.onTap((p) => { if (tapHandler) tapHandler(p); });
    const queue = shuffle(pickItems(cfg.skill, cfg.n));
    const firstTry = {}; // id -> true/false
    const requeued = new Set();
    let pos = 0, streak = 0, best = 0;
    const slots = queue.map(() => h("i"));
    ui.dots.replaceChildren(...slots);

    function setStreak() { ui.streak.textContent = streak >= 2 ? `🔥 ${streak}` : ""; }
    function next() {
      tapHandler = null;
      map.clear(); map.showRidge(false);
      if (pos >= queue.length) return finish();
      slots.forEach((d, i) => d.classList.toggle("now", i === pos));
      const it = queue[pos];
      ASK[mode](it, (ok, opts) => {
        opts = opts || {};
        if (!(it.id in firstTry)) {
          firstTry[it.id] = ok;
          if (ok && !opts.noGain) { bump(it.id, cfg.skill, 1, cfg.cap); if (cfg.locToo) bump(it.id, "loc", 1, MAX); }
          if (!ok) bump(it.id, cfg.skill, -1);
          if (opts.alsoLoc === false) bump(it.id, "loc", -1);
        }
        if (slots[pos] && !slots[pos].classList.contains("bad")) slots[pos].classList.add(ok ? "ok" : "bad");
        if (ok) { streak++; best = Math.max(best, streak); } else streak = 0;
        setStreak();
        if (ok) cheer(streak === 10 ? "reeks10" : streak === 5 ? "reeks5" : streak === 3 ? "reeks3" : "goed", streak % 5 === 0 || streak === 3 ? 1 : 0.5);
        else if (mode !== "schrijf") cheer("fout", 0.4);
        if (!ok && !requeued.has(it.id)) {
          requeued.add(it.id);
          queue.splice(Math.min(queue.length, pos + 4), 0, it);
          const d = h("i"); slots.push(d); ui.dots.append(d);
        }
        pos++;
      }, next);
    }
    function finish() {
      const ids = Object.keys(firstTry);
      const good = ids.filter((id) => firstTry[id]).length;
      const pct = good / ids.length;
      if (pct >= 0.8) { confetti(); beep("win"); }
      cheer(pct === 1 ? "eindeTop" : pct >= 0.7 ? "eindeGoed" : "eindeOefen");
      const wrong = ids.filter((id) => !firstTry[id]).map((id) => byId[id]);
      app.replaceChildren(h("div", { class: "wrap" }, h("div", { class: "result" },
        h("div", { class: "big-emoji" }, pct === 1 ? "🏆" : pct >= 0.8 ? "🎉" : pct >= 0.5 ? "💪" : "🌱"),
        h("div", { class: "score" }, `${good} van de ${ids.length} in één keer goed`),
        h("div", {}, pct === 1 ? "Alles goed! Super!" : pct >= 0.8 ? "Heel goed gedaan!" : pct >= 0.5 ? "Goed bezig! Nog even oefenen." : "Oefenen maakt je sterker. Probeer het nog een keer!"),
        best >= 3 ? h("div", {}, `🔥 Langste reeks: ${best} goed achter elkaar`) : null,
        wrong.length ? h("div", {}, h("div", { style: "font-weight:800;margin-bottom:8px" }, "Deze nog even oefenen:"),
          h("div", { class: "list" }, wrong.map((it) => h("span", { class: "chip spel", html: spelHTML(it) })))) : null,
        eindKnoppen(() => round(mode), "Nog een keer"))));
    }

    /* ---- vragen per modus ---- */
    const ASK = {
      /* 2: naam gegeven, tik de plek */
      waar(it, done, next) {
        const k = kind(it);
        const cand = ITEMS.filter((o) => kind(o) === k).map((o) => o.id);
        ui.panel.replaceChildren(h("div", { class: "prompt" },
          h("div", { class: "q", html: `Waar ligt <b>${esc(it.name)}</b>?` }), speakBtn(it)),
          h("div", { class: "feedback info" }, k === "rug" ? "Tik op de kaart waar de zandrug ligt." : k === "kanaal" ? "Tik op het goede kanaal." : "Tik op de goede stip."));
        let answered = false;
        tapHandler = (p) => {
          if (answered) return;
          let hit;
          if (k === "rug") hit = distTo(it.id, p) < 45 ? it.id : "__mis";
          else { const nr = map.nearest(p, cand); hit = nr.d < map.pxToUnits(48) ? nr.id : null; }
          if (!hit) return; // naast alles getikt: niets doen
          answered = true;
          const ok = hit === it.id;
          map.clear();
          if (k === "rug") map.showRidge(true);
          if (ok) {
            beep("good"); map.mark(it.id, "good-c"); map.name(it.id, it.name, "good");
            ui.panel.append(h("div", { class: "feedback good" }, h("span", { class: "title" }, "✅ Goed zo!")));
            done(true); setTimeout(next, 1100);
          } else {
            beep("bad");
            if (hit !== "__mis") { map.mark(hit, "bad-c"); map.name(hit, "Dit is " + byId[hit].name, "bad"); } else map.tapmark(p);
            map.mark(it.id, "focus-c"); map.name(it.id, it.name, "good");
            done(false);
            ui.panel.append(h("div", { class: "feedback bad" },
              h("span", { class: "title" }, "Net niet!"), `${it.name} ligt hier, waar het oranje knippert. `, it.feit,
              h("div", { class: "row" }, h("button", { class: "btn", onclick: next }, "Verder →"))));
          }
        };
      },

      /* 3: plek knippert, kies naam */
      kies(it, done, next) {
        const k = kind(it);
        if (k === "rug") map.showRidge(true);
        map.mark(it.id, "focus-c");
        const same = ITEMS.filter((o) => o !== it && kind(o) === kind(it));
        const nearSort = same.map((o) => ({ o, d: Math.hypot(anchor(o.id)[0] - anchor(it.id)[0], anchor(o.id)[1] - anchor(it.id)[1]) })).sort((a, b) => a.d - b.d).map((x) => x.o);
        let opts = [...nearSort.slice(0, 2), ...shuffle(nearSort.slice(2)).slice(0, 1)];
        if (opts.length < 3) opts = opts.concat(shuffle(ITEMS.filter((o) => o !== it && !opts.includes(o))).slice(0, 3 - opts.length));
        opts = shuffle([it, ...opts]);
        const box = h("div", { class: "options" });
        ui.panel.replaceChildren(h("div", { class: "prompt" }, h("div", { class: "q" }, `Hoe heet ${deze(it)}?`)), box);
        opts.forEach((o) => box.append(h("button", { class: "opt", onclick: (e) => {
          box.querySelectorAll("button").forEach((b) => (b.disabled = true));
          const ok = o === it;
          map.clear(); map.mark(it.id, ok ? "good-c" : "focus-c"); map.name(it.id, it.name, "good");
          box.children[opts.indexOf(it)].classList.add("good");
          say(it);
          if (ok) { beep("good"); done(true); setTimeout(next, 1200); }
          else {
            beep("bad"); e.currentTarget.classList.add("bad");
            if (kind(o) !== "rug") { map.mark(o.id, "bad-c"); map.name(o.id, o.name, "bad"); }
            done(false);
            ui.panel.append(h("div", { class: "feedback bad" }, h("span", { class: "title" }, `Dit is ${it.name}.`),
              `${o.name} ligt ergens anders (rood op de kaart). `, it.feit,
              h("div", { class: "row" }, h("button", { class: "btn", onclick: next }, "Verder →"))));
          }
        } }, o.name)));
      },

      /* 4: welke spelling is goed */
      speur(it, done, next) {
        if (kind(it) === "rug") map.showRidge(true);
        map.mark(it.id, "focus-c");
        const opts = shuffle([it.name, ...shuffle(it.fout).slice(0, 3)]);
        const box = h("div", { class: "options" });
        ui.panel.replaceChildren(h("div", { class: "prompt" }, h("div", { class: "q" }, `Hoe schrijf je ${deze(it)}?`), speakBtn(it)), box);
        opts.forEach((o) => box.append(h("button", { class: "opt", onclick: (e) => {
          box.querySelectorAll("button").forEach((b) => (b.disabled = true));
          const ok = o === it.name;
          box.children[opts.indexOf(it.name)].classList.add("good");
          map.clear(); map.mark(it.id, "good-c"); map.name(it.id, it.name, "good");
          if (ok) {
            beep("good"); done(true);
            ui.panel.append(h("div", { class: "feedback good" }, h("span", { class: "title" }, "✅ Goed gespeurd!"),
              h("span", { class: "spel", html: spelHTML(it) }), " – ", it.tip || ""));
            setTimeout(next, 1700);
          } else {
            beep("bad"); e.currentTarget.classList.add("bad"); done(false);
            const d = diffHTML(o, it.name);
            ui.panel.append(h("div", { class: "feedback bad" }, h("span", { class: "title" }, "Oei, daar zat een foutje in!"),
              h("div", { class: "diff", html: d.mine }), h("div", { class: "diff", html: d.good }),
              h("div", { style: "margin-top:6px" }, "✏️ ", it.tip || ""),
              h("div", { class: "row" }, h("button", { class: "btn", onclick: next }, "Verder →"))));
          }
        } }, o)));
      },

      /* 5: plek knippert, typ de naam */
      schrijf(it, done, next) {
        if (kind(it) === "rug") map.showRidge(true);
        map.mark(it.id, "focus-c");
        // Eén veld en één toetsenbord voor de hele ronde.
        if (!W) {
          const kb = keyboard("Klaar ↵");
          W = {
            q: h("div", { class: "q" }),
            input: kField("Antwoord"),
            hintBtn: h("button", { class: "btn small ghost" }, "💡 Hint"),
            hintLine: h("div", { class: "hintline hidden" }),
            fb: h("div", {}),
          };
          ui.panel.classList.add("with-kb"); ui.panel.parentNode.classList.add("kb-mode");
          ui.panel.replaceChildren(
            h("div", { class: "panel-scroll" }, h("div", { class: "prompt" }, W.q), h("div", { class: "write" }, W.input.el),
              h("div", { style: "display:flex;gap:10px;align-items:center;flex-wrap:wrap" }, W.hintBtn, W.hintLine), W.fb),
            kb.el);
        }
        const { input, hintBtn, hintLine, fb } = W;
        W.q.textContent = `Hoe heet ${deze(it)}? Schrijf het goed!`;
        input.value = ""; input.className = ""; input.readOnly = false; input.placeholder = "Typ het hier…";
        hintLine.classList.add("hidden"); hintLine.textContent = ""; hintBtn.disabled = false; fb.replaceChildren();
        let hints = 0, capsWarned = false, finished = false, phase = "ask";
        hintBtn.onclick = () => {
          hints++;
          hintLine.classList.remove("hidden");
          if (hints === 1) hintLine.textContent = it.name.split("").map((c, i) => (i === 0 ? c : c === " " || c === "-" ? c : "_")).join(" ").replace(/ {3}/g, "   ");
          else { hintLine.innerHTML = ""; hintLine.append(h("span", { class: "spel", html: spelHTML(it) })); hintBtn.disabled = true; }
          input.focus();
        };
        const submit = () => {
          if (finished) return;
          if (phase === "copy") {
            if (norm(input.value) === it.name) { finished = true; input.readOnly = true; input.className = "good"; beep("good"); setTimeout(next, 700); }
            else { input.className = "bad"; beep("bad"); setTimeout(() => (input.className = ""), 600); }
            return;
          }
          const r = check(it, input.value);
          if (r.res === "empty") return input.focus();
          if (r.res === "good") {
            finished = true; input.readOnly = true; input.className = "good"; beep("good");
            done(true, { noGain: hints > 0 });
            map.clear(); map.mark(it.id, "good-c"); map.name(it.id, it.name, "good");
            fb.replaceChildren(h("div", { class: "feedback good" }, h("span", { class: "title" }, hints ? "✅ Goed! (met hint)" : "✅ Precies goed!"),
              norm(input.value) !== it.name ? h("div", {}, "Op je blad staat het zo: ", h("b", {}, it.name)) : null));
            setTimeout(next, norm(input.value) !== it.name ? 2200 : 1200);
            return;
          }
          if ((r.res === "caps" || r.res === "space") && !capsWarned) {
            capsWarned = true; beep("bad");
            fb.replaceChildren(h("div", { class: "feedback info" }, h("span", { class: "title" }, "Bijna!"),
              (cheer(r.res), r.res === "caps") ? "Kijk nog eens naar de hoofdletters. Een naam begint altijd met een hoofdletter." : "Kijk nog eens naar de spaties en het streepje."));
            input.focus();
            return;
          }
          // fout: laat het verschil zien en laat het overtypen
          beep("bad"); done(false, r.res === "other" ? { alsoLoc: false } : {});
          map.clear(); map.mark(it.id, "focus-c"); map.name(it.id, it.name, "good");
          const d = diffHTML(norm(input.value), it.name);
          fb.replaceChildren(h("div", { class: "feedback bad" },
            h("span", { class: "title" }, r.res === "other" ? `Dat is de naam van een andere plek!` : "Nog niet goed."),
            r.res === "other" ? h("div", {}, `${r.other.name} ligt ergens anders. Deze plek heet:`) : h("div", {}, "Jij schreef:"),
            r.res === "other" ? null : h("div", { class: "diff", html: d.mine }),
            h("div", { style: "margin-top:4px" }, "Zo is het goed:"), h("div", { class: "diff", html: spelHTML(it) }),
            it.tip ? h("div", { style: "margin-top:6px" }, "✏️ ", it.tip) : null,
            h("div", { style: "margin-top:8px;font-weight:800" }, "Typ het nu goed over 👆")));
          say(it);
          phase = "copy"; input.value = ""; input.className = ""; input.placeholder = it.name; input.focus();
        };
        input.onenter = submit;
        input.focus();
      },
    };

    next();
  }

  /* ---------- 6. oefentoets ---------- */
  function toets() {
    stopSpeech();
    const ui = gameShell("📝 Oefentoets " + L.region);
    ui.dots.remove();
    ui.panel.classList.add("with-kb", "toets-panel"); ui.panel.parentNode.classList.add("kb-mode");
    const map = createMap(ui.mapbox, { ridge: false, tags: true });
    const kb = keyboard("Volgende ↵");
    const sheet = h("div", { class: "sheet" });
    const rows = [];
    let active = null, nagekeken = false;
    const groups = { rug: "Gebied", plaats: "Plaatsen", kanaal: "Kanalen" };
    let lastGroup = null;
    const teller = () => { ui.streak.textContent = `✏️ ${rows.filter((r) => norm(r.input.value)).length}/${rows.length}`; };
    function activate(row) {
      if (nagekeken) return;
      active = row;
      rows.forEach((r) => r.line.classList.toggle("active", r === row));
      map.clear(); map.mark(row.it.id, "focus-c"); map.bubble(row.it.id, row.it.nr);
      if (KB.target !== row.input) row.input.focus();
      row.line.scrollIntoView({ block: "nearest" });
    }
    function volgende() {
      const i = rows.indexOf(active);
      const leeg = rows.slice(i + 1).concat(rows.slice(0, i)).find((r) => !norm(r.input.value));
      if (leeg) return activate(leeg);
      // alles ingevuld: wijs de nakijk-knop aan
      doneBtn.scrollIntoView({ block: "nearest" }); doneBtn.classList.remove("wiggle"); void doneBtn.offsetWidth; doneBtn.classList.add("wiggle");
    }
    ITEMS.forEach((it) => { // zoals op het werkblad
      if (kind(it) !== lastGroup) { lastGroup = kind(it); sheet.append(h("div", { class: "group" }, groups[lastGroup])); }
      const input = kField("Nummer " + it.nr);
      const line = h("div", { class: "line" }, h("span", { class: "nr" }, it.nr + "."), input.el);
      const fix = h("div", { class: "fix hidden" });
      const row = { it, input, line, fix };
      input.onfocus = () => activate(row);
      input.onenter = volgende;
      input.oninput = teller;
      line.addEventListener("pointerdown", (e) => { if (!nagekeken && (e.target === line || e.target.classList.contains("nr"))) { e.preventDefault(); activate(row); } });
      rows.push(row);
      sheet.append(h("div", { class: "cell" }, line, fix));
    });
    const doneBtn = h("button", { class: "btn green", style: "margin-top:10px" }, "Klaar! Nakijken");
    sheet.append(doneBtn);
    ui.panel.append(h("div", { class: "toets-uitleg" }, "Tik een nummer aan en schrijf de naam. Let op hoofdletters!"), sheet, kb.el);
    map.onTap((p) => {
      if (nagekeken) return;
      const near = map.nearest(p, ITEMS.map((it) => it.id));
      if (near.d < map.pxToUnits(40)) activate(rows.find((r) => r.it.id === near.id));
    });
    teller();
    activate(rows[0]);

    doneBtn.onclick = () => {
      nagekeken = true; KB.target = null; kb.el.remove(); ui.streak.textContent = "";
      ui.panel.querySelector(".toets-uitleg").remove();
      let good = 0;
      const wrongs = [];
      rows.forEach(({ it, input, line, fix }) => {
        input.readOnly = true; line.classList.remove("active");
        const r = check(it, input.value);
        const ok = r.res === "good";
        line.classList.add(ok ? "good" : "bad");
        if (ok) { good++; bump(it.id, "loc", 1); bump(it.id, "spell", 1); }
        else {
          wrongs.push(it);
          bump(it.id, "spell", -1);
          if (r.res === "bad" || r.res === "other" || r.res === "empty") bump(it.id, "loc", -1);
          fix.classList.remove("hidden");
          fix.textContent = "→ " + it.name + (r.res === "caps" ? "  (let op de hoofdletter!)" : r.res === "space" ? "  (let op spatie of streepje)" : r.res === "empty" ? "  (niet ingevuld)" : "");
        }
      });
      const grade = Math.max(1, Math.round((1 + (9 * good) / rows.length) * 10) / 10).toFixed(1).replace(".", ",");
      P.tests.push({ when: new Date().toISOString(), good, total: rows.length, grade }); save();
      map.clear(); wrongs.forEach((it) => { map.mark(it.id, "bad-c"); map.name(it.id, it.name, "bad"); });
      if (good / rows.length >= 0.8) { confetti(); beep("win"); }
      cheer(good === rows.length ? "toets10" : good / rows.length >= 0.7 ? "toetsGoed" : "toetsOefen");
      doneBtn.remove();
      sheet.prepend(h("div", { class: "result", style: "padding:6px 0 14px" },
        h("div", {}, `${good} van de ${rows.length} goed`), h("div", { class: "grade" }, grade),
        h("div", {}, good === rows.length ? "Een tien! Je bent klaar voor de toets! 🏆" : good / rows.length >= 0.8 ? "Heel goed! De rode namen nog even oefenen." : "Oefen de rode namen nog met Schrijf het op en probeer het dan opnieuw."),
        eindKnoppen(toets, "Nieuwe oefentoets")));
      sheet.scrollTop = 0;
    };
  }

  if (window.SPELER.huidig()) boot(window.SPELER.huidig()); else window.SPELER.kies(boot);
})();
