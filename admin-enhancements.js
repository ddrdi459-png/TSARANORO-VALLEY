(() => {
  const sb = window.tsaranoroAdmin;
  const BUCKET = 'tsaranoro-media';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const uid = () => window.TSARANORO_ADMIN_UID || '5b530036-4836-4db0-87f2-c1de569e73b5';
  const fmt = n => { if(!n) return '0 B'; const u=['B','KB','MB','GB']; const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),3); return `${(n/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`; };

  function progressBox(form, title='☁️ Upload') {
    let b = form.querySelector('.enhanced-upload-progress');
    if(!b){ b=document.createElement('div'); b.className='enhanced-upload-progress'; b.style.cssText='margin:14px 0;padding:14px;border:1px solid #d8e2d6;border-radius:12px;background:#f7faf6'; form.querySelector('.editor-actions').before(b); }
    b.innerHTML=`<div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:8px"><span>${title}</span><span class="ep-percent">0%</span></div><div style="height:12px;background:#e3e8e1;border-radius:99px;overflow:hidden"><div class="ep-bar" style="height:100%;width:0%;transition:width .15s ease;background:#3d7a4a"></div></div><div class="ep-file" style="font-size:.88rem;color:#66736a;margin-top:8px"></div><div class="ep-status" style="font-size:.88rem;margin-top:6px">Préparation...</div>`;
    return b;
  }
  function setProgress(b,p,text,file){ const n=Math.max(0,Math.min(100,Math.round(p))); b.querySelector('.ep-percent').textContent=n+'%'; b.querySelector('.ep-bar').style.width=n+'%'; b.querySelector('.ep-status').textContent=text||''; if(file)b.querySelector('.ep-file').textContent=file; }

  async function requireAdmin(){ const {data:{user},error}=await sb.auth.getUser(); if(error) throw error; if(!user || user.id!==uid()) throw new Error('Compte administrateur non autorisé.'); return user; }
  async function uploadProgress(file,folder,b,overall){
    await requireAdmin();
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
    const path=`${folder}/${Date.now()}-${crypto.randomUUID()}-${safe}`;
    const url=`${window.TSARANORO_SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;
    const {data:{session}}=await sb.auth.getSession();
    if(!session?.access_token) throw new Error('Session administrateur expirée. Reconnectez-vous.');
    await new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest(); xhr.open('POST',url,true);
      xhr.setRequestHeader('Authorization',`Bearer ${session.access_token}`); xhr.setRequestHeader('apikey',window.TSARANORO_SUPABASE_KEY); xhr.setRequestHeader('x-upsert','false'); xhr.setRequestHeader('cache-control','31536000'); if(file.type)xhr.setRequestHeader('Content-Type',file.type);
      xhr.upload.onprogress=e=>{if(e.lengthComputable){const p=e.loaded/e.total*100; setProgress(b,p,`Upload en cours… ${fmt(e.loaded)} / ${fmt(e.total)}`,`${file.name} — ${fmt(file.size)}`); if(overall)overall(p);}};
      xhr.onerror=()=>reject(new Error('Erreur réseau pendant l’upload.')); xhr.onabort=()=>reject(new Error('Upload annulé.'));
      xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300)resolve();else{let m=`Upload refusé (${xhr.status}).`;try{const j=JSON.parse(xhr.responseText);m=j.message||j.error||m;}catch(_){}reject(new Error(m));}}; xhr.send(file);
    });
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  function preview(container,urls){ if(!container)return; container.innerHTML=(urls||[]).map(u=>`<div class="media-chip"><img src="${esc(u)}"><span style="display:block;font-size:.72rem;overflow:hidden;text-overflow:ellipsis;max-width:130px">${esc(u.split('/').pop())}</span></div>`).join(''); }

  window.newActivity=()=>{ $('activityForm').hidden=false; $('aId').value=''; ['aName','aPrice','aDesc'].forEach(i=>$(i).value=''); $('aPhotos').value=''; $('aPhotoPreview').innerHTML=''; };
  window.editActivity=id=>{ const x=(window.data?.activities||[]).find(z=>z.id===id); if(!x)return; $('activityForm').hidden=false; $('aId').value=x.id; $('aName').value=x.nom||''; $('aPrice').value=x.prix||''; $('aDesc').value=x.description||''; preview($('aPhotoPreview'),x.images||((x.image_url)?[x.image_url]:[])); };

  window.newHotel=()=>{ $('hotelForm').hidden=false; $('hId').value=''; ['hName','hPhone','hWhatsApp','hPrice','hImage','hWebsite','hDesc','hServices'].forEach(i=>$(i).value=''); $('hPhotos').value=''; $('hPhotoPreview').innerHTML=''; };
  window.editHotel=id=>{ const x=(window.data?.hotels||[]).find(z=>z.id===id); if(!x)return; $('hotelForm').hidden=false; $('hId').value=x.id; $('hName').value=x.nom||''; $('hPhone').value=x.telephone||''; $('hWhatsApp').value=x.whatsapp||''; $('hPrice').value=x.prix||''; $('hImage').value=x.image_url||''; $('hWebsite').value=x.site_web||''; $('hDesc').value=x.description||''; $('hServices').value=x.services||''; preview($('hPhotoPreview'),x.images||((x.image_url)?[x.image_url]:[])); };

  function renderActivityEnhanced(){ const root=$('activityList'); if(!root||!window.data)return; root.innerHTML=(window.data.activities||[]).map(x=>{const imgs=Array.isArray(x.images)&&x.images.length?x.images:(x.image_url?[x.image_url]:[]);const p=imgs[0]||'';return `<article class="admin-card"><div class="thumb">${p?`<img src="${esc(p)}">`:'🏄'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.prix||'Sur demande')} · 📸 ${imgs.length} photo(s)</p>${window.statusButton?window.statusButton('activites',x.id,x.actif):''} <button class="btn small" onclick="editActivity(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteActivity(${x.id})">🗑️ Supprimer</button></div></article>`}).join('')||'<p class="empty">Aucune activité.</p>'; }
  function renderHotelEnhanced(){ const root=$('hotelList'); if(!root||!window.data)return; root.innerHTML=(window.data.hotels||[]).map(x=>{const imgs=Array.isArray(x.images)&&x.images.length?x.images:(x.image_url?[x.image_url]:[]);const p=imgs[0]||'';return `<article class="admin-card"><div class="thumb">${p?`<img src="${esc(p)}">`:'🏨'}</div><div><h3>${esc(x.nom)}</h3><p>📸 ${imgs.length} photo(s) · ${x.site_web?`🌐 <a href="${esc(x.site_web)}" target="_blank" rel="noopener">Site web</a>`:'Site web non renseigné'}</p>${window.statusButton?window.statusButton('hebergements',x.id,x.actif):''} <button class="btn small" onclick="editHotel(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteHotel(${x.id})">🗑️ Supprimer</button></div></article>`}).join('')||'<p class="empty">Aucun hébergement.</p>'; }

  function installForms(){
    const af=$('activityForm'), hf=$('hotelForm');
    if(af&&!af.dataset.enhanced){ af.dataset.enhanced='1'; af.addEventListener('submit',async e=>{e.preventDefault();e.stopImmediatePropagation();const button=af.querySelector('button[type=submit]');button.disabled=true;try{await requireAdmin();const id=Number($('aId').value);const old=(window.data?.activities||[]).find(x=>x.id===id);let images=[...(old?.images||((old?.image_url)?[old.image_url]:[]))];const files=[...($('aPhotos').files||[])];const box=progressBox(af,'🏄 Upload activité');if(files.length){for(let i=0;i<files.length;i++){setProgress(box,(i/files.length)*100,`Préparation de la photo ${i+1}/${files.length}`,`${files[i].name} — ${fmt(files[i].size)}`);const u=await uploadProgress(files[i],'activites',box,p=>setProgress(box,(i+p/100)/files.length*100,`Upload ${i+1}/${files.length}… ${fmt(files[i].size)}`,`${files[i].name} — ${fmt(files[i].size)}`));images.push(u);}}const payload={nom:$('aName').value.trim(),prix:$('aPrice').value.trim()||'Sur demande',description:$('aDesc').value.trim(),image_url:images[0]||null,images,actif:old?.actif??true};const q=id?await sb.from('activites').update(payload).eq('id',id):await sb.from('activites').insert(payload);if(q.error)throw q.error;setProgress(box,100,'✅ Upload terminé — activité enregistrée.');if(window.load)await window.load();else location.reload();}catch(err){const b=af.querySelector('.enhanced-upload-progress');if(b)setProgress(b,0,'❌ Échec de l’upload : '+err.message);alert('Impossible d’enregistrer : '+err.message);}finally{button.disabled=false;}},true); }
    if(hf&&!hf.dataset.enhanced){ hf.dataset.enhanced='1'; hf.addEventListener('submit',async e=>{e.preventDefault();e.stopImmediatePropagation();const button=hf.querySelector('button[type=submit]');button.disabled=true;try{await requireAdmin();const id=Number($('hId').value);const old=(window.data?.hotels||[]).find(x=>x.id===id);let images=[...(old?.images||((old?.image_url)?[old.image_url]:[]))];const files=[...($('hPhotos').files||[])];const box=progressBox(hf,'🏨 Upload hôtel');if(files.length){for(let i=0;i<files.length;i++){const u=await uploadProgress(files[i],'hotels',box,p=>setProgress(box,(i+p/100)/files.length*100,`Upload ${i+1}/${files.length}…`,`${files[i].name} — ${fmt(files[i].size)}`));images.push(u);}}const payload={nom:$('hName').value.trim(),telephone:$('hPhone').value.trim(),whatsapp:$('hWhatsApp').value.trim(),prix:$('hPrice').value.trim()||'Sur demande',description:$('hDesc').value.trim(),services:$('hServices').value.trim(),image_url:$('hImage').value.trim()||images[0]||null,images,site_web:$('hWebsite').value.trim()||null,actif:old?.actif??true};const q=id?await sb.from('hebergements').update(payload).eq('id',id):await sb.from('hebergements').insert({...payload,actif:true});if(q.error)throw q.error;setProgress(box,100,'✅ Upload terminé — hôtel enregistré.');if(window.load)await window.load();else location.reload();}catch(err){const b=hf.querySelector('.enhanced-upload-progress');if(b)setProgress(b,0,'❌ Échec de l’upload : '+err.message);alert('Impossible d’enregistrer : '+err.message);}finally{button.disabled=false;}},true); }
  }
  function boot(){ installForms(); renderActivityEnhanced(); renderHotelEnhanced(); }
  document.addEventListener('DOMContentLoaded',boot); setTimeout(boot,500); setInterval(()=>{installForms();renderActivityEnhanced();renderHotelEnhanced();},3000);
})();