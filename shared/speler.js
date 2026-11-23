/* Spelers op dit apparaat. Elke speler heeft eigen voortgang (localStorage).
   window.SPELER.huidig()  -> naam of null
   window.SPELER.kies(cb)  -> toont "Wie speelt er?" in #app en roept cb(naam) aan */
(function () {
  "use strict";
  const K_LIJST = "kes:spelers", K_NU = "kes:speler";
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  function lijst() { try { return JSON.parse(get(K_LIJST)) || []; } catch (e) { return []; } }
  function huidig() { const n = get(K_NU); return n && lijst().includes(n) ? n : null; }
  function zet(naam) {
    const l = lijst();
    if (!l.includes(naam)) {
      // Voortgang van vóór de spelerskeuze gaat naar de eerste speler
      if (!l.length) {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (/^kes:[a-z0-9-]+$/.test(k) && k !== K_LIJST && k !== K_NU) {
              set(k + ":" + naam.toLowerCase(), localStorage.getItem(k));
              localStorage.removeItem(k);
            }
          }
        } catch (e) {}
      }
      l.push(naam); set(K_LIJST, JSON.stringify(l));
    }
    set(K_NU, naam);
  }
  function sleutel(lesId) { const n = huidig(); return "kes:" + lesId + ":" + (n || "gast").toLowerCase(); }

  function kies(cb, host) {
    host = host || document.getElementById("app");
    const el = (t, a, ...k) => { const e = document.createElement(t); Object.entries(a || {}).forEach(([x, v]) => x.startsWith("on") ? e.addEventListener(x.slice(2), v) : x === "class" ? (e.className = v) : e.setAttribute(x, v)); k.forEach((c) => e.append(c)); return e; };
    const input = el("input", { type: "text", placeholder: "Je naam", autocomplete: "off", autocorrect: "off", spellcheck: "false", maxlength: "20", "aria-label": "Je naam", "data-1p-ignore": "true", "data-lpignore": "true", "data-form-type": "other" });
    const go = () => {
      const n = input.value.trim().replace(/\s+/g, " ");
      if (!n) return input.focus();
      const naam = n.charAt(0).toUpperCase() + n.slice(1);
      zet(naam); cb(naam);
    };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
    const l = lijst();
    host.replaceChildren(el("div", { class: "wrap who" },
      el("div", { class: "who-card" },
        el("div", { class: "who-emoji" }, "👋"),
        el("h1", {}, "Wie speelt er?"),
        l.length ? el("div", { class: "who-list" }, ...l.map((n) => el("button", { class: "btn who-btn", onclick: () => { zet(n); cb(n); } }, n))) : "",
        el("p", {}, l.length ? "Of typ een nieuwe naam:" : "Typ je naam, dan onthouden we wat jij al kunt."),
        el("div", { class: "write" }, input, el("button", { class: "btn green", onclick: go }, "Start")))));
    if (!l.length) setTimeout(() => input.focus(), 50);
  }
  window.SPELER = { huidig, kies, sleutel, lijst };
})();
