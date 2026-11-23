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
- Live op https://kes.timkoppers.com (23-11): DNS-CNAME bij TransIP, certificaat `approved`,
  HTTPS verplicht (http geeft 301 naar https), les geeft 200. Overzichtspagina met voortgang per les
  en manifest voor het beginscherm.
- Certificaat bleef eerst op `null` staan. Opgelost door het custom domain te verwijderen en opnieuw
  in te stellen via de API (dat maakt twee commits op CNAME: Delete + Create).

## ONGEVERIFIEERD
- Niet getest op een echte iPad (alleen een iPad-formaat in Chromium). Spraak (nl-NL) en
  het schermtoetsenbord niet getest. Of iOS het toetsenbord echt openhoudt tussen vragen
  is alleen in Chromium nagebootst.

## GEBLOKKEERD
- Niets.

## VOLGENDE STAP
Tim test op Kes' iPad: https://kes.timkoppers.com → Deel → Zet op beginscherm, dan 'Schrijf het op'.
Nieuwe les: `cp -r topografie-drenthe topografie-<gebied>` (zie README).
