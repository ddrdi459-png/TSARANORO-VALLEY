(() => {
  const sb = window.tsaranoroAdmin;
  const $ = id => document.getElementById(id);
  if (!sb) return;
  let hotelFiles = [];

  const esc = s => String(s ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));

  function ensureManager() {
    const form = $('hotelForm');
    if (!form || $('hotelFileManager')) return;
    const box = document.createElement('div');
    box.id = 'hotelFileManager';
    box.className = 'editor';
    box.style.marginTop = '14px';
    box.innerHTML = `
      <h3>📁 Gestion des fichiers</h3>
      <p class="admin-note">Ajoutez plusieurs photos à cet hébergement. Vous pourrez les voir, supprimer et définir la première comme image principale.</p>
      <label class="upload">📸 Ajouter plusieurs images
        <input id="hotelManagerFiles" type="file" accept="image/*" multiple>
      </label>
      <div id="hotelUploadStatus" class="admin-note" hidden></div>
      <div id="hotelManagerGrid" class="photo-manager"></div>
      <div class="editor-actions">
        <button class="btn" type="button" id="hotelSaveFiles">💾 Enregistrer les fichiers</button>
      </div>`;
    form.parentNode.insertBefore(box, form.nextSibling);

    $('hotelManagerFiles').addEventListener('change', previewNewFiles);
    $('hotelSaveFiles').addEventListener('click', saveHotelFiles);
  }

  function status(text, show = true) {
    const el = $('hotelUploadStatus');
    if (!el) return;
    el.hidden = !show;
    el.textContent = text;
  }

  function renderFiles() {
    const grid = $('hotelManagerGrid');
    if (!grid) return;
    grid.innerHTML = hotelFiles.length ? hotelFiles.map((u, i) => `
      <div class="media-chip" style="position:relative">
        <img src="${esc(u)}" alt="Photo ${i + 1}" style="width:120px;height:90px;object-fit:cover;border-radius:8px">
        <div style="display:flex;gap:4px;justify-content:center;margin-top:4px">
          ${i === 0 ? '<small>⭐ Principale</small>' : `<button type="button" class="btn small" data-main="${i}">⭐ Principale</button>`}
          <button type="button" class="btn small danger" data-remove="${i}">🗑️</button>
        </div>
      </div>`).join('') : '<p class="empty">Aucune photo enregistrée.</p>';
    grid.querySelectorAll('[data-main]').forEach(b => b.onclick = () => { const i = Number(b.dataset.main); const u = hotelFiles.splice(i,1)[0]; hotelFiles.unshift(u); renderFiles(); });
    grid.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { hotelFiles.splice(Number(b.dataset.remove),1); renderFiles(); });
  }

  function previewNewFiles(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    const previews = files.map(f => URL.createObjectURL(f));
    const grid = $('hotelManagerGrid');
    if (!grid) return;
    const pending = previews.map((u,i) => `<div class="media-chip"><img src="${u}" style="width:120px;height:90px;object-fit:cover;border-radius:8px"><small>${esc(files[i].name)} — ${(files[i].size/1024/1024).toFixed(1)} MB</small></div>`).join('');
    grid.insertAdjacentHTML('beforeend', pending);
  }

  async function uploadFile(file, folder, index, total) {
    const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${name}`;
    const { error } = await sb.storage.from('tsaranoro-media').upload(path, file, { upsert:false, cacheControl:'31536000', contentType:file.type || 'image/jpeg' });
    if (error) throw error;
    return sb.storage.from('tsaranoro-media').getPublicUrl(path).data.publicUrl;
  }

  async function saveHotelFiles() {
    const id = Number($('hId')?.value);
    if (!id) { alert('Ouvrez d’abord la fiche de l’hôtel.'); return; }
    const input = $('hotelManagerFiles');
    const files = [...(input?.files || [])];
    try {
      status('0% — Préparation...', true);
      const { data: row, error: readError } = await sb.from('hebergements').select('images,image_url').eq('id', id).single();
      if (readError) throw readError;
      let images = Array.isArray(row?.images) ? [...row.images] : [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        status(`${Math.round((i / Math.max(files.length,1)) * 100)}% — Upload en cours...\n${f.name} — ${(f.size/1024/1024).toFixed(1)} MB`, true);
        const url = await uploadFile(f, 'hotels', i, files.length);
        images.push(url);
        status(`${Math.round(((i + 1) / files.length) * 100)}% — Upload en cours...\n${f.name} — ${(f.size/1024/1024).toFixed(1)} MB`, true);
      }
      if (images.length) {
        const { error } = await sb.from('hebergements').update({ images, image_url: images[0] }).eq('id', id);
        if (error) throw error;
      }
      hotelFiles = images;
      input.value = '';
      renderFiles();
      status('100% — ✅ Upload terminé et fichiers enregistrés.', true);
      if (typeof window.load === 'function') await window.load();
    } catch (e) {
      console.error(e);
      status('❌ Échec de l’upload : ' + (e?.message || e), true);
    }
  }

  const originalEdit = window.editHotel;
  window.editHotel = async function(id) {
    if (typeof originalEdit === 'function') originalEdit(id);
    ensureManager();
    try {
      const { data, error } = await sb.from('hebergements').select('images,site_web').eq('id', id).single();
      if (error) throw error;
      hotelFiles = Array.isArray(data?.images) ? [...data.images] : [];
      if ($('hWebsite')) $('hWebsite').value = data?.site_web || '';
      renderFiles();
      const form = $('hotelForm');
      if (form) {
        const site = $('hWebsite');
        if (site && !site.dataset.bound) {
          site.dataset.bound = '1';
          site.addEventListener('change', async () => {
            const hid = Number($('hId').value);
            if (!hid) return;
            const { error: e } = await sb.from('hebergements').update({ site_web: site.value.trim() }).eq('id', hid);
            if (e) alert('Impossible d’enregistrer le site web : ' + e.message);
          });
        }
      }
    } catch (e) { status('❌ Impossible de charger les fichiers : ' + e.message, true); }
  };

  function addWebsiteIfMissing() {
    const form = $('hotelForm');
    if (!form || $('hWebsite')) return;
    const input = document.createElement('input');
    input.id = 'hWebsite';
    input.type = 'url';
    input.placeholder = '🌐 Site web de l’hôtel (https://...)';
    const image = $('hImage');
    form.insertBefore(input, image || form.querySelector('textarea'));
  }

  function boot() {
    addWebsiteIfMissing();
    ensureManager();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
