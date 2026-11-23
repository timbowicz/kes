# NEXT — Kes leert

## KLAAR
- Spel Topografie Drenthe in `topografie-drenthe/`: 6 stappen (Ontdekken, Waar ligt het?,
  Hoe heet het?, Spellingspeurder, Schrijf het op, Oefentoets). Lokaal getest met Playwright op
  820×1180 en 1180×820: tikken goed/fout, schrijven met diff en overtypen, toets nakijken
  (4/20 → cijfer 2,8), 0 console-fouten.
- Invoervelden: `autocapitalize/autocorrect/autocomplete=off`, `spellcheck=false` (gecontroleerd in de DOM).
- Repo `timbowicz/kes` (publiek), GitHub Pages op `main` /, build `built`, CNAME `kes.timkoppers.com`.
- Aanbevolen stap ('Doe dit nu') loopt niet meer vast: simulatie van een foutloze speler loopt
  ontdek > waar ×3 > speur ×3 > schrijf ×3 > toets (node-simulatie, 23-11). Schrijf het op verhoogt nu ook 'waar'.
- Schrijf het op: één invoerveld per ronde, houdt focus tussen vragen (Playwright: same=true focus=true).
- Bronvermelding CBS/PDOK + OSM zichtbaar op lespagina en overzicht.
- Werkbladfoto's (HEIC) staan in `.gitignore` en zitten niet in de repo.

## ONGEVERIFIEERD
- Niet getest op een echte iPad (alleen een iPad-formaat in Chromium). Spraak (nl-NL) en
  het schermtoetsenbord niet getest. Of iOS het toetsenbord echt openhoudt tussen vragen
  is alleen in Chromium nagebootst.
- HTTPS voor kes.timkoppers.com: kan pas nadat DNS werkt.

## GEBLOKKEERD
- DNS bij TransIP (Tim): record `kes  CNAME  timbowicz.github.io.` toevoegen.

## VOLGENDE STAP
Na de DNS-wijziging:
`dig +short kes.timkoppers.com` → moet `timbowicz.github.io.` tonen. Daarna HTTPS aanzetten:
`gh api -X PUT repos/timbowicz/kes/pages -F https_enforced=true`
(werkt pas zodra GitHub het certificaat heeft uitgegeven, meestal binnen een uur).
