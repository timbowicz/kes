# NEXT — Kes leert

## Sessie 25-11-2026 middag: feedback Tim (iPad, screenshots IMG_0728-0730, niet in repo)

### KLAAR (Playwright Chromium, file://, 0 page-errors)
- **Ontdekken:** de lijst toont alleen nog wat open staat, per soort ("Kanalen: de blauwe lijnen", "Gebied: de bruine strook").
  Alle plaatsen gehad → doelkaart oranje: "Alle plaatsen gehad! Nu nog 3 kanalen (blauwe lijnen) en de Hondsrug (bruine strook)."
  Verder-knop noemt wat er mist. Onbekeken Hondsrug heeft een gele streepjesband. Hondsrug op 6/10 punten langs de strook
  aan te tikken (de andere 4: Zuidlaren/Gieten/Borger/Emmen winnen, zoals bedoeld).
- **Audio:** `stopSpeech()` in `volgendeOpdracht()` en `startSessie()`. Gemeten: bij 'Volgende opdracht' 1× pause, daarna `volgende-1.mp3`.
- **Waar ligt het (en andere rondes, toets):** Hondsrug altijd vaag zichtbaar (`g.faint`, opacity 0.18) i.p.v. verborgen.
- **Schrijf het op:** na een fout staat bovenaan "❌ Nog niet goed. Zo is het goed. Typ het over:", dan het goede woord,
  dan meteen het invulveld; "Jij schreef" + tip eronder. Hint-knop verborgen tijdens overtypen. Kaart zoomt in op de plek.
  Gemeten 1180×400 met kb-open, Verlengde Hoogeveensevaart: invulveld onderkant 192px, paneel tot 378px.
- **Zoomen:** knijpen zoomt de kaart zelf (viewBox), schuiven met één vinger als je ingezoomd bent, knop "⤢ Hele kaart".
  Paginazoom geblokkeerd (`gesturestart` preventDefault, `maximum-scale=1`, `touch-action:none` op de kaart).
  `volgZichtbaarDeel` doet niets als `visualViewport.scale ≠ 1` (oorzaak van het witte scherm op IMG_0730).
  Gemeten met CDP-touch: viewBox 901→225 breed, geen per-ongeluk-tik, daarna tik op Assen → Assen, reset terug naar origineel.
- Cache-versie `v=202611251700` in beide index.html.

### ONGEVERIFIEERD
- **Niets op een echte iPad.** Of iOS-Safari met `gesturestart`-blokkade echt niet meer de pagina zoomt; of knijpen op de kaart
  soepel loopt; of het overtyp-scherm met het echte toetsenbord past (in Chromium alleen nagebootst met een lager venster).

### VOLGENDE STAP
Tim test op de iPad. `cd /Users/timbo/Projects/kes && git log --oneline -3`

## Sessie 25-11-2026: toets/schrijven met iPad-toetsenbord (n.a.v. foto Tim 24-11)

### Probleem (foto)
Oefentoets, iPad liggend: het iOS-toetsenbord duwde de pagina omhoog, waardoor de kaart deels onder de statusbalk viel en klein werd.
Bij wisselen van veld was niet duidelijk welk nummer je invulde.

### Besluit
Eerst een eigen toetsenbord in de app gebouwd (commit f53d69c). Tim wil dat **niet**: het standaardtoetsenbord van iOS/Android
is herkenbaar. Dat is teruggedraaid. Er staan weer echte `<input>`s in, via `kField()` in topo.js.
**Geen eigen toetsenbord meer voorstellen.**

### KLAAR (Playwright Chromium, file://, 0 page-errors)
- Spelschermen (`.game`) volgen het zichtbare deel: `position: fixed; top: var(--vv-top); height: var(--vv-h)`, gezet vanuit
  `visualViewport` (resize/scroll). Komt het toetsenbord op, dan krimpen kaart en lijst mee in plaats van weg te schuiven.
  `html.kb-open` (zichtbaar deel >120px kleiner dan het maximum) maakt de kop compacter en verbergt de uitlegregel van de toets.
- Oefentoets in dat scherm: de kaart links, de lijst rechts die op zichzelf scrollt. De actieve regel krijgt een oranje rand,
  op de kaart staat een groot oranje bolletje met het nummer, en via een kaartnummer tikken kies je die regel.
  Enter gaat naar het volgende lege veld. Is alles ingevuld, dan gaat het toetsenbord weg en wiebelt 'Nakijken'. Teller ✏️ x/20.
- Kaart zoomt in op Drenthe plus alle plekken (viewBox), in alle oefeningen.
  Drenthe-breedte, toets 1180×820: 453→632px. Met een gesimuleerd toetsenbord (1180×430) blijft de kaart helemaal in beeld: Drenthe 328px.
