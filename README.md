# Kes leert

Oefenspellen voor het huiswerk en de toetsen van Kes. Live op https://kes.timkoppers.com
(GitHub Pages, statisch, geen build-stap).

## Structuur
- `index.html`: overzicht van alle lessen.
- `shared/`: gedeelde stijl (`kes.css`), topografie-engine (`topo.js`), icoon.
- `topografie-drenthe/`: één les. `data.js` = inhoud (namen, spelling, tips, feitjes),
  `map.js` = kaart (gegenereerd), `index.html` laadt alles.

## Nieuwe topografie-les
1. Kopieer `topografie-drenthe/` naar `topografie-<gebied>/`.
2. Pas `tools/build_map.py` aan (uitsnede, provincies, plaatsen, kanalen) en draai het.
   Ruwe data in `tools/raw/`: provincies via PDOK (CBS), kanalen via Overpass (OSM).
3. Vul `data.js` met de namen van het werkblad (spelling van het werkblad aanhouden).
4. Voeg een kaartje toe in `index.html`.

Voortgang staat in `localStorage` op het apparaat zelf. Geen accounts, geen tracking.

Kaartdata: © CBS/PDOK (CC-BY), © OpenStreetMap-bijdragers (ODbL).
