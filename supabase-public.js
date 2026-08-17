(() => {
  const { createClient } = window.supabase;
  const sb = createClient(window.TSARANORO_SUPABASE_URL, window.TSARANORO_SUPABASE_KEY);
  const safe = v => String(v ?? '').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const json = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} };

  async function syncPublicData(){
    try {
      const [c,a,g,h,photos,videos] = await Promise.all([
        sb.from('circuits').select('*').eq('actif',true).order('id'),
        sb.from('activites').select('*').eq('actif',true).order('id'),
        sb.from('guides').select('*').eq('actif',true).order('id'),
        sb.from('hebergements').select('*').eq('actif',true).order('id'),
        sb.from('galerie').select('*').eq('type','photo').eq('actif',true).order('created_at',{ascending:false}),
        sb.from('galerie').select('*').eq('type','video').eq('actif',true).order('created_at',{ascending:false})
      ]);
      for(const q of [c,a,g,h,photos,videos]) if(q.error) throw q.error;

      const circuits=(c.data||[]).map(x=>({id:x.id,name:x.nom,difficulty:x.difficulte||'⚪ À compléter',duration:x.duree||'À définir',description:x.description||'',price:x.prix||'Sur demande',itinerary:x.itinerary||'',points:x.points||'',photos:Array.isArray(x.images)?x.images:(x.image_url?[x.image_url]:[])}));
      const activities=(a.data||[]).map(x=>({id:x.id,name:x.nom,duration:'Selon activité',price:x.prix||'Sur demande',difficulty:'À définir',description:x.description||'',trek:'',equipment:'',photo:x.image_url||''}));
      const guides=(g.data||[]).map(x=>({id:x.id,name:x.nom,description:x.description||'',phone:'',photo:x.image_url||''}));
      const hotels=(h.data||[]).map(x=>({id:x.id,name:x.nom,description:x.description||'',location:x.adresse||'Vallée de Tsaranoro, Madagascar',phone:x.telephone||'',whatsapp:x.whatsapp||'',price:x.prix||'Sur demande',photo:x.image_url||'',services:x.services||'',url:''}));
      json('tsaranoro_circuits_v2',circuits); json('tsaranoro_activities_v1',activities); json('tsaranoro_guides_v1',guides); json('tsaranoro_hotels_v1',hotels);
      window.TSARANORO_GALLERY = photos.data || [];
      window.TSARANORO_VIDEOS = videos.data || [];
      if(window.render) window.render();
      if(window.renderActivities) window.renderActivities();
      if(window.renderGuides) window.renderGuides();
      if(window.renderHotels) window.renderHotels();
      renderMedia();
    } catch(e) { console.warn('Supabase public sync:',e.message); }
  }

  function renderMedia(){
    const gallery=document.getElementById('galleryGrid');
    const videoRoot=document.getElementById('videoLibrary');
    if(gallery && window.TSARANORO_GALLERY?.length){ gallery.innerHTML=window.TSARANORO_GALLERY.map(x=>`<figure class="gallery-item"><img loading="lazy" src="${safe(x.fichier_url)}" alt="${safe(x.titre||'Tsaranoro Valley')}"><figcaption>${safe(x.titre||'Tsaranoro Valley')}</figcaption></figure>`).join(''); }
    if(videoRoot && window.TSARANORO_VIDEOS?.length){ videoRoot.innerHTML=window.TSARANORO_VIDEOS.map(x=>`<article class="video-card"><div class="video-heading"><span>🎬</span><div><h3>${safe(x.titre)}</h3><p>${safe(x.description||'')}</p></div></div><div class="video-frame"><video controls preload="metadata" playsinline src="${safe(x.fichier_url)}"></video></div></article>`).join(''); }
  }

  document.addEventListener('submit', async e => {
    if(e.target.id !== 'bookingForm') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const name=document.getElementById('name')?.value.trim();
    const country=document.getElementById('country')?.value.trim();
    const choice=document.getElementById('choice')?.value.trim();
    const guide=document.getElementById('guideChoice')?.value.trim();
    const hotel=document.getElementById('hotelChoice')?.value.trim();
    const date=document.getElementById('date')?.value||null;
    const people=Number(document.getElementById('people')?.value||1);
    const email=document.getElementById('email')?.value.trim()||null;
    const message=document.getElementById('message')?.value.trim()||'';
    if(!name||!country||!choice||!date) return alert('Veuillez remplir les champs obligatoires.');
    const fullMessage=`${message}${guide?`\nGuide: ${guide}`:''}${hotel?`\nHébergement: ${hotel}`:''}`.trim();
    const {error}=await sb.from('reservations').insert({nom:name,pays:country,whatsapp:null,email,date_souhaitee:date,nombre_personnes:people,type_reservation:choice,message:fullMessage,statut:'Nouvelle'});
    if(error){ alert('Impossible d’enregistrer la réservation en ligne: '+error.message); return; }
    const wa='261387134259';
    const text=`Bonjour TSARANORO VALLEY 🌿%0A%0AJe souhaite réserver :%0A• Nom : ${encodeURIComponent(name)}%0A• Pays : ${encodeURIComponent(country)}%0A• Choix : ${encodeURIComponent(choice)}%0A• Date : ${encodeURIComponent(date)}%0A• Personnes : ${people}%0A${guide?`• Guide : ${encodeURIComponent(guide)}%0A`:''}${hotel?`• Hébergement : ${encodeURIComponent(hotel)}%0A`:''}${email?`• Email : ${encodeURIComponent(email)}%0A`:''}${message?`• Message : ${encodeURIComponent(message)}%0A`:''}`;
    window.open(`https://wa.me/${wa}?text=${text}`,'_blank','noopener');
    alert('Réservation enregistrée. WhatsApp va maintenant s’ouvrir.');
    e.target.reset();
  }, true);

  syncPublicData();
  setInterval(syncPublicData, 60000);
})();