- Na de zoom opnieuw getest: tikvoorrang in Ontdekken 0 fouten, 'Waar ligt het' 10/10 goed. Toets volledig ingevuld → 10,0.
- Foto's niet publiek: `git ls-files | grep -i heic` leeg, live IMG_0694.HEIC → 404.

### ONGEVERIFIEERD
- **Niet getest op een echte iPad.** Chromium kent geen schermtoetsenbord, daar is het alleen nagebootst door het venster lager te maken.
  Na te lopen: of iOS-Safari de pagina toch nog verschuift (`--vv-top`), of het toetsenbord openblijft bij Enter naar het volgende veld,
  en of het lukt om een kaartnummer aan te tikken terwijl het toetsenbord open is.
- Wat ouder: iOS-audio-ontgrendeling, sessieKlaar na 15 min, beginscherm-app.

### VOLGENDE STAP
Tims reactie van de iPad afwachten. `cd /Users/timbo/Projects/kes && git log --oneline -3`

## Sessie 23-11-2026 (handoff, context 40%)

### KLAAR
- Live op https://kes.timkoppers.com, laatste commit op `main` = "Telefoon: kaart met vaste hoogte…"
  (`git log --oneline -1`), Pages-build `built`, live HTML bevat `kes.css?v=202611231228`.
- HTTPS: certificaat `approved`, `https_enforced=true`, `curl http://kes.timkoppers.com/` → 301 naar https.
- Les Topografie Drenthe: 6 oefeningen + 'Jouw kwartiertje' (plan van 3-4 opdrachten, ±13-15 min) +
  'Of kies zelf'. Playwright: volledig kwartiertje doorlopen tot 'Je kwartiertje zit erop!', 0 console-fouten.
- Spelerskeuze ('Wie speelt er?'): naam alleen in tekst, voortgang per speler in localStorage
  (`kes:<les>:<naam>`); oude voortgang migreert naar de eerste speler. Site bevat nergens 'Kes' meer
  (grep op index.html, shared/, topografie-drenthe/ leeg).
- Ontdekken: gele doelkaart + voortgangsbalk + gesproken intro; kaart toont groen ✓ (bekeken) / gele ring (nog niet).
- Audio Eleven v4 (Dex), live: `curl …/topografie-drenthe/audio/item-hondsrug.mp3` → 200,
  `…/shared/audio/ontdekIntro-1.mp3` → 200. Tim: "dit is veel beter".
- Telefoon (<700px): kaart vaste hoogte (342px op 390×844 gemeten), Ontdekken kaart bovenaan;
  iPad-layout ongewijzigd (1180×820: kaart 708×744).
- 'gekend' vervangen door 'Je kent er al X van de 20' / 'X van 20 ken je al' (live gecontroleerd met curl/grep).

- Plaatsen gaan voor kanalen bij tikken (Ontdekken): binnen 30px van een stip wint de plaats.
  Playwright: Hoogeveen, Eelde, Assen, Klazienaveen, Smilde, Meppel op 0/10/20px richting kanaal → plaats; kanalen elders nog tikbaar. Tim (23-11): werkt op de iPad.

### ONGEVERIFIEERD
- **Niets getest op een echte iPad of iPhone.** Alleen Chromium op die schermformaten.
  (Toetsenbord-/1Password-punten vervallen: zie sessie 25-11.)
- sessieKlaar na 15 minuten (afbreken op tijd) niet getest, alleen afronden na alle opdrachten.
- Uitspraak van de gecorrigeerde feitjes (17 nieuwe 'feit-'-opnames) niet door Tim beluisterd.

### GEBLOKKEERD
- Niets.

### VOLGENDE STAP
Wachten op Tims feedback van de iPad/iPhone. Eerste commando in de nieuwe sessie:
`cd /Users/timbo/Projects/kes && git status --short && git log --oneline -5`

### Verzoeken (op volgorde)
1. Interactieve game topografie Drenthe voor Kes (9), didactisch goed, waar ligt het + correcte spelling — klaar.
2. Online op subdomein kes.timkoppers.com (/topografie-drenthe) — klaar.
3. Overzichtspagina op kes.timkoppers.com met alle huiswerkopdrachten — klaar.
4. Invulveld breder, knop eronder — klaar.
5. ElevenLabs i.p.v. robotstem; audio-feitjes en positieve feedback — klaar (stem Dex, v4).
6. Lesmenu minder overweldigend: duidelijk waar je begint, checklist/route — klaar.
7. Naamneutraal (vriendje kan ook spelen), naam vooraf invullen, alleen tekstueel terugzien, audio zonder namen — klaar.
8. 'Kwartiertje': sessie van 15 min die 3-4 opdrachten voorzegt — klaar.
9. Naam en zin klinken verschillend; v4 gebruiken — klaar (naam wordt uit dezelfde opname geknipt).
10. Ontdekken: doel (alle 20 aantikken) duidelijk + intro; geen dubbele plaatsnaam vóór het feitje — klaar.
11. Visueel tonen welke plekken al aangeklikt zijn — klaar.
12. 'gekend' onduidelijk — klaar.
13. Werkt niet op iPhone (kaart onzichtbaar): laten werken of alleen tablet/computer — klaar (werkt nu op telefoon).

