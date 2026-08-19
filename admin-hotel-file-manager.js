(() => {
  const sb = window.tsaranoroAdmin;
  const $ = id => document.getElementById(id);
  if (!sb) return;
  let hotelFiles = [];

  const esc = s => String(s ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const sizeMB = n => `${(n / 1024 / 1024).toFixed(1)} MB`;

  function buildHotelForm() {
    const form = $('hotelForm');
    if (!form || form.dataset.v2 === '1') return;
    form.dataset.v2 = '1';
    form.innerHTML = `
      <div class="editor-head">
        <div><span class="eyebrow">🏨 HÉBERGEMENT</span><h3 id="hotelFormTitle">Nouvel hébergement</h3><p class="admin-note">Créez une fiche complète : informations, description, site web et galerie.</p></div>
      </div>
      <input type="hidden" id="hId">
      <div class="form-grid">
        <label>Nom de l'hôtel<input id="hName" required placeholder="Ex. Tsarasoa Lodge"></label>
        <label>Téléphone<input id="hPhone" placeholder="+261 ..."></label>
        <label>WhatsApp<input id="hWhatsApp" placeholder="+261 ..."></label>
        <label>Tarif / indication<input id="hPrice" placeholder="Sur commande"></label>
      </div>
      <label>🌐 Site web officiel<input id="hWebsite" type="url" placeholder="https://..." autocomplete="url"></label>
      <label>📝 Description<textarea id="hDesc" rows="5" placeholder="Présentez l'hôtel, son emplacement et son ambiance..."></textarea></label>
      <label>🛎️ Hébergement & services<textarea id="hServices" rows="4" placeholder="Bungalows, chambres, restaurant, camping, pension..." ></textarea></label>
      <div class="file-section">
        <div class="file-section-head"><div><h4>📁 Gestion des fichiers</h4><p>Ajoutez plusieurs photos. La première peut être définie comme image principale.</p></div></div>
        <label class="upload dropzone">📸 Ajouter plusieurs photos
          <input id="hotelManagerFiles" type="file" accept="image/*" multiple>
        </label>
        <div id="hotelUploadStatus" class="upload-status" hidden></div>
        <div id="hotelManagerGrid" class="photo-manager"></div>
      </div>
      <div class="editor-actions">
        <button class="btn" type="submit">💾 Enregistrer la fiche</button>
        <button class="btn light" type="button" id="hotelSaveFiles">☁️ Enregistrer les fichiers</button>
        <button class="btn light" type="button" onclick="closeEditors()">Annuler</button>
      </div>`;
    $('hotelManagerFiles').addEventListener('change', previewNewFiles);
    $('hotelSaveFiles').addEventListener('click', saveHotelFiles);
  }

  function status(text, show = true) {
    const el = $('hotelUploadStatus');
    if (!el) return;
    el.hidden = !show;
    el.innerHTML = esc(text).replace(/\n/g, '<br>');
  }

  function renderFiles() {
    const grid = $('hotelManagerGrid');
    if (!grid) return;
    grid.innerHTML = hotelFiles.length ? hotelFiles.map((u, i) => `
      <div class="media-chip file-card">
        <img src="${esc(u)}" alt="Photo ${i + 1}">
        <div class="file-card-name">Photo ${i + 1}</div>
        <div class="file-card-actions">
          ${i === 0 ? '<span class="main-badge">⭐ Principale</span>' : `<button type="button" class="btn small" data-main="${i}">⭐ Principale</button>`}
          <button type="button" class="btn small danger" data-remove="${i}">🗑️ Supprimer</button>
        </div>
      </div>`).join('') : '<p class="empty">Aucune photo enregistrée pour cet hôtel.</p>';
    grid.querySelectorAll('[data-main]').forEach(b => b.onclick = () => { const i = Number(b.dataset.main); const u = hotelFiles.splice(i,1)[0]; hotelFiles.unshift(u); renderFiles(); });
    grid.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { hotelFiles.splice(Number(b.dataset.remove),1); renderFiles(); });
  }

  function previewNewFiles(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    const grid = $('hotelManagerGrid');
    if (!grid) return;
    const pending = files.map((f,i) => `<div class="media-chip file-card pending-file"><div class="pending-icon">📸</div><div class="file-card-name">${esc(f.name)}</div><small>${sizeMB(f.size)}</small><span>Prêt à envoyer</span></div>`).join('');
    grid.insertAdjacentHTML('afterbegin', pending);
    status(`${files.length} fichier(s) sélectionné(s) — prêt pour l'upload.`);
  }

  async function uploadFile(file) {
    const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `hotels/${Date.now()}-${crypto.randomUUID()}-${name}`;
    const { error } = await sb.storage.from('tsaranoro-media').upload(path, file, { upsert:false, cacheControl:'31536000', contentType:file.type || 'image/jpeg' });
    if (error) throw error;
    return sb.storage.from('tsaranoro-media').getPublicUrl(path).data.publicUrl;
  }

  async function saveHotelFiles() {
    const id = Number($('hId')?.value);
    if (!id) { alert('Enregistrez d’abord la fiche de l’hôtel.'); return; }
    const input = $('hotelManagerFiles');
    const files = [...(input?.files || [])];
    if (!files.length) { status('Aucun nouveau fichier sélectionné.'); return; }
    try {
      status('0% — Préparation de l’upload...');
      const { data: row, error: readError } = await sb.from('hebergements').select('images,image_url').eq('id', id).single();
      if (readError) throw readError;
      let images = Array.isArray(row?.images) ? [...row.images] : [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const start = Math.round((i / files.length) * 100);
        status(`${start}% — Upload en cours...\n${f.name} — ${sizeMB(f.size)}`);
        const url = await uploadFile(f);
        images.push(url);
        status(`${Math.round(((i + 1) / files.length) * 100)}% — Upload en cours...\n${f.name} — ${sizeMB(f.size)}`);
      }
      const { error } = await sb.from('hebergements').update({ images, image_url: images[0] || null }).eq('id', id);
      if (error) throw error;
      hotelFiles = images;
      input.value = '';
      renderFiles();
      status('100% — ✅ Upload terminé et fichiers enregistrés.');
      if (typeof window.load === 'function') await window.load();
    } catch (e) {
      console.error(e);
      status('❌ Échec de l’upload : ' + (e?.message || e));
    }
  }

  function fillHotel(x) {
    buildHotelForm();
    $('hId').value = x?.id || '';
    $('hName').value = x?.nom || '';
    $('hPhone').value = x?.telephone || '';
    $('hWhatsApp').value = x?.whatsapp || '';
    $('hPrice').value = x?.prix || 'Sur commande';
    $('hWebsite').value = x?.site_web || '';
    $('hDesc').value = x?.description || '';
    $('hServices').value = x?.services || '';
    $('hotelFormTitle').textContent = x ? `Modifier — ${x.nom}` : 'Nouvel hébergement';
    hotelFiles = Array.isArray(x?.images) ? [...x.images] : [];
    const input = $('hotelManagerFiles');
    if (input) input.value = '';
    renderFiles();
    status('', false);
  }

  const originalEdit = window.editHotel;
  window.editHotel = async function(id) {
    const x = (window.__tsaranoroHotelData || []).find(z => z.id === id);
    buildHotelForm();
    if (typeof originalEdit === 'function') originalEdit(id);
    try {
      const { data, error } = await sb.from('hebergements').select('*').eq('id', id).single();
      if (error) throw error;
      fillHotel(data || x);
    } catch (e) { status('❌ Impossible de charger la fiche : ' + e.message); }
  };

  const originalNew = window.newHotel;
  window.newHotel = function() {
    buildHotelForm();
    if (typeof originalNew === 'function') originalNew();
    fillHotel(null);
    const form = $('hotelForm');
    if (form) form.hidden = false;
  };

  function addStyles() {
    if ($('hotelFileManagerStyles')) return;
    const s = document.createElement('style'); s.id = 'hotelFileManagerStyles';
    s.textContent = `
      #hotelForm label{display:block;margin:10px 0;font-weight:600}#hotelForm label input,#hotelForm label textarea{display:block;width:100%;margin-top:6px;box-sizing:border-box;padding:11px;border:1px solid #d8ded7;border-radius:10px;background:#fff;font:inherit}
      .file-section{margin-top:18px;padding:18px;border:1px solid #dfe6dd;border-radius:16px;background:#fafcf9}.file-section-head h4{margin:0 0 5px;font-size:18px}.file-section-head p{margin:0 0 14px}.dropzone{border:2px dashed #b8c7b2!important;text-align:center;padding:16px;border-radius:14px;background:#f7faf5}.dropzone input{margin:10px auto 0!important;border:0!important}.upload-status{margin:12px 0;padding:12px;border-radius:10px;background:#eef6ec;white-space:normal}.photo-manager{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-top:14px}.file-card{padding:9px;border:1px solid #e1e6df;border-radius:12px;background:#fff}.file-card img{width:100%;height:120px;object-fit:cover;border-radius:8px}.file-card-name{font-size:13px;font-weight:600;margin-top:7px;word-break:break-word}.file-card-actions{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.main-badge{font-size:12px;padding:5px 7px;border-radius:7px;background:#eef5e9}.pending-file{display:flex;flex-direction:column;justify-content:center;min-height:150px}.pending-icon{font-size:35px}.pending-file span{font-size:12px;margin-top:5px}.editor-head .eyebrow{font-size:12px;letter-spacing:.08em;font-weight:700}.editor-head h3{margin:4px 0}.editor-head{margin-bottom:12px}`;
    document.head.appendChild(s);
  }

  function boot() { addStyles(); buildHotelForm(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
