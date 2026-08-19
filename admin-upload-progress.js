(() => {
  const $ = id => document.getElementById(id);
  const sb = window.tsaranoroAdmin;
  const BUCKET = 'tsaranoro-media';

  function showProgress(file) {
    let box = $('uploadProgressBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'uploadProgressBox';
      box.style.cssText = 'margin:14px 0;padding:14px;border:1px solid #d8e2d6;border-radius:12px;background:#f7faf6;display:none';
      const form = $('mediaForm');
      form.querySelector('.editor-actions').before(box);
    }
    box.style.display = 'block';
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;font-weight:600;margin-bottom:8px">
        <span>☁️ Upload en cours...</span><span id="uploadPercent">0%</span>
      </div>
      <div style="height:12px;background:#e3e8e1;border-radius:99px;overflow:hidden">
        <div id="uploadBar" style="height:100%;width:0%;transition:width .2s ease;background:#3d7a4a"></div>
      </div>
      <div id="uploadFileInfo" style="font-size:.88rem;color:#66736a;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
      <div id="uploadStatus" style="font-size:.88rem;margin-top:6px">Préparation...</div>`;
    $('uploadFileInfo').textContent = `${file.name} — ${formatBytes(file.size)}`;
    return box;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B','KB','MB','GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
  }

  function setProgress(percent, text) {
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    if ($('uploadBar')) $('uploadBar').style.width = `${p}%`;
    if ($('uploadPercent')) $('uploadPercent').textContent = `${p}%`;
    if ($('uploadStatus')) $('uploadStatus').textContent = text || '';
  }

  async function uploadWithProgress(file, folder) {
    const { data: { user } } = await sb.auth.getUser();
    const uid = window.TSARANORO_ADMIN_UID || '5b530036-4836-4db0-87f2-c1de569e73b5';
    if (!user || user.id !== uid) throw new Error('Compte administrateur non autorisé.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const url = `${window.TSARANORO_SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) throw new Error('Session administrateur expirée. Reconnectez-vous.');

    showProgress(file);
    setProgress(0, 'Démarrage de l’upload...');

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('apikey', window.TSARANORO_SUPABASE_KEY);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('cache-control', '31536000');
      if (file.type) xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = event => {
        if (event.lengthComputable) setProgress((event.loaded / event.total) * 100, `Upload en cours… ${formatBytes(event.loaded)} / ${formatBytes(event.total)}`);
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

    setProgress(100, '✅ Upload terminé — enregistrement en cours...');
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const form = $('mediaForm');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const file = $('mFile').files[0];
    if (!file) { alert('Choisissez un fichier.'); return; }

    const type = $('mType').value;
    if (type === 'video' && !/^video\/(mp4|webm|quicktime)$/i.test(file.type)) {
      alert('Pour une vidéo, choisissez un fichier MP4, WebM ou MOV.');
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '⏳ Upload...';
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
      setProgress(100, '✅ Vidéo envoyée et publiée avec succès.');
      if (typeof window.load === 'function') await window.load();
      setTimeout(() => { if (typeof window.closeEditors === 'function') window.closeEditors(); }, 900);
    } catch (error) {
      setProgress(0, `❌ Échec : ${error.message}`);
      alert('Impossible de publier : ' + error.message);
    } finally {
      button.disabled = false;
      button.textContent = '☁️ Publier en ligne';
    }
  }, true);
})();