### Regels van Tim
- Didactiek is het belangrijkst; spelling zoals op het werkblad.
- Naamneutraal: de spelersnaam alleen in tekst, nooit in audio. Niet 'Kes' hardcoden.
- Een kwartiertje is genoeg; het spel moet voorzeggen wat je doet.
- Werkbladfoto's (Kes' naam/handschrift) nooit committen/publiceren.
- DNS-wijzigingen doet Tim zelf (TransIP).

### Opgeloste fouten
- PDOK-ring vereenvoudigen: gesloten ring viel in Douglas-Peucker samen → ring in twee helften splitsen (`tools/build_map.py`).
- Overpass 406/502: User-Agent meegeven; Niedersachsen-query te zwaar → alleen kanalen opvragen.
- Nominatim gaf gemeentecentrum voor Emmen en Coevorden → handmatig op de kern gezet.
- GitHub Pages-certificaat bleef `null` → custom domain via API op null en opnieuw zetten (maakt 2 commits op CNAME; daarna `git pull`).
- ElevenLabs-MCP schrijft alleen in bestaande mappen; `speech_to_text` mag alleen in een medu-game-dev-map lezen (niet gebruikt).
- Bibliotheekstem moet eerst aan het account toegevoegd (Tim deed dat in de web-UI).
- Browsercache hield oude CSS vast → `?v=<versie>` achter css/js; ophogen bij elke wijziging (commando in README).
- `append(null)` toonde de tekst 'null' → array filteren.
- `localhost`-server met `&` werd soms geblokkeerd → `run_in_background` gebruiken.

### Overgedragen data
- Repo: `timbowicz/kes` (publiek, GitHub Pages vanaf `main` /). Domein-DNS bij TransIP: `kes CNAME timbowicz.github.io.`
- ElevenLabs: stem **Dex - Energetic Dutch Commercial, TVHost**, voice id `SpRzmdV0YTgetjcWNbpH`, model `eleven_v4`,
  stability 0.5, style 0.2, via de ElevenLabs-MCP (Tims creator-account, ~113k tekens over begin sessie).
  Niet de Medu/Inzaken-keys uit 1Password gebruiken voor dit privéproject.
- Audio-indeling: `topografie-drenthe/audio/item-<id>.mp3` (Ontdekken), `naam-<id>.mp3` (geknipt);
  `shared/audio/<key>-<n>.mp3`, keys in `LINES` in `shared/topo.js`. Bron in `tools/audio-v4/{item,feit,zin}-*` (niet in git).
- Kwartiertje-plannen: `PLANNEN` en `MINUTEN` in `shared/topo.js`; aanbeveling via `advice()`.
- Kaartbronnen: PDOK WFS `cbs/gebiedsindelingen/2023` provincie_gegeneraliseerd; kanalen via Overpass; ruwe data in `tools/raw/` (niet in git).

### Eerst openen
- `shared/topo.js` — de hele engine (kaart, modi, kwartiertje, audio).
- `shared/kes.css` — layout incl. telefoon-media-query onderaan.
- `shared/speler.js` — spelerskeuze en localStorage-sleutels.
- `topografie-drenthe/data.js` — namen, spelling, tips, feitjes.
- `topografie-drenthe/index.html` — laadt alles met `?v=`.
- `index.html` — overzichtspagina met voortgang per les.
- `tools/build_map.py` — kaart genereren voor een nieuwe les.
- `tools/split_audio.py` — audio op zijn plek zetten.
- `README.md` — nieuwe les toevoegen + versie ophogen.

---

## Eerdere stand (zelfde dag, ochtend)
- Aanbevolen stap loopt niet vast (node-simulatie: ontdek > waar ×3 > speur ×3 > schrijf ×3 > toets).
- Invoervelden zonder autocorrectie/hoofdletters (DOM gecontroleerd). Bronvermelding CBS/PDOK + OSM zichtbaar.

## 23-11-2026 (4476fa8)
- KLAAR: Ontdekken-namenlijst is geen knop meer (span), plekken alleen via de kaart.
- ONGEVERIFIEERD: Safari-autofill (voornaam) weg? Invulvelden hebben nu `name="search-…"` en geen "naam" in placeholder/aria-label. Testen in Safari op Mac + iPad bij Schrijven, Toets en het naamveld.
