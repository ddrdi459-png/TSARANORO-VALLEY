/* TSARANORO VALLEY ADMIN v2 - no global `const supabase` collision */
(() => {
  const client = window.supabase.createClient(
    window.TSARANORO_SUPABASE_URL,
    window.TSARANORO_SUPABASE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true } }
  );
  window.tsaranoroAdmin = client;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  let cache = { circuits: [], activities: [], hotels: [], reservations: [], videos: [] };

  async function loadAll() {
    try {
      const [c,a,h,r,v] = await Promise.all([
        client.from('circuits').select('*').order('id'),
        client.from('activites').select('*').order('id'),
        client.from('hebergements').select('*').order('id'),
        client.from('reservations').select('*').order('created_at', {ascending:false}),
        client.from('galerie').select('*').eq('type','video').order('created_at',{ascending:false})
      ]);
      for (const q of [c,a,h,r,v]) if (q.error) throw q.error;
      cache = {circuits:c.data||[], activities:a.data||[], hotels:h.data||[], reservations:r.data||[], videos:v.data||[]};
      renderAll();
    } catch(e) { alert('Erreur Supabase: ' + e.message); }
  }

  window.showPanel = async function() {
    $('loginBox').hidden = true;
    $('panel').hidden = false;
    await loadAll();
  };
  window.logout = async function() { await client.auth.signOut(); location.reload(); };

  document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.admin-section').forEach(s=>s.hidden=true);
    $(b.dataset.tab).hidden=false;
  });

  function renderAll(){
    renderCircuits(); renderActivities(); renderHotels(); renderReservations(); renderVideos();
    $('stats').innerHTML = `<div><b>${cache.circuits.length}</b><span>Circuits</span></div><div><b>${cache.activities.length}</b><span>Activités</span></div><div><b>${cache.hotels.length}</b><span>Hébergements</span></div><div><b>${cache.reservations.filter(x=>x.statut==='Nouvelle').length}</b><span>Nouvelles réservations</span></div><div><b>${cache.videos.length}</b><span>Vidéos</span></div>`;
  }

  window.newCircuit=()=>{ $('circuitForm').hidden=false; $('editId').value=''; ['cName','cDuration','cPrice','cDesc','cItinerary','cPoints'].forEach(i=>$(i).value=''); $('cDifficulty').value='unknown'; $('photoPreview').innerHTML=''; };
  window.editCircuit=id=>{ const x=cache.circuits.find(z=>z.id===id); if(!x)return; $('circuitForm').hidden=false; $('editId').value=x.id; $('cName').value=x.nom||''; $('cDuration').value=x.duree||''; $('cPrice').value=x.prix||''; $('cDesc').value=x.description||''; $('cItinerary').value=x.itinerary||''; $('cPoints').value=x.points||''; $('cDifficulty').value=String(x.difficulte||'').includes('Difficile')?'hard':String(x.difficulte||'').includes('Assez facile')?'medium':String(x.difficulte||'').includes('Facile')?'easy':'unknown'; };
  window.deleteCircuit=async id=>{if(!confirm('Supprimer ce circuit ?'))return; const q=await client.from('circuits').delete().eq('id',id); if(q.error)alert(q.error.message); else loadAll();};
  $('circuitForm').onsubmit=async e=>{e.preventDefault(); const id=Number($('editId').value); const payload={nom:$('cName').value.trim(),duree:$('cDuration').value.trim(),difficulte:$('cDifficulty').value==='hard'?'🔴 Difficile':$('cDifficulty').value==='medium'?'🟡 Assez facile':$('cDifficulty').value==='easy'?'🟢 Facile':'⚪ À compléter',prix:$('cPrice').value.trim()||'Sur demande',description:$('cDesc').value.trim(),itinerary:$('cItinerary').value.trim(),points:$('cPoints').value.trim(),actif:true}; const q=id?await client.from('circuits').update(payload).eq('id',id):await client.from('circuits').insert(payload); if(q.error)alert(q.error.message); else {await loadAll();closeEditors();alert('Circuit enregistré en ligne.');}};
  function renderCircuits(){ $('circuitList').innerHTML=cache.circuits.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🌄'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.difficulte||'')} · ⏱️ ${esc(x.duree||'—')}</p><button class="btn small" onclick="editCircuit(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteCircuit(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun circuit.</p>'; }

  window.newActivity=()=>{ $('activityForm').hidden=false; $('aId').value=''; $('aName').value=''; $('aPrice').value=''; $('aDesc').value=''; $('aPhoto').value=''; };
  window.editActivity=id=>{const x=cache.activities.find(z=>z.id===id);if(!x)return;$('activityForm').hidden=false;$('aId').value=x.id;$('aName').value=x.nom||'';$('aPrice').value=x.prix||'';$('aDesc').value=x.description||'';};
  window.deleteActivity=async id=>{if(!confirm('Supprimer cette activité ?'))return;const q=await client.from('activites').delete().eq('id',id);if(q.error)alert(q.error.message);else loadAll();};
  $('activityForm').onsubmit=async e=>{e.preventDefault();const id=Number($('aId').value);const payload={nom:$('aName').value.trim(),prix:$('aPrice').value.trim()||'Sur demande',description:$('aDesc').value.trim(),actif:true};const q=id?await client.from('activites').update(payload).eq('id',id):await client.from('activites').insert(payload);if(q.error)alert(q.error.message);else{await loadAll();closeEditors();alert('Activité enregistrée en ligne.');}};
  function renderActivities(){ $('activityList').innerHTML=cache.activities.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🏄'}</div><div><h3>${esc(x.nom)}</h3><p>${esc(x.prix||'Sur demande')}</p><p>${esc(x.description||'')}</p><button class="btn small" onclick="editActivity(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteActivity(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucune activité.</p>'; }

  window.newHotel=()=>{ $('hotelForm').hidden=false;$('hId').value='';['hName','hPhone','hWhatsApp','hPrice','hImage','hDesc','hServices'].forEach(i=>$(i).value=''); };
  window.editHotel=id=>{const x=cache.hotels.find(z=>z.id===id);if(!x)return;$('hotelForm').hidden=false;$('hId').value=x.id;$('hName').value=x.nom||'';$('hPhone').value=x.telephone||'';$('hWhatsApp').value=x.whatsapp||'';$('hPrice').value=x.prix||'';$('hImage').value=x.image_url||'';$('hDesc').value=x.description||'';$('hServices').value=x.services||'';};
  window.deleteHotel=async id=>{if(!confirm('Supprimer cet hébergement ?'))return;const q=await client.from('hebergements').delete().eq('id',id);if(q.error)alert(q.error.message);else loadAll();};
  $('hotelForm').onsubmit=async e=>{e.preventDefault();const id=Number($('hId').value);const payload={nom:$('hName').value.trim(),telephone:$('hPhone').value.trim(),whatsapp:$('hWhatsApp').value.trim(),prix:$('hPrice').value.trim()||'Sur demande',description:$('hDesc').value.trim(),services:$('hServices').value.trim(),image_url:$('hImage').value.trim()||null,actif:true};const q=id?await client.from('hebergements').update(payload).eq('id',id):await client.from('hebergements').insert(payload);if(q.error)alert(q.error.message);else{await loadAll();closeEditors();alert('Hébergement enregistré en ligne.');}};
  function renderHotels(){ $('hotelList').innerHTML=cache.hotels.map(x=>`<article class="admin-card"><div class="thumb">${x.image_url?`<img src="${esc(x.image_url)}">`:'🏨'}</div><div><h3>${esc(x.nom)}</h3><p>📞 ${esc(x.telephone||'')} · 💬 ${esc(x.whatsapp||'')}</p><button class="btn small" onclick="editHotel(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteHotel(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucun hébergement.</p>'; }

  function renderReservations(){ $('reservationList').innerHTML=cache.reservations.map(x=>`<article class="reservation"><div><h3>📅 ${esc(x.nom||'Client')}</h3><p><b>${esc(x.type_reservation||'')}</b> · ${esc(x.date_souhaitee||'')} · ${esc(x.nombre_personnes||'')} personne(s)</p><p>🌍 ${esc(x.pays||'')} · ${esc(x.email||'')} · ${esc(x.whatsapp||'')}</p><p>${esc(x.message||'')}</p></div><select onchange="reservationStatus(${x.id},this.value)"><option ${x.statut==='Nouvelle'?'selected':''}>Nouvelle</option><option ${x.statut==='Confirmée'?'selected':''}>Confirmée</option><option ${x.statut==='Refusée'?'selected':''}>Refusée</option></select><button class="btn small danger" onclick="deleteReservation(${x.id})">🗑️</button></article>`).join('')||'<p class="empty">Aucune réservation.</p>'; }
  window.reservationStatus=async(id,statut)=>{const q=await client.from('reservations').update({statut}).eq('id',id);if(q.error)alert(q.error.message);else loadAll();};
  window.deleteReservation=async id=>{if(!confirm('Supprimer cette réservation ?'))return;const q=await client.from('reservations').delete().eq('id',id);if(q.error)alert(q.error.message);else loadAll();};

  window.newVideo=()=>{ $('videoForm').hidden=false;$('vId').value='';$('vTitle').value='';$('vDesc').value='';$('vFile').value='';$('vPreview').innerHTML=''; };
  window.deleteVideo=async id=>{if(!confirm('Supprimer cette vidéo ?'))return;const q=await client.from('galerie').delete().eq('id',id);if(q.error)alert(q.error.message);else loadAll();};
  function renderVideos(){ $('videoList').innerHTML=cache.videos.map(x=>`<article class="admin-card"><div class="thumb">🎥</div><div><h3>${esc(x.titre)}</h3><p>${esc(x.description||'')}</p><a class="btn small" href="${esc(x.fichier_url)}" target="_blank">Voir</a> <button class="btn small danger" onclick="deleteVideo(${x.id})">🗑️ Supprimer</button></div></article>`).join('')||'<p class="empty">Aucune vidéo.</p>'; }
  window.closeEditors=()=>document.querySelectorAll('.editor').forEach(f=>f.hidden=true);
})();
