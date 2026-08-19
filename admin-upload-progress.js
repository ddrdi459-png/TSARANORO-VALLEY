(() => {
  const $ = id => document.getElementById(id);
  const sb = window.tsaranoroAdmin;
  const BUCKET = 'tsaranoro-media';

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B','KB','MB','GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
  }

  function ensureBox(file) {
    let box = $('uploadProgressBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'uploadProgressBox';
      const form = $('mediaForm');
      if (form) form.querySelector('.editor-actions')?.before(box);
    }
    box.style.cssText = 'display:block;margin:14px 0;padding:16px;border:1px solid #d8e2d6;border-radius:14px;background:#f7faf6';
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;font-weight:700;margin-bottom:8px">
        <span>🎥 Upload vidéo</span><span id="uploadPercent">0%</span>
      </div>
      <div style="height:14px;background:#e3e8e1;border-radius:99px;overflow:hidden">
        <div id="uploadBar" style="height:100%;width:0%;transition:width .15s ease;background:#3d7a4a"></div>
      </div>
      <div id="uploadFileInfo" style="font-size:.9rem;margin-top:9px;font-weight:600"></div>
      <div id="uploadStatus" style="font-size:.9rem;margin-top:6px">Préparation...</div>`;
    if (file) $('uploadFileInfo').textContent = `${file.name} — ${formatBytes(file.size)}`;
    return box;
  }

  function setProgress(percent, text) {
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    if ($('uploadBar')) $('uploadBar').style.width = `${p}%`;
    if ($('uploadPercent')) $('uploadPercent').textContent = `${p}%`;
    if ($('uploadStatus')) $('uploadStatus').textContent = text || '';
  }

  async function requireAdmin() {
    const { data: { user }, error } = await sb.auth.getUser();
    if (error) throw error;
    const uid = window.TSARANORO_ADMIN_UID || '5b530036-4836-4db0-87f2-c1de569e73b5';
    const email = window.TSARANORO_ADMIN_EMAIL || 'tsaranoroo.admin@gmail.com';
    if (!user) throw new Error('Session administrateur expirée. Reconnectez-vous.');
    if (user.id !== uid && String(user.email || '').toLowerCase() !== email.toLowerCase()) {
      throw new Error(`Compte administrateur non autorisé (${user.email || 'inconnu'}).`);
    }
    return user;
  }

  async function uploadWithProgress(file, folder) {
    await requireAdmin();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const url = `${window.TSARANORO_SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) throw new Error('Session administrateur expirée. Reconnectez-vous.');

    ensureBox(file);
    setProgress(0, `0% — Upload en cours...`);

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('apikey', window.TSARANORO_SUPABASE_KEY);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('cache-control', '31536000');
      if (file.type) xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const p = (event.loaded / event.total) * 100;
          setProgress(p, `${Math.round(p)}% — Upload en cours... ${formatBytes(event.loaded)} / ${formatBytes(event.total)}`);
        }
      };
      xhr.onerror = () => reject(new Error('Erreur réseau pendant l’upload.'));
      xhr.onabort = () => reject(new Error('Upload annulé.'));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          let message = `Upload refusé (${xhr.status}).`;
          try { const body = JSON.parse(xhr.responseText); message = body.message || body.error || message; } catch (_) {}
          reject(new Error(message));
        }
      };
      xhr.send(file);
    });

    setProgress(100, '100% — ✅ Upload terminé');
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const form = $('mediaForm');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const file = $('mFile')?.files?.[0];
    if (!file) { alert('Choisissez un fichier.'); return; }
    const type = $('mType').value;
    if (type === 'video' && !/^video\/(mp4|webm|quicktime)$/i.test(file.type)) {
      alert('Pour une vidéo, choisissez un fichier MP4, WebM ou MOV.');
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const url = await uploadWithProgress(file, type === 'video' ? 'videos' : 'gallery');
      const { error } = await sb.from('galerie').insert({
        titre: $('mTitle').value.trim() || file.name,
        description: $('mDesc').value.trim(),
        type,
        fichier_url: url,
        categorie: 'Tsaranoro',
        actif: true
      });
      if (error) throw error;
      setProgress(100, '100% — ✅ Upload terminé — média publié.');
      if (typeof window.load === 'function') await window.load();
    } catch (error) {
      ensureBox(file);
      setProgress(0, `❌ Échec de l’upload : ${error.message}`);
      alert('Impossible de publier : ' + error.message);
    } finally {
      button.disabled = false;
    }
  }, true);
})();
