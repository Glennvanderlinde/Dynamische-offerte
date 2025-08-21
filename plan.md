# Plan van Aanpak: Proof of Concept - Dynamische Offerte Renderer

**Versie:** 1.0
**Datum:** 2025-08-21
**Doel:** Het opzetten en ontwikkelen van een functionele Proof of Concept (POC) voor een dynamische offertepagina.

---

## 1. Doelstelling

Het doel van deze POC is om aan te tonen dat gestructureerde JSON-data, die een AI-analyse simuleert, succesvol kan worden gebruikt om een visueel aantrekkelijke en gepersonaliseerde HTML-offertepagina dynamisch op te bouwen. De focus ligt volledig op de client-side rendering (het "zichtbaar maken" van de data), niet op de AI-analyse zelf.

## 2. Projectstructuur

We hanteren een minimale en overzichtelijke bestandsstructuur. Maak in de root van je project de volgende vier bestanden aan:

```
/zonneplan-poc/
├── index.html       # De HTML-hoofdstructuur van de offertepagina.
├── data.json        # Bevat de gesimuleerde gestructureerde AI-output.
├── renderer.js      # De JavaScript-logica voor het inlezen en renderen van de data.
└── style.css        # De CSS voor de visuele opmaak, gebaseerd op de Zonneplan-stijl.
```

## 3. Stappenplan voor Implementatie

Dit plan wordt in vier opeenvolgende stappen uitgevoerd.

### Stap 1: Opzetten van de HTML-Basis (`index.html`)

**Taak:** Creëer een solide, semantische HTML-structuur.
-   **1.1:** Maak een standaard HTML5-boilerplate aan.
-   **1.2:** Definieer de `head` met een titel, meta-tags (viewport) en links naar `style.css` en een externe Google Font (Poppins) voor de Zonneplan-huisstijl.
-   **1.3:** Link naar het `renderer.js` script aan het einde van de `body` met het `defer` attribuut, zodat de HTML eerst wordt geladen.
-   **1.4:** Bouw de `body` op met een logische structuur: een `header` voor het logo en de titel, en een `main` sectie voor de content.
-   **1.5:** Creëer binnen de `main` sectie een "injectiepunt": een lege `<div>` met een unieke `id`, bijvoorbeeld `id="usp-container"`. Hier wordt de dynamische content later door JavaScript ingevoegd.

### Stap 2: Definiëren van de Datastructuur (`data.json`)

**Taak:** Simuleer een realistische output van de AI in een JSON-bestand.
-   **2.1:** Creëer een hoofdobject in `data.json`.
-   **2.2:** Voeg een `klantprofiel` object toe met de sleutels `profiel` en `onderbouwing`.
-   **2.3:** Voeg een `aanbevolen_usps` array toe.
-   **2.4:** Vul de array met 2 tot 4 objecten, waarbij elk object een aanbevolen USP vertegenwoordigt.
-   **2.5:** Elk USP-object moet de volgende verplichte sleutels bevatten: `key` (e.g., "USP_BATTERIJ_SLIMBESPAREN"), `redenering` (tekst), en `onderbouwing_uit_transcript` (tekst).

### Stap 3: Ontwikkelen van de Renderer-Logica (`renderer.js`)

**Taak:** Schrijf de JavaScript-code die de data ophaalt en omzet naar HTML.
-   **3.1:** Gebruik een `DOMContentLoaded` event listener om er zeker van te zijn dat het script pas wordt uitgevoerd als de HTML-pagina volledig is geladen.
-   **3.2:** Gebruik de `fetch()` API om de inhoud van `data.json` asynchroon in te lezen.
-   **3.3:** Implementeer error handling (bijv. met `try...catch`) voor het geval `data.json` niet gevonden kan worden of ongeldig is.
-   **3.4:** Na het succesvol inlezen van de data, selecteer het "injectiepunt" (`div#usp-container`) in de DOM.
-   **3.5:** Creëer een aparte functie `renderUspCards(usps)` die een array van USP-objecten accepteert.
-   **3.6:** Binnen deze functie, definieer een lokaal 'database' object dat `USP_KEY`'s koppelt aan hun statische titels. Dit scheidt dynamische data van statische content.
-   **3.7:** Loop (bijv. met `.map()`) door de USP-array en genereer voor elk item een HTML-string voor een "USP-kaart".
-   **3.8:** Voeg de gegenereerde HTML-strings samen en injecteer het resultaat in de `innerHTML` van de `div#usp-container`.

### Stap 4: Toepassen van de Styling (`style.css`)

**Taak:** Maak de pagina visueel identiek aan het Zonneplan-offertedesign.
-   **4.1:** Stel de basisstijlen in voor `body`: achtergrondkleur, lettertype (Poppins), en tekstkleur.
-   **4.2:** Style de algemene layout (`.zp-container`, `.zp-header`) voor de juiste marges, padding en positionering.
-   **4.3:** Definieer de typografie voor de titels (`h1`, `h2`) en de introductietekst.
-   **4.4:** Gebruik CSS Grid (`display: grid`) op de `#usp-container` om de USP-kaarten netjes in een responsive raster (e.g., 2 kolommen op desktop, 1 op mobiel) te plaatsen.
-   **4.5:** Style de `.usp-card` klasse: achtergrond, padding, border-radius, border, en box-shadow voor een 'zwevend' effect. Voeg een subtiel hover-effect toe.
-   **4.6:** Style de elementen binnen de kaart: de titel (`h3`), de redenering (`p.redenering`) en het citaat (`blockquote.onderbouwing`), waarbij het citaat een afwijkende achtergrond en een gekleurde linker-border krijgt.
-   **4.7:** Voeg een media query toe voor schermen kleiner dan 768px om de grid-layout naar één kolom aan te passen.

## 4. Testprocedure

-   **Vereiste:** Gebruik een lokale webserver (zoals de "Live Server" extensie in VSCode/Cursor) om het project te draaien. Dit is noodzakelijk omdat de `fetch()` API niet werkt via het `file://` protocol.
-   **Succescriteria:**
    1.  De `index.html` pagina laadt zonder fouten in de console.
    2.  De pagina toont de statische header en introductietekst.
    3.  De sectie voor USP's is dynamisch gevuld met kaarten die corresponderen met de data in `data.json`.
    4.  Alle styling wordt correct toegepast en de pagina is responsive.