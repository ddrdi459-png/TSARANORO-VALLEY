/* TSARANORO VALLEY ADMIN MEDIA V3 */
(() => {
  const client = window.tsaranoroAdmin;
  const MEDIA_BUCKET = 'tsaranoro-media';
  const ADMIN_UID = '5b530036-4836-4db0-87f2-c1de569e73b5';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  let cache = {circuits:[],activities:[],guides:[],hotels:[],reservations:[],media:[]};

  async function requireAdmin(){
    const {data:{user}} = await client.auth.getUser();
    if(!user || user.id !== ADMIN_UID) throw new Error('Compte administrateur non autorisé.');
  }
  async function upload(file, folder){
    if(!file) return null;
    await requireAdmin();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const {error} = await client.storage.from(MEDIA_BUCKET).upload(path,file,{upsert:false,cacheControl:'31536000',contentType:file.type||undefined});
    if(error) throw error;
    return client.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  }
  async function removeUrl(url){
    if(!url || !url.includes(`/storage/v1/object/public/${MEDIA_BUCKET}/`)) return;
    const path = url.split(`/storage/v1/object/public/${MEDIA_BUCKET}/`)[1];
    if(path) await client.storage.from(MEDIA_BUCKET).remove([decodeURIComponent(path)]);
  }
  function closeEditors(){document.querySelectorAll('.editor').forEach(x=>x.hidden=true);}
  window.closeEditors=closeEditors;

  async function load(){
    try{
      await requireAdmin();
      const [c,a,g,h,r,m] = await Promise.all([
        client.from('circuits').select('*').order('id'),
        client.from('activites').select('*').order('id'),
        client.from('guides').select('*').order('id'),
        client.from('hebergements').select('*').order('id'),
        client.from('reservations').select('*').order('created_at',{ascending:false}),
        client.from('galerie').select('*').order('created_at',{ascending:false})
      ]);
      for(const q of [c,a,g,h,r,m]) if(q.error) throw q.error;
      cache={circuits:c.data||[],activities:a.data||[],guides:g.data||[],hotels:h.data||[],reservations:r.data||[],media:m.data||[]};
      render();
    }catch(e){alert('Erreur Supabase: '+e.message);}
  }
  function render(){renderCircuits();renderActivities();renderGuides();renderHotels();renderReservations();renderMedia();}

  window.newCircuit=()=>{$('circuitForm').hidden=false;$('editId').value='';['cName','cDuration','cPrice','cDesc','cItinerary','cPoints'].forEach(i=>$(i).value='');$('cDifficulty').value='unknown';$('cPhotos').value='';$('photoPreview').innerHTML='';};
  window.editCircuit=id=>{const x=cache.circuits.find(z=>z.id===id);if(!x)return;$('circuitForm').hidden=false;$('editId').value=x.id;$('cName').value=x.nom||'';$('cDuration').value=x.duree||'';$('cPrice').value=x.prix||'';$('cDesc').value=x.description||'';$('cItinerary').value=x.itinerary||'';$('cPoints').value=x.points||'';$('cDifficulty').value=String(x.difficulte||'').includes('Difficile')?'hard':String(x.difficulte||'').includes('Assez facile')?'medium':String(x.difficulte||'').includes('Facile')?'easy':'unknown';$('photoPreview').innerHTML=(x.images||[]).map(u=>`<div class="media-chip"><img src="${esc(u)}"><button type="button" onclick="removeCircuitPhoto(${x.id},'${encodeURIComponent(u)}')">🗑️</button></div>`).join('');};
  window.removeCircuitPhoto=async(id,encoded)=>{const x=cache.circuits.find(z=>z.id===id);if(!x)return;const url=decodeURIComponent(encoded);const images=(x.images||[]).filter(u=>u!==url);const q=await client.from('circuits').update({images,image_url:images[0]||null}).eq('id',id);if(q.error)alert(q.error.message);else{await removeUrl(url);await load();window.editCircuit(id);}};
  window.deleteCircuit=async id=>{if(!confirm('Supprimer ce circuit ?'))return;const x=cache.circuits.find(z=>z.id===id);const q=await client.from('circuits').delete().eq('id',id);if(q.error)alert(q.error.message);else{for(const u of (x?.images||[]))await removeUrl(u);await load();}};
  $('circuitForm').onsubmit=async e=>{e.preventDefault();try{await requireAdmin();const id=Number($('editId').value);const old=cache.circuits.find(x=>x.id===id);let images=[...(old?.images||[])];for(const f of $('cPhotos').files||[]) {const u=await upload(f,'circuits');if(u)images.push(u);}const payload={nom:$('cName').value.trim(),duree:$('cDuration').value.trim(),difficulte:$('cDifficulty').value==='hard'?'🔴 Difficile':$('cDifficulty').value==='medium'?'🟡 Assez facile':$('cDifficulty').value==='easy'?'🟢 Facile':'⚪ À compléter',prix:$('cPrice').value.trim()||'Sur demande',description:$('cDesc').value.trim(),itinerary:$('cItinerary').value.trim(),points:$('cPoints').value.trim(),images,image_url:images[0]||null,actif:true};const q=id?await client.from('circuits').update(payload).eq('id',id):await client.from('circuits').insert(payload);if(q.error)throw q.error;await load();closeEditors();alert('Circuit enregistré en ligne. La photo est publiée.');}catch(e){alert('Impossible d’enregistrer: '+e.message);}};
  function renderCircuits(){$('circuitList').innerHTML=cache.circuits.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🌄'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.difficulte||'')} · ${esc(x.duree||'')}</p><button class="btn small" onclick="editCircuit(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteCircuit(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun circuit.</p>';}

  window.newActivity=()=>{$('activityForm').hidden=false;$('aId').value='';['aName','aPrice','aDesc'].forEach(i=>$(i).value='');$('aPhoto').value='';};
  window.editActivity=id=>{const x=cache.activities.find(z=>z.id===id);if(!x)return;$('activityForm').hidden=false;$('aId').value=x.id;$('aName').value=x.nom||'';$('aPrice').value=x.prix||'';$('aDesc').value=x.description||'';};
  window.deleteActivity=async id=>{if(!confirm('Supprimer cette activité ?'))return;const x=cache.activities.find(z=>z.id===id);const q=await client.from('activites').delete().eq('id',id);if(q.error)alert(q.error.message);else{if(x?.image_url)await removeUrl(x.image_url);await load();}};
  $('activityForm').onsubmit=async e=>{e.preventDefault();try{const id=Number($('aId').value);const old=cache.activities.find(x=>x.id===id);let image=old?.image_url||null;if($('aPhoto').files[0]){if(image)await removeUrl(image);image=await upload($('aPhoto').files[0],'activites');}const payload={nom:$('aName').value.trim(),prix:$('aPrice').value.trim()||'Sur demande',description:$('aDesc').value.trim(),image_url:image,actif:true};const q=id?await client.from('activites').update(payload).eq('id',id):await client.from('activites').insert(payload);if(q.error)throw q.error;await load();closeEditors();alert('Activité enregistrée en ligne.');}catch(e){alert('Impossible d’enregistrer: '+e.message);}};
  function renderActivities(){$('activityList').innerHTML=cache.activities.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🏄'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.prix||'')}</p><button class="btn small" onclick="editActivity(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteActivity(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucune activité.</p>';}

  window.newGuide=()=>{$('guideForm').hidden=false;$('gId').value='';['gName','gLang','gSpec','gDesc'].forEach(i=>$(i).value='');$('gPhoto').value='';};
  window.editGuide=id=>{const x=cache.guides.find(z=>z.id===id);if(!x)return;$('guideForm').hidden=false;$('gId').value=x.id;$('gName').value=x.nom||'';$('gLang').value=x.langues||'';$('gSpec').value=x.specialites||'';$('gDesc').value=x.description||'';};
  window.deleteGuide=async id=>{if(!confirm('Supprimer ce guide ?'))return;const x=cache.guides.find(z=>z.id===id);const q=await client.from('guides').delete().eq('id',id);if(q.error)alert(q.error.message);else{if(x?.image_url)await removeUrl(x.image_url);await load();}};
  $('guideForm').onsubmit=async e=>{e.preventDefault();try{const id=Number($('gId').value);const old=cache.guides.find(x=>x.id===id);let image=old?.image_url||null;if($('gPhoto').files[0]){if(image)await removeUrl(image);image=await upload($('gPhoto').files[0],'guides');}const payload={nom:$('gName').value.trim(),langues:$('gLang').value.trim(),specialites:$('gSpec').value.trim(),description:$('gDesc').value.trim(),image_url:image,actif:true};const q=id?await client.from('guides').update(payload).eq('id',id):await client.from('guides').insert(payload);if(q.error)throw q.error;await load();closeEditors();alert('Guide enregistré en ligne.');}catch(e){alert('Impossible d’enregistrer: '+e.message);}};
  function renderGuides(){$('guideList').innerHTML=cache.guides.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🧭'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.langues||'')}</p><button class="btn small" onclick="editGuide(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteGuide(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun guide.</p>';}

  window.newHotel=()=>{$('hotelForm').hidden=false;$('hId').value='';['hName','hPhone','hWhatsApp','hPrice','hImage','hDesc','hServices'].forEach(i=>$(i).value='');$('hPhoto').value='';};
  window.editHotel=id=>{const x=cache.hotels.find(z=>z.id===id);if(!x)return;$('hotelForm').hidden=false;$('hId').value=x.id;$('hName').value=x.nom||'';$('hPhone').value=x.telephone||'';$('hWhatsApp').value=x.whatsapp||'';$('hPrice').value=x.prix||'';$('hImage').value=x.image_url||'';$('hDesc').value=x.description||'';$('hServices').value=x.services||'';};
  window.deleteHotel=async id=>{if(!confirm('Supprimer cet hébergement ?'))return;const x=cache.hotels.find(z=>z.id===id);const q=await client.from('hebergements').delete().eq('id',id);if(q.error)alert(q.error.message);else{if(x?.image_url)await removeUrl(x.image_url);await load();}};
  $('hotelForm').onsubmit=async e=>{e.preventDefault();try{const id=Number($('hId').value);const old=cache.hotels.find(x=>x.id===id);let image=$('hImage').value.trim()||old?.image_url||null;if($('hPhoto').files[0]){if(old?.image_url)await removeUrl(old.image_url);image=await upload($('hPhoto').files[0],'hotels');}const payload={nom:$('hName').value.trim(),telephone:$('hPhone').value.trim(),whatsapp:$('hWhatsApp').value.trim(),prix:$('hPrice').value.trim()||'Sur demande',description:$('hDesc').value.trim(),services:$('hServices').value.trim(),image_url:image,actif:true};const q=id?await client.from('hebergements').update(payload).eq('id',id):await client.from('hebergements').insert(payload);if(q.error)throw q.error;await load();closeEditors();alert('Hébergement enregistré en ligne.');}catch(e){alert('Impossible d’enregistrer: '+e.message);}};
  function renderHotels(){$('hotelList').innerHTML=cache.hotels.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🏨'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.telephone||'')}</p><button class="btn small" onclick="editHotel(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteHotel(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun hébergement.</p>';}

  window.newMedia=()=>{$('mediaForm').hidden=false;$('mId').value='';$('mTitle').value='';$('mDesc').value='';$('mFile').value='';$('mType').value='photo';};
  window.deleteMedia=async id=>{if(!confirm('Supprimer ce média ?'))return;const x=cache.media.find(z=>z.id===id);const q=await client.from('galerie').delete().eq('id',id);if(q.error)alert(q.error.message);else{if(x?.fichier_url)await removeUrl(x.fichier_url);await load();}};
  $('mediaForm').onsubmit=async e=>{e.preventDefault();try{const file=$('mFile').files[0];if(!file)throw new Error('Choisissez un fichier.');const type=$('mType').value;const url=await upload(file,type==='video'?'videos':'gallery');const q=await client.from('galerie').insert({titre:$('mTitle').value.trim()||file.name,description:$('mDesc').value.trim(),type,fichier_url:url,categorie:'Tsaranoro',actif:true});if(q.error)throw q.error;await load();closeEditors();alert('Média publié en ligne.');}catch(e){alert('Impossible de publier: '+e.message);}};
  function renderMedia(){$('mediaList').innerHTML=cache.media.map(x=>`<article class="admin-card"><div class="thumb">${x.type==='video'?'🎥':`<img src="${esc(x.fichier_url)}">`}</div><div><h3>${esc(x.titre)}</h3><p>${esc(x.type)}</p><a class="btn small" href="${esc(x.fichier_url)}" target="_blank">Voir</a> <button class="btn small danger" onclick="deleteMedia(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun média.</p>';}

  function renderReservations(){$('reservationList').innerHTML=cache.reservations.map(x=>`<article class="reservation"><div><h3>📅 ${esc(x.nom||'Client')}</h3><p>${esc(x.type_reservation||'')} · ${esc(x.date_souhaitee||'')} · ${esc(x.nombre_personnes||'')}</p><p>${esc(x.email||'')} · ${esc(x.whatsapp||'')}</p><p>${esc(x.message||'')}</p></div><select onchange="reservationStatus(${x.id},this.value)"><option ${x.statut==='Nouvelle'?'selected':''}>Nouvelle</option><option ${x.statut==='Confirmée'?'selected':''}>Confirmée</option><option ${x.statut==='Refusée'?'selected':''}>Refusée</option></select><button class="btn small danger" onclick="deleteReservation(${x.id})">🗑️</button></article>`).join('')||'<p class="empty">Aucune réservation.</p>';}
  window.reservationStatus=async(id,statut)=>{const q=await client.from('reservations').update({statut}).eq('id',id);if(q.error)alert(q.error.message);else load();};
  window.deleteReservation=async id=>{if(!confirm('Supprimer cette réservation ?'))return;const q=await client.from('reservations').delete().eq('id',id);if(q.error)alert(q.error.message);else load();};

  window.showPanel=async()=>{ $('loginBox').hidden=true;$('panel').hidden=false;await load(); };
  window.logout=async()=>{await client.auth.signOut();location.reload();};
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.admin-section').forEach(s=>s.hidden=true);$(b.dataset.tab).hidden=false;});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
