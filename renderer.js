document.addEventListener('DOMContentLoaded', async () => {
  const klantprofielEl = document.getElementById('klantprofiel');
  const uspContainerEl = document.getElementById('usp-container');
  const ubrsExplicitEl = document.getElementById('ubrs-explicit-container');
  const ubrsImplicitEl = document.getElementById('ubrs-implicit-container');
  const datasetSelect = document.getElementById('dataset-select');
  const uploadInput = document.getElementById('upload-json');

  function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstElementChild;
  }

  function renderError(message) {
    const el = createElementFromHTML(`<div class="error">${message}</div>`);
    document.body.prepend(el);
  }

  async function loadAndRenderFromUrl(url) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Kan ${url} niet laden (${response.status})`);
      const raw = await response.json();
      await render(raw);
    } catch (err) {
      renderError(`Fout: ${(err && err.message) || err}`);
      console.error(err);
    }
  }

  async function render(raw) {
    const data = raw && raw.schema && raw.schema.properties ? null : raw;
    if (!data) {
      if (klantprofielEl) klantprofielEl.innerHTML = `<p class="muted">Geen voorbeelddata gevonden. Kies een sample in de selector of upload een JSON met <code>stap_1_klantprofiel</code>, <code>stap_2_expliciete_ubrs</code>, <code>stap_3_impliciete_ubrs</code>, <code>stap_4_aanbevolen_usps</code>.</p>`;
      if (uspContainerEl) uspContainerEl.innerHTML = '';
      if (ubrsExplicitEl) ubrsExplicitEl.innerHTML = '';
      if (ubrsImplicitEl) ubrsImplicitEl.innerHTML = '';
      return;
    }

    // Render klantprofiel
    const profiel = data.stap_1_klantprofiel;
    if (klantprofielEl) {
      klantprofielEl.innerHTML = profiel ? `
        <div class="card klantprofiel-card">
          <h3>${escapeHtml(profiel.profiel ?? 'Onbekend profiel')}</h3>
          <p>${escapeHtml(profiel.onderbouwing ?? '')}</p>
        </div>
      ` : '<p class="muted">Geen klantprofiel gevonden</p>';
    }

    // Render USP kaarten + offer bullets
    const uspsAll = findRecommendedUsps(data);
    const usps = uspsAll.slice(0, 4); // max 4
    if (uspContainerEl) {
      uspContainerEl.innerHTML = usps.length ? usps.map(renderUspCard).join('') : '<p class="muted">Geen USP\'s</p>';
    }

    // FEIT bullets are now reserved for specs; detailed USP blocks rendered below

    // Populate detailed FEIT/VOORDEEL/DOORVERTALING blocks
    const detailsEl = document.getElementById('usp-details');
    if (detailsEl) {
      await populateUspDetails(detailsEl, usps);
    }

    // Render UBR lijsten
    const explicieteUbrs = Array.isArray(data.stap_2_expliciete_ubrs) ? data.stap_2_expliciete_ubrs : [];
    const implicieteUbrs = Array.isArray(data.stap_3_impliciete_ubrs) ? data.stap_3_impliciete_ubrs : [];
    if (ubrsExplicitEl) ubrsExplicitEl.innerHTML = renderUbrList(explicieteUbrs);
    if (ubrsImplicitEl) ubrsImplicitEl.innerHTML = renderUbrList(implicieteUbrs);
  }

  // Init: laad default
  await loadAndRenderFromUrl('./Structured_output.json');

  // Veranderen via selector
  datasetSelect?.addEventListener('change', (e) => {
    const value = e.target.value;
    loadAndRenderFromUrl(value);
  });

  // Upload ondersteuning
  uploadInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      // Neem het eerste bestand direct in en render
      const first = files[0];
      const text = await first.text();
      const json = JSON.parse(text);
      await render(json);
    } catch (err) {
      renderError(`Kon geüploade JSON niet lezen: ${(err && err.message) || err}`);
    }
  });

  const uspMapPromise = fetch('./usps-map.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : {})
    .catch(() => ({}));

  async function renderUspCardAsync(usp) {
    const uspMap = await uspMapPromise;
    const uspTitles = {
      USP_BATTERIJ_SLIMBESPAREN: 'Slim besparen met dynamische energie',
      USP_BATTERIJ_COMPACT: 'Compacte, modulaire batterij',
      USP_BATTERIJ_NULGEDOE: 'Zonder gedoe, wij regelen het',
      USP_BATTERIJ_ZONNESTROOM: 'Maximaal eigen zonnestroom benutten',
      USP_BATTERIJ_TERUGLEVERKOSTEN: 'Minder terugleverkosten',
      USP_BATTERIJ_TOEKOMSTKLAAR: 'Toekomstklaar systeem',
      USP_BATTERIJ_SLIMMEINVESTERING: 'Slimme investering',
      USP_BATTERIJ_EXTRAINKOMSTEN: 'Extra inkomsten met arbitrage',
      USP_BATTERIJ_SLIMSTEAANSTURING: 'Slimste aansturing via app',
      USP_BATTERIJ_LANGETERMIJN: 'Duurzaam voor de lange termijn',
      USP_BATTERIJ_KRACHTIGLAADVERMOGEN: 'Krachtig laad-/ontlaadvermogen',
      USP_BATTERIJ_MEERRENDEMENT: 'Meer rendement uit je installatie',
      USP_BATTERIJ_INZICHTAPP: 'Volledig inzicht in de app',
      USP_BATTERIJ_NOODSTROOM: 'Noodstroomoptie',
      USP_BATTERIJ_DESIGN: 'Strak design',
      USP_VEILIGHEID_LIFEPO4: 'Veilige LiFePO4-technologie',
      USP_VEILIGHEID_BRANDVEILIG: 'Brandveilige oplossing',
      USP_SERVICE_TOPSERVICE: 'Topservice inbegrepen',
      USP_SERVICE_ACHTERAFBETALEN: 'Achteraf betalen mogelijk',
      USP_SERVICE_BTWTERUGGAVE: 'BTW-teruggave geregeld'
    };

    const mapped = uspMap[usp.key] || {};
    const title = mapped.title || mapped.feit || uspTitles[usp.key] || usp.key;
    const voordeel = mapped.voordeel || mapped.description || '';
    const doorvertaling = mapped.doorvertaling || '';

    return `
      <article class="card usp-card">
        <h3>${escapeHtml(title)}</h3>
        ${voordeel ? `<p class="feit">${escapeHtml(voordeel)}</p>` : ''}
        ${doorvertaling ? `<p class="doorvertaling">${escapeHtml(doorvertaling)}</p>` : ''}
      </article>
    `;
  }

  function renderUspCard(usp) {
    // Sync wrapper for map-aware async card rendering
    // We'll render placeholders and then hydrate
    const placeholder = document.createElement('div');
    placeholder.innerHTML = `<article class="card usp-card">Laden...</article>`;
    const indexMarker = Math.random().toString(36).slice(2);
    placeholder.firstElementChild.setAttribute('data-marker', indexMarker);
    // Fire and replace asynchronously
    renderUspCardAsync(usp).then(html => {
      const target = document.querySelector(`article.usp-card[data-marker="${indexMarker}"]`);
      if (target && target.parentElement) {
        target.outerHTML = html;
      }
    });
    return placeholder.innerHTML;
  }

  function renderUbrList(ubrs) {
    if (!ubrs.length) return '<p class="muted">Geen items</p>';
    return `
      <ul class="ubr-items">
        ${ubrs.map(u => `
          <li class="ubr-item">
            <div class="ubr">${escapeHtml(u.ubr || '')}</div>
            <blockquote class="onderbouwing">${escapeHtml(u.onderbouwing_uit_transcript || '')}</blockquote>
          </li>
        `).join('')}
      </ul>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function findRecommendedUsps(data) {
    // Ondersteun meerdere mogelijke paden en semantische herkenning
    const candidateArrays = [];
    const directCandidates = [
      data.stap_4_aanbevolen_usps,
      data.stap_3_aanbevolen_usps,
      data.aanbevolen_usps,
      data.stap_4_usps,
      data.stap_3_usps,
      data.usps
    ].filter(Array.isArray);
    candidateArrays.push(...directCandidates);

    // Fallback: scan alle properties naar arrays met objecten die een 'key' bevatten
    Object.keys(data || {}).forEach((k) => {
      const v = data[k];
      if (Array.isArray(v) && v.every((x) => x && typeof x === 'object' && 'key' in x)) {
        candidateArrays.push(v);
      }
    });

    const first = candidateArrays.find((arr) => arr.length);
    if (!first) return [];

    // Filter op geldige entries met 'key' string
    const cleaned = first.filter((u) => u && typeof u.key === 'string' && u.key.trim().length > 0);

    // Min 2, max 4: als minder dan 2, toon wat er is; als meer, knip later op 4
    return cleaned;
  }

  async function populateOfferList(listEl, usps) {
    const uspMap = await uspMapPromise;
    listEl.innerHTML = usps.map((u) => {
      const mapped = uspMap[u.key] || {};
      const feit = mapped.title || mapped.feit || '';
      return feit ? `<li>${escapeHtml(feit)}</li>` : '';
    }).join('');
  }

  async function populateUspDetails(containerEl, usps) {
    const uspMap = await uspMapPromise;
    containerEl.innerHTML = usps.map((u) => {
      const m = uspMap[u.key] || {};
      const title = m.title || m.feit || '';
      const voordeel = m.voordeel || '';
      const doorvertaling = m.doorvertaling || '';
      if (!title && !voordeel && !doorvertaling) return '';
      return `
        <div class="usp-block">
          ${title ? `<div class="title">${escapeHtml(title)}</div>` : ''}
          ${voordeel ? `<div class="voordeel">${escapeHtml(voordeel)}</div>` : ''}
          ${doorvertaling ? `<div class="doorvertaling">${escapeHtml(doorvertaling)}</div>` : ''}
        </div>
      `;
    }).join('');
  }
});


