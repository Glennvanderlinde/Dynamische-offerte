document.addEventListener('DOMContentLoaded', async () => {
  // Inject minimal styles including a small dataset switcher
  const style = document.createElement('style');
  style.textContent = `
    .ai-offer-card{position:fixed;right:24px;top:160px;max-width:420px;background:#fff;color:#111;border:1px solid #e6e9ef;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.08);padding:16px;z-index:9998;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
    .ai-product-title{margin:0 0 12px 0;font-weight:700;font-size:20px}
    .ai-offer-usp-list{margin:0 0 12px 18px}
    .ai-offer-usp-list li{margin:6px 0}
    .ai-usp-list-full{list-style:none;margin:0;padding:0;display:grid;gap:12px}
    .ai-usp-item{border:1px solid #eef1f6;border-radius:10px;padding:10px;background:#f9fbff}
    .ai-usp-title{font-weight:600;margin:0 0 6px 0}
    .ai-usp-voordeel{margin:0 0 4px 0;color:#334}
    .ai-usp-doorvertaling{margin:0;color:#00794a;font-weight:700}
    .ai-dataset{position:fixed;right:24px;top:110px;z-index:9999;display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #e6e9ef;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.08);padding:8px 10px}
    .ai-dataset select{border:1px solid #e6e9ef;border-radius:8px;padding:6px 8px}
    .ai-dataset input[type=file]{display:none}
    .ai-dataset .btn{background:#00aa65;color:#042814;border:0;border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer}
  `;
  document.head.appendChild(style);

  const uspMap = await fetch('./usps-map.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : {});

  async function renderForUrl(datasetUrl){
    try{
      const data = await fetch(datasetUrl, { cache: 'no-store' }).then(r => r.ok ? r.json() : null);
      if (!data) return;
      const usps = findRecommendedUsps(data).slice(0, 4);
      const bullets = usps.map((u) => {
        const m = uspMap[u.key] || {};
        const feit = m.title || m.feit || '';
        return feit ? `<li class="ai-bullet">${escapeHtml(feit)}</li>` : '';
      }).join('');
      const voordeelBlocks = usps.map((u) => {
        const m = uspMap[u.key] || {};
        const title = m.title || m.feit || '';
        const voordeel = m.voordeel || '';
        const doorvertaling = m.doorvertaling || '';
        return `
          <li class="ai-usp-item">
            <div class="ai-usp-title">${escapeHtml(title)}</div>
            ${voordeel ? `<div class="ai-usp-voordeel">${escapeHtml(voordeel)}</div>` : ''}
            ${doorvertaling ? `<div class="ai-usp-doorvertaling">${escapeHtml(doorvertaling)}</div>` : ''}
          </li>
        `;
      }).join('');

      // Try to inject into existing right-side card (clone of real offer)
      const offerCardTitle = findH2Containing(['thuisbatterij','Nexus']);
      const offerCard = offerCardTitle ? offerCardTitle.closest('div') : null;
      const existingList = offerCard ? offerCard.querySelector('ul, ol') : null;
      // Remove previous detailed list if present
      document.querySelectorAll('.ai-usp-list-full').forEach(n=>n.remove());
      if (existingList) {
        existingList.innerHTML = bullets;
        const fullList = document.createElement('ul');
        fullList.className = 'ai-usp-list-full';
        fullList.innerHTML = voordeelBlocks;
        offerCard.appendChild(fullList);
      } else {
        let card = document.querySelector('.ai-offer-card');
        if (!card){
          card = document.createElement('div');
          card.className = 'ai-offer-card';
          const anchor = document.querySelector('h1, [data-page], #app');
          if (anchor && anchor.parentElement) anchor.parentElement.appendChild(card); else document.body.appendChild(card);
        }
        card.innerHTML = `
          <h2 class="ai-product-title">Nexus 20 kWh thuisbatterij</h2>
          <ul class="ai-offer-usp-list">${bullets}</ul>
          <ul class="ai-usp-list-full">${voordeelBlocks}</ul>
        `;
      }
    }catch(e){ console.error('USP inject error', e); }
  }

  // Dataset switcher UI (samples + upload)
  const ds = document.createElement('div');
  ds.className = 'ai-dataset';
  ds.innerHTML = `
    <label>Dataset</label>
    <select id="ai-dataset-select">
      <option value="./samples/sample1.json">Sample 1</option>
      <option value="./samples/sample2.json">Sample 2</option>
      <option value="./samples/sample3.json">Sample 3</option>
    </select>
    <label class="btn" for="ai-upload-json">Upload</label>
    <input id="ai-upload-json" type="file" accept="application/json" />
  `;
  document.body.appendChild(ds);

  const selectEl = ds.querySelector('#ai-dataset-select');
  const uploadEl = ds.querySelector('#ai-upload-json');
  selectEl.addEventListener('change', () => renderForUrl(selectEl.value));
  uploadEl.addEventListener('change', async () => {
    const f = uploadEl.files && uploadEl.files[0];
    if (!f) return;
    try { const j = JSON.parse(await f.text());
      // Render from object by creating a blob URL
      const url = URL.createObjectURL(new Blob([JSON.stringify(j)], { type: 'application/json' }));
      renderForUrl(url);
    } catch(e){ console.error(e); }
  });

  const initial = getDatasetFromHash() || './samples/sample1.json';
  renderForUrl(initial);

  function getDatasetFromHash() {
    try {
      const m = location.hash.match(/sample=([^&]+)/);
      if (!m) return null;
      const idx = decodeURIComponent(m[1]);
      if (idx === '1') return './samples/sample1.json';
      if (idx === '2') return './samples/sample2.json';
      if (idx === '3') return './samples/sample3.json';
      return decodeURIComponent(idx);
    } catch { return null; }
  }

  function findRecommendedUsps(data) {
    const arrays = [
      data.stap_4_aanbevolen_usps,
      data.stap_3_aanbevolen_usps,
      data.aanbevolen_usps,
      data.stap_4_usps,
      data.stap_3_usps,
      data.usps
    ].filter(Array.isArray);
    Object.keys(data || {}).forEach(k => {
      const v = data[k];
      if (Array.isArray(v) && v.every(x => x && typeof x === 'object' && 'key' in x)) arrays.push(v);
    });
    const first = arrays.find(a => a.length) || [];
    return first.filter(u => u && typeof u.key === 'string');
  }

  function findH2Containing(keywords) {
    const h2s = Array.from(document.querySelectorAll('h2'));
    return h2s.find(h => keywords.every(k => (h.textContent||'').toLowerCase().includes(k.toLowerCase())) ) || null;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
});


