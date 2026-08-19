(() => {
  const sb = window.supabase.createClient(window.TSARANORO_SUPABASE_URL, window.TSARANORO_SUPABASE_KEY, { auth:{persistSession:true,autoRefreshToken:true} });
  window.tsaranoroAdmin = sb;
  const UID = window.TSARANORO_ADMIN_UID || '5b530036-4836-4db0-87f2-c1de569e73b5';
  const EMAIL = window.TSARANORO_ADMIN_EMAIL || 'tsaranoroo.admin@gmail.com';
  const BUCKET = 'tsaranoro-media';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  let data={circuits:[],activities:[],guides:[],hotels:[],reservations:[],media:[]};

  async function user(){ const {data:{user},error}=await sb.auth.getUser(); if(error) throw error; return user; }
  async function requireAdmin(){ const u=await user(); if(!u || u.id!==UID) throw new Error('Compte administrateur non autorisé.'); return u; }
  async function upload(file,folder){
    if(!file) return null; await requireAdmin();
    const name=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
    const path=`${folder}/${Date.now()}-${crypto.randomUUID()}-${name}`;
    const {error}=await sb.storage.from(BUCKET).upload(path,file,{upsert:false,cacheControl:'31536000',contentType:file.type||undefined});
    if(error) throw error;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  async function removeFile(url){
    if(!url || !url.includes(`/storage/v1/object/public/${BUCKET}/`)) return;
    const path=decodeURIComponent(url.split(`/storage/v1/object/public/${BUCKET}/`)[1]);
    if(path) await sb.storage.from(BUCKET).remove([path]);
  }
  function closeEditors(){document.querySelectorAll('.editor').forEach(x=>x.hidden=true);}
  window.closeEditors=closeEditors;
  function statusButton(table,id,active){return `<button class="btn small" onclick="toggleActive('${table}',${id},${!active})">${active?'👁️ Publié':'🚫 Caché'}</button>`;}
  window.toggleActive=async(table,id,active)=>{try{await requireAdmin();const {error}=await sb.from(table).update({actif}).eq('id',id);if(error)throw error;await load();}catch(e){alert('Impossible de modifier la visibilité : '+e.message);}};

  async function load(){
    try{
      await requireAdmin();
      const [c,a,g,h,r,m]=await Promise.all([
        sb.from('circuits').select('*').order('id'),
        sb.from('activites').select('*').order('id'),
        sb.from('guides').select('*').order('id'),
        sb.from('hebergements').select('*').order('id'),
        sb.from('reservations').select('*').order('created_at',{ascending:false}),
        sb.from('galerie').select('*').order('created_at',{ascending:false})
      ]);
      for(const q of [c,a,g,h,r,m]) if(q.error) throw q.error;
      data={circuits:c.data||[],activities:a.data||[],guides:g.data||[],hotels:h.data||[],reservations:r.data||[],media:m.data||[]};
      render();
    }catch(e){console.error(e);if(!$('panel').hidden) alert('Erreur Supabase : '+e.message);}
  }
  function render(){
    renderCircuits();renderActivities();renderGuides();renderHotels();renderReservations();renderMedia();
    $('stats').innerHTML=`<div><b>${data.circuits.length}</b><span>Circuits</span></div><div><b>${data.activities.length}</b><span>Activités</span></div><div><b>${data.hotels.length}</b><span>Hébergements</span></div><div><b>${data.reservations.filter(x=>x.statut==='Nouvelle').length}</b><span>Nouvelles réservations</span></div><div><b>${data.media.filter(x=>x.type==='video').length}</b><span>Vidéos</span></div>`;
  }

  window.newCircuit=()=>{$('circuitForm').hidden=false;$('editId').value='';['cName','cDuration','cPrice','cDesc','cItinerary','cPoints'].forEach(i=>$(i).value='');$('cDifficulty').value='unknown';$('cPhotos').value='';$('photoPreview').innerHTML='';};
  window.editCircuit=id=>{const x=data.circuits.find(z=>z.id===id);if(!x)return;$('circuitForm').hidden=false;$('editId').value=x.id;$('cName').value=x.nom||'';$('cDuration').value=x.duree||'';$('cPrice').value=x.prix||'';$('cDesc').value=x.description||'';$('cItinerary').value=x.itinerary||'';$('cPoints').value=x.points||'';$('cDifficulty').value=String(x.difficulte||'').includes('Difficile')?'hard':String(x.difficulte||'').includes('Assez facile')?'medium':String(x.difficulte||'').includes('Facile')?'easy':'unknown';$('photoPreview').innerHTML=(x.images||[]).map(u=>`<div class="media-chip"><img src="${esc(u)}"><button type="button" onclick="removeCircuitPhoto(${x.id},'${encodeURIComponent(u)}')">🗑️</button></div>`).join('');};
  window.removeCircuitPhoto=async(id,encoded)=>{try{await requireAdmin();const x=data.circuits.find(z=>z.id===id);const url=decodeURIComponent(encoded);const images=(x?.images||[]).filter(u=>u!==url);const {error}=await sb.from('circuits').update({images,image_url:images[0]||null}).eq('id',id);if(error)throw error;await removeFile(url);await load();window.editCircuit(id);}catch(e){alert(e.message);}};
  window.deleteCircuit=async id=>{if(!confirm('Supprimer ce circuit ?'))return;try{await requireAdmin();const x=data.circuits.find(z=>z.id===id);const {error}=await sb.from('circuits').delete().eq('id',id);if(error)throw error;for(const u of (x?.images||[]))await removeFile(u);await load();}catch(e){alert(e.message);}};
  $('circuitForm').onsubmit=async e=>{e.preventDefault();try{await requireAdmin();const id=Number($('editId').value);const old=data.circuits.find(x=>x.id===id);let images=[...(old?.images||[])];for(const f of $('cPhotos').files||[]){const u=await upload(f,'circuits');if(u)images.push(u);}const payload={nom:$('cName').value.trim(),duree:$('cDuration').value.trim(),difficulte:$('cDifficulty').value==='hard'?'🔴 Difficile':$('cDifficulty').value==='medium'?'🟡 Assez facile':$('cDifficulty').value==='easy'?'🟢 Facile':'⚪ À compléter',prix:$('cPrice').value.trim()||'Sur demande',description:$('cDesc').value.trim(),itinerary:$('cItinerary').value.trim(),points:$('cPoints').value.trim(),images,image_url:images[0]||null,actif:old?.actif??true};const q=id?await sb.from('circuits').update(payload).eq('id',id):await sb.from('circuits').insert(payload);if(q.error)throw q.error;await load();closeEditors();alert('Circuit enregistré en ligne.');}catch(e){alert('Impossible d’enregistrer : '+e.message);}};
  function renderCircuits(){$('circuitList').innerHTML=data.circuits.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🌄'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.difficulte||'')} · ⏱️ ${esc(x.duree||'—')}</p>${statusButton('circuits',x.id,x.actif)} <button class="btn small" onclick="editCircuit(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteCircuit(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun circuit.</p>';}

  window.newActivity=()=>{$('activityForm').hidden=false;$('aId').value='';['aName','aPrice','aDesc'].forEach(i=>$(i).value='');$('aPhoto').value='';};
  window.editActivity=id=>{const x=data.activities.find(z=>z.id===id);if(!x)return;$('activityForm').hidden=false;$('aId').value=x.id;$('aName').value=x.nom||'';$('aPrice').value=x.prix||'';$('aDesc').value=x.description||'';};
  window.deleteActivity=async id=>{if(!confirm('Supprimer cette activité ?'))return;try{await requireAdmin();const x=data.activities.find(z=>z.id===id);const {error}=await sb.from('activites').delete().eq('id',id);if(error)throw error;if(x?.image_url)await removeFile(x.image_url);await load();}catch(e){alert(e.message);}};
  $('activityForm').onsubmit=async e=>{e.preventDefault();try{await requireAdmin();const id=Number($('aId').value),old=data.activities.find(x=>x.id===id);let image=old?.image_url||null;if($('aPhoto').files[0]){if(image)await removeFile(image);image=await upload($('aPhoto').files[0],'activites');}const q=id?await sb.from('activites').update({nom:$('aName').value.trim(),prix:$('aPrice').value.trim()||'Sur demande',description:$('aDesc').value.trim(),image_url:image,actif:old?.actif??true}).eq('id',id):await sb.from('activites').insert({nom:$('aName').value.trim(),prix:$('aPrice').value.trim()||'Sur demande',description:$('aDesc').value.trim(),image_url:image,actif:true});if(q.error)throw q.error;await load();closeEditors();alert('Activité enregistrée en ligne.');}catch(e){alert('Impossible d’enregistrer : '+e.message);}};
  function renderActivities(){$('activityList').innerHTML=data.activities.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🏄'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.prix||'Sur demande')}</p>${statusButton('activites',x.id,x.actif)} <button class="btn small" onclick="editActivity(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteActivity(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucune activité.</p>';}

  window.newGuide=()=>{$('guideForm').hidden=false;$('gId').value='';['gName','gLang','gSpec','gDesc'].forEach(i=>$(i).value='');$('gPhoto').value='';};
  window.editGuide=id=>{const x=data.guides.find(z=>z.id===id);if(!x)return;$('guideForm').hidden=false;$('gId').value=x.id;$('gName').value=x.nom||'';$('gLang').value=x.langues||'';$('gSpec').value=x.specialites||'';$('gDesc').value=x.description||'';};
  window.deleteGuide=async id=>{if(!confirm('Supprimer ce guide ?'))return;try{await requireAdmin();const x=data.guides.find(z=>z.id===id);const {error}=await sb.from('guides').delete().eq('id',id);if(error)throw error;if(x?.image_url)await removeFile(x.image_url);await load();}catch(e){alert(e.message);}};
  $('guideForm').onsubmit=async e=>{e.preventDefault();try{await requireAdmin();const id=Number($('gId').value),old=data.guides.find(x=>x.id===id);let image=old?.image_url||null;if($('gPhoto').files[0]){if(image)await removeFile(image);image=await upload($('gPhoto').files[0],'guides');}const payload={nom:$('gName').value.trim(),langues:$('gLang').value.trim(),specialites:$('gSpec').value.trim(),description:$('gDesc').value.trim(),image_url:image,actif:old?.actif??true};const q=id?await sb.from('guides').update(payload).eq('id',id):await sb.from('guides').insert({...payload,actif:true});if(q.error)throw q.error;await load();closeEditors();alert('Guide enregistré en ligne.');}catch(e){alert('Impossible d’enregistrer : '+e.message);}};
  function renderGuides(){$('guideList').innerHTML=data.guides.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🧭'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.langues||'')}</p>${statusButton('guides',x.id,x.actif)} <button class="btn small" onclick="editGuide(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteGuide(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun guide.</p>';}

  window.newHotel=()=>{$('hotelForm').hidden=false;$('hId').value='';['hName','hPhone','hWhatsApp','hPrice','hImage','hDesc','hServices'].forEach(i=>$(i).value='');$('hPhoto').value='';};
  window.editHotel=id=>{const x=data.hotels.find(z=>z.id===id);if(!x)return;$('hotelForm').hidden=false;$('hId').value=x.id;$('hName').value=x.nom||'';$('hPhone').value=x.telephone||'';$('hWhatsApp').value=x.whatsapp||'';$('hPrice').value=x.prix||'';$('hImage').value=x.image_url||'';$('hDesc').value=x.description||'';$('hServices').value=x.services||'';};
  window.deleteHotel=async id=>{if(!confirm('Supprimer cet hébergement ?'))return;try{await requireAdmin();const x=data.hotels.find(z=>z.id===id);const {error}=await sb.from('hebergements').delete().eq('id',id);if(error)throw error;if(x?.image_url)await removeFile(x.image_url);await load();}catch(e){alert(e.message);}};
  $('hotelForm').onsubmit=async e=>{e.preventDefault();try{await requireAdmin();const id=Number($('hId').value),old=data.hotels.find(x=>x.id===id);let image=$('hImage').value.trim()||old?.image_url||null;if($('hPhoto').files[0]){if(old?.image_url)await removeFile(old.image_url);image=await upload($('hPhoto').files[0],'hotels');}const payload={nom:$('hName').value.trim(),telephone:$('hPhone').value.trim(),whatsapp:$('hWhatsApp').value.trim(),prix:$('hPrice').value.trim()||'Sur demande',description:$('hDesc').value.trim(),services:$('hServices').value.trim(),image_url:image,actif:old?.actif??true};const q=id?await sb.from('hebergements').update(payload).eq('id',id):await sb.from('hebergements').insert({...payload,actif:true});if(q.error)throw q.error;await load();closeEditors();alert('Hébergement enregistré en ligne.');}catch(e){alert('Impossible d’enregistrer : '+e.message);}};
  function renderHotels(){$('hotelList').innerHTML=data.hotels.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🏨'}</div><div><h3>${esc(x.nom)}</h3><p>📞 ${esc(x.telephone||'')} · 💬 ${esc(x.whatsapp||'')}</p>${statusButton('hebergements',x.id,x.actif)} <button class="btn small" onclick="editHotel(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteHotel(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun hébergement.</p>';}

  window.newMedia=()=>{$('mediaForm').hidden=false;$('mId').value='';$('mTitle').value='';$('mDesc').value='';$('mFile').value='';$('mType').value='photo';};
  window.deleteMedia=async id=>{if(!confirm('Supprimer ce média ?'))return;try{await requireAdmin();const x=data.media.find(z=>z.id===id);const {error}=await sb.from('galerie').delete().eq('id',id);if(error)throw error;if(x?.fichier_url)await removeFile(x.fichier_url);await load();}catch(e){alert(e.message);}};
  window.toggleMedia=async(id,active)=>{try{await requireAdmin();const {error}=await sb.from('galerie').update({actif}).eq('id',id);if(error)throw error;await load();}catch(e){alert(e.message);}};
  $('mediaForm').onsubmit=async e=>{e.preventDefault();try{await requireAdmin();const file=$('mFile').files[0];if(!file)throw new Error('Choisissez un fichier.');const type=$('mType').value;const url=await upload(file,type==='video'?'videos':'gallery');const {error}=await sb.from('galerie').insert({titre:$('mTitle').value.trim()||file.name,description:$('mDesc').value.trim(),type,fichier_url:url,categorie:'Tsaranoro',actif:true});if(error)throw error;await load();closeEditors();alert('Média publié en ligne. Il est maintenant visible par les visiteurs.');}catch(e){alert('Impossible de publier : '+e.message);}};
  function renderMedia(){$('mediaList').innerHTML=data.media.map(x=>`<article class="admin-card"><div class="thumb">${x.type==='video'?'🎥':`<img src="${esc(x.fichier_url)}">`}</div><div><h3>${esc(x.titre)}</h3><p>${esc(x.type)} · ${x.actif?'Publié':'Caché'}</p>${x.type==='video'?`<a class="btn small" href="${esc(x.fichier_url)}" target="_blank">▶️ Voir</a>`:''} <button class="btn small" onclick="toggleMedia(${x.id},${!x.actif})">${x.actif?'🚫 Cacher':'👁️ Publier'}</button> <button class="btn small danger" onclick="deleteMedia(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun média.</p>';}

  function renderReservations(){$('reservationList').innerHTML=data.reservations.map(x=>`<article class="reservation"><div><h3>📅 ${esc(x.nom||'Client')}</h3><p>${esc(x.type_reservation||'')} · ${esc(x.date_souhaitee||'')} · ${esc(x.nombre_personnes||'')} personne(s)</p><p>🌍 ${esc(x.pays||'')} · ${esc(x.email||'')} · ${esc(x.whatsapp||'')}</p><p>${esc(x.message||'')}</p></div><select onchange="reservationStatus(${x.id},this.value)"><option ${x.statut==='Nouvelle'?'selected':''}>Nouvelle</option><option ${x.statut==='Confirmée'?'selected':''}>Confirmée</option><option ${x.statut==='Refusée'?'selected':''}>Refusée</option></select><button class="btn small danger" onclick="deleteReservation(${x.id})">🗑️</button></article>`).join('')||'<p class="empty">Aucune réservation.</p>';}
  window.reservationStatus=async(id,statut)=>{try{await requireAdmin();const {error}=await sb.from('reservations').update({statut}).eq('id',id);if(error)throw error;await load();}catch(e){alert(e.message);}};
  window.deleteReservation=async id=>{if(!confirm('Supprimer cette réservation ?'))return;try{await requireAdmin();const {error}=await sb.from('reservations').delete().eq('id',id);if(error)throw error;await load();}catch(e){alert(e.message);}};

  window.showPanel=async()=>{try{await requireAdmin();$('loginBox').hidden=true;$('panel').hidden=false;await load();}catch(e){$('loginBox').hidden=false;$('panel').hidden=true;}};
  window.logout=async()=>{await sb.auth.signOut();location.reload();};
  window.login=async()=>{const id=$('adminId').value.trim(),pass=$('adminPass').value,box=$('loginError');box.hidden=true;if(!id||!pass){box.textContent='Entrez votre identifiant et votre mot de passe.';box.hidden=false;return;}if(id!=='admin'){box.textContent='Identifiant administrateur incorrect.';box.hidden=false;return;}const {error}=await sb.auth.signInWithPassword({email:EMAIL,password:pass});if(error){box.textContent='Connexion impossible : '+error.message;box.hidden=false;return;}try{await showPanel();}catch(e){await sb.auth.signOut();box.textContent=e.message;box.hidden=false;}};
  window.resetPassword=async()=>{const box=$('loginError');const {error}=await sb.auth.resetPasswordForEmail(EMAIL,{redirectTo:location.origin+location.pathname});box.textContent=error?'Impossible d’envoyer le lien : '+error.message:'Un lien de réinitialisation a été envoyé à l’adresse administrateur.';box.hidden=false;};
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.admin-section').forEach(s=>s.hidden=true);$(b.dataset.tab).hidden=false;});
  sb.auth.getSession().then(({data:{session}})=>{if(session) showPanel();});
})();