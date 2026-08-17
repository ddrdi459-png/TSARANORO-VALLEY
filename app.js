const KEY="tsaranoro_circuits_v2", ACT="tsaranoro_activities_v1", HOT="tsaranoro_hotels_v1", RES="tsaranoro_reservations_v1", GUIDE_KEY="tsaranoro_guides_v1";

const defaults=[
["Circuit Buvoika Tsaranoro","🔴 Difficile","À compléter"],
["Circuit Buvoika Dondy","🔴 Difficile","À compléter"],
["Circuit Grand Tour Tsaranoro","🔴 Difficile","7h à 8h"],
["Circuit Caméléon","🟡 Assez facile","5h à 6h"],
["Forêt + Piscine naturelle + Village","🟢 Facile","3h à 4h"],
["Circuit Cascade","🟡 Assez facile","5h à 6h"],
["Circuit Dondy","🔴 Difficile","8h"],
["Circuit Pyramide","🔴 Difficile","5h à 6h"],
["Envers du Tsaranoro","⚪ À compléter","5h à 6h"]
];

const CURATED_CIRCUIT_PHOTOS=[
"assets/circuits/circuit-01.jpg",
"assets/circuits/circuit-02.webp",
"assets/circuits/circuit-03.jpg",
"assets/circuits/circuit-04.jpg",
"assets/circuits/circuit-05.jpg",
"assets/circuits/circuit-06.jpg",
"assets/circuits/circuit-07.jpg",
"assets/circuits/circuit-08.webp",
"assets/circuits/circuit-09.jpg"
];
const CURATED_ACTIVITY_PHOTOS={
Parapente:"https://paragliding.rocktheoutdoor.com/wp-content/uploads/bfi_thumb/parapente-vall%C3%A9e-de-Tsaranoro-1024x573-mte3ipbpsm292bht0whg9iyi5ma9fcbcg3i52t6k1s.jpg",
Escalade:"assets/activities/escalade.jpg",
Canoë:"assets/circuits/circuit-07.jpg"
};
const HERO_SHOWCASE=[
  {src:"assets/tsaranoro-cover-01.jpg",label:"Vallée de Tsaranoro",type:"Vallée"},
  {src:"assets/tsaranoro-cover-02.jpg",label:"Massif du Tsaranoro",type:"Montagne"},
  {src:"assets/tsaranoro-cover-03.jpg",label:"Tsaranoro • Andringitra",type:"Paysage"},
  {src:"assets/tsaranoro-cover-04.jpg",label:"Rizières au pied du Tsaranoro",type:"Vallée"}
];

function ensureCuratedPhotos(){
 const circuits=read(KEY,[]);
 if(circuits.length){
   let changed=false;
   circuits.forEach((x,i)=>{
     const current=Array.isArray(x.photos)&&x.photos.length?x.photos[0]:"";
     const oldFallback=!current || current.endsWith("assets/tsaranoro.jpg") || current.endsWith("assets/circuit-01.jpg");
     if(oldFallback){x.photos=[CURATED_CIRCUIT_PHOTOS[i]||CURATED_CIRCUIT_PHOTOS[0]];changed=true;}
   });
   if(changed) write(KEY,circuits);
 }
 const acts=read(ACT,[]);
 if(acts.length){
   let changed=false;
   acts.forEach(x=>{
     if(!x.photo && CURATED_ACTIVITY_PHOTOS[x.name]){x.photo=CURATED_ACTIVITY_PHOTOS[x.name];changed=true;}
   });
   if(changed) write(ACT,acts);
 }
}

const SITE_BACKGROUND_IMAGES=[
  "assets/tsaranoro.jpg",
  "assets/tsaranoro-03.webp",
  "assets/tsaranoro-04.jpg",
  "assets/tsaranoro-05.jpg",
  "assets/circuits/circuit-01.jpg",
  "assets/circuits/circuit-03.jpg",
  "assets/circuits/circuit-05.jpg",
  "assets/circuits/circuit-09.jpg"
];

function renderSiteBackground(){
 const root=document.getElementById("siteBackground");
 if(!root)return;
 root.innerHTML=SITE_BACKGROUND_IMAGES.map((src,i)=>`<span class="site-background-slide${i===0?" active":""}" style="background-image:url('${esc(src)}')"></span>`).join("");
 const slides=[...root.querySelectorAll(".site-background-slide")];
 let i=0;
 setInterval(()=>{
   i=(i+1)%slides.length;
   slides.forEach((slide,n)=>slide.classList.toggle("active",n===i));
 },7500);
}

function renderHeroShowcase(){
 const root=document.getElementById("heroSlideshow");
 const caption=document.getElementById("heroCaption");
 if(!root)return;
 root.innerHTML=HERO_SHOWCASE.map((x,i)=>`<span class="hero-slide${i===0?" active":""}" data-index="${i}" style="background-image:url('${esc(x.src)}')"></span>`).join("");
 const slides=[...root.querySelectorAll(".hero-slide")];
 let i=0;
 const update=()=>{
   slides.forEach((slide,n)=>slide.classList.toggle("active",n===i));
   const x=HERO_SHOWCASE[i];
   if(caption)caption.innerHTML=`<span class="hero-caption-kicker">${esc(x.type.toUpperCase())} • TSARANORO</span><span class="hero-caption-title">${esc(x.label)}</span>`;
 };
 update();
 setInterval(()=>{i=(i+1)%HERO_SHOWCASE.length;update();},7000);
}


const defaultActivities=[
{id:1001,name:"Parapente",duration:"Selon conditions",price:"",difficulty:"À définir",description:"Vol en parapente au-dessus de la vallée de Tsaranoro, dans un spot connu pour ses grands reliefs, ses décollages aménagés et ses paysages spectaculaires.",trek:"Départs selon la météo et les conditions du jour.",equipment:"Parapente, casque et équipement de sécurité.",photo:CURATED_ACTIVITY_PHOTOS.Parapente},
{id:1002,name:"Escalade",duration:"À définir",price:"",difficulty:"Du niveau initiation à confirmé",description:"Escalade sur les grandes parois granitiques du massif de Tsaranoro, avec possibilité d’initiation et de voies pour grimpeurs expérimentés.",trek:"Sites d’escalade du massif de Tsaranoro et secteurs adaptés au niveau du groupe.",equipment:"Corde, baudrier, casque, chaussons et matériel d’assurage.",photo:CURATED_ACTIVITY_PHOTOS.Escalade},
{id:1003,name:"Canoë",duration:"Selon site et conditions",price:"",difficulty:"À définir",description:"Activité nautique proposée selon les sites et conditions disponibles, pour compléter la découverte des paysages de la région.",trek:"Parcours déterminé selon la météo, le niveau d’eau et l’encadrement disponible.",equipment:"Canoë, pagaie et gilet de sauvetage.",photo:CURATED_ACTIVITY_PHOTOS.Canoë}
];
const defaultGuides=[
{id:1,name:"Guide local Tsaranoro",description:"Guide local recommandé pour découvrir la Vallée de Tsaranoro.",phone:"038 71 342 59",photo:""},
{id:2,name:"Guide Andringitra",description:"Accompagnement pour randonnée, trek et découverte des villages.",phone:"038 71 342 59",photo:""}
];
const defaultHotels=[
{id:1,name:"Tsarasoa Lodge",description:"Perma lodge au cœur de Sahanambo, dans la vallée de Tsaranoro, au pied du Langela. Hébergements authentiques, cuisine locale et démarche écoresponsable, avec une cuisine locale et des solutions énergétiques à faible impact.",location:"Vallée de Tsaranoro, Madagascar",url:"",logo:"https://www.google.com/s2/favicons?domain=tsarasoa.com&sz=256",photo:"assets/hotels/tsarasoa-view.jpg",photoAlt:"Vue de la vallée de Tsaranoro depuis le secteur de Tsarasoa Lodge",services:"Bungalows, cases rondes, maison familiale, camping, cuisine bio et locale."},
{id:2,name:"Camp Catta",description:"Camp situé au pied de la falaise du Tsaranoro, avec bungalows, tentes et emplacements, ainsi qu'une restauration sur place. Activités proposées autour du camp : balade, randonnée, trek, escalade et parapente.",location:"Vallée de Tsaranoro, Madagascar",url:"",logo:"https://www.google.com/s2/favicons?domain=campcatta.com&sz=256",photo:"assets/hotels/camp-catta-room.jpg",photoAlt:"Chambre d'un bungalow du Camp Catta",services:"Bungalows, tentes, emplacements, pension complète ou demi-pension, snack-bar."}
];

function read(k,f=[]){try{const v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:f}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){console.warn("Stockage local indisponible ou plein",e);return false}}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
const DEFAULT_CIRCUIT_DESCRIPTIONS={
"Circuit Buvoika Tsaranoro":"Balade et randonnée au cœur de la vallée pour découvrir les grands reliefs, les paysages et les villages autour du Tsaranoro.",
"Circuit Buvoika Dondy":"Itinéraire vers les reliefs du Dondy, avec de beaux panoramas sur les massifs et la vallée de Tsaranoro.",
"Circuit Grand Tour Tsaranoro":"Grande boucle d’aventure autour du massif de Tsaranoro, avec passages de randonnée et points de vue spectaculaires.",
"Circuit Caméléon":"Randonnée vers le secteur du Caméléon, entre forêt, reliefs rocheux et vues ouvertes sur la vallée.",
"Forêt + Piscine naturelle + Village":"Journée douce entre forêt, eau, paysages ruraux et découverte de la vie locale dans les villages voisins.",
"Circuit Cascade":"Randonnée vers une cascade dans un environnement naturel, idéale pour profiter des paysages et faire une pause au bord de l’eau.",
"Circuit Dondy":"Parcours sportif dans le massif du Dondy, destiné aux visiteurs qui recherchent une aventure plus engagée et de grands panoramas.",
"Circuit Pyramide":"Ascension et découverte d’un relief emblématique de Tsaranoro, avec vues dégagées sur la vallée et les parois granitiques.",
"Envers du Tsaranoro":"Randonnée vers l’envers du Tsaranoro, au travers de la forêt et des reliefs rocheux, avec un point de vue remarquable sur la région."
};
function circuitsData(){let a=read(KEY,[]);if(!a.length){a=defaults.map((d,i)=>({id:i+1,name:d[0],difficulty:d[1],duration:d[2],description:DEFAULT_CIRCUIT_DESCRIPTIONS[d[0]]||"Découvrez les paysages de la Vallée de Tsaranoro.",price:"",itinerary:"",points:"",photos:[]}));write(KEY,a)}else{let changed=false;a.forEach(x=>{if(!x.description){x.description=DEFAULT_CIRCUIT_DESCRIPTIONS[x.name]||"Découvrez les paysages de la Vallée de Tsaranoro.";changed=true;}});if(changed)write(KEY,a)}return a}
function activityData(){let a=read(ACT,[]);if(!a.length){a=defaultActivities;write(ACT,a)}return a}
function guideData(){let a=read(GUIDE_KEY,[]);if(!a.length){a=defaultGuides;write(GUIDE_KEY,a)}return a}
function hotelData(){let a=read(HOT,[]);const seedKey=HOT+"_seed_v3";if(!a.length){a=defaultHotels;write(HOT,a);localStorage.setItem(seedKey,"1");return a}let changed=false;a.forEach(x=>{const d=defaultHotels.find(h=>h.name===x.name);if(d){for(const k of ["description","location","url","logo","photo","photoAlt","services"]){if(!x[k]&&d[k]){x[k]=d[k];changed=true}}}});defaultHotels.forEach(d=>{if(!a.some(x=>x.name===d.name)){a.push(d);changed=true}});if(changed)write(HOT,a);localStorage.setItem(seedKey,"1");return a}

/* ===== Vidéos locales depuis IndexedDB (Admin) ===== */
const PUBLIC_VIDEO_DB="tsaranoro_video_db_v2", PUBLIC_VIDEO_STORE="videos";
function openPublicVideoDB(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in window)){reject(new Error("IndexedDB unavailable"));return;}
  const r=indexedDB.open(PUBLIC_VIDEO_DB,1);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(PUBLIC_VIDEO_STORE))r.result.createObjectStore(PUBLIC_VIDEO_STORE,{keyPath:"id"});};
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
}
async function renderAdminVideosPublic(){
 const root=document.getElementById("videoLibrary"); if(!root)return;
 try{
  const db=await openPublicVideoDB();
  const a=await new Promise((res,rej)=>{const r=db.transaction(PUBLIC_VIDEO_STORE,"readonly").objectStore(PUBLIC_VIDEO_STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});
  if(!a.length)return;
  a.sort((x,y)=>(Number(x.order)||0)-(Number(y.order)||0));
  root.innerHTML=a.map(x=>`<article class="video-card"><div class="video-heading"><span>🎬</span><div><h3>${esc(x.title||"Vidéo Tsaranoro")}</h3><p>${esc(x.description||"")}</p></div></div><div class="video-frame"><video controls preload="metadata" playsinline src="${URL.createObjectURL(x.file)}"></video></div></article>`).join("");
 }catch(e){console.warn("Vidéos Admin non disponibles:",e);}
}

function render(){
 const a=circuitsData(), el=document.getElementById("circuitsList"), choice=document.getElementById("choice");
 el.innerHTML=a.map(x=>{const p=x.photos?.[0]||"assets/tsaranoro.jpg";return `<article class="card"><div class="photo media-zoom" style="background-image:url('${esc(p)}')"></div><h3>🥾 ${esc(x.name)}</h3><p>${esc(x.difficulty)} · ⏱️ ${esc(x.duration)}</p><p>${esc(x.description||"Découvrez les paysages de la Vallée de Tsaranoro.")}</p><button class="btn" onclick="openCircuit(${x.id})">Découvrir</button> <button class="btn" onclick="selectCircuit(${x.id})">Réserver</button></article>`}).join("");
 choice.innerHTML='<option value="">Choisir un circuit ou une activité</option>'+a.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join("");
}
function renderActivities(){
 const a=activityData(),el=document.getElementById("activitiesList");
 el.innerHTML=a.map(x=>`<article class="card" onclick="openDetail('activity',${x.id})" style="cursor:pointer"><div class="photo media-zoom" style="background-image:url('${esc(x.photo||CURATED_ACTIVITY_PHOTOS[x.name]||"assets/tsaranoro.jpg")}')"></div><h3>🏄 ${esc(x.name)}</h3><p>${esc(x.description||"")}</p>${x.duration?`<p>⏱️ ${esc(x.duration)}</p>`:""}<p>⭐ <b>Recommandé</b></p><button class="btn" onclick="event.stopPropagation();reserveActivity('${jsSafe(x.name)}')">Réserver</button></article>`).join("")||'<p class="empty">Aucune activité disponible.</p>';
}
function renderGuides(){
 const a=guideData(),el=document.getElementById("guidesList");
 el.innerHTML=a.map(g=>`<article class="card"><div class="photo" style="background-image:url('${esc(g.photo||"assets/tsaranoro.jpg")}')"></div><h3>👨‍🏫 ${esc(g.name)}</h3><p>${esc(g.description||"Guide local recommandé.")}</p><p>⭐ <b>Recommandé</b></p><button class="btn" onclick="openDetail('guide',${g.id})">Voir le guide</button> <button class="btn" onclick="reserveGuide('${jsSafe(g.name)}')">Réserver</button></article>`).join("");
 document.getElementById("guideChoice").innerHTML='<option value="">Choisir un guide (optionnel)</option>'+a.map(g=>`<option value="${esc(g.name)}">${esc(g.name)}</option>`).join("");
}
function renderHotelsPublic(){
 const a=hotelData(),el=document.getElementById("hotelsList");
 el.innerHTML=a.map(h=>`<article class="card hotel-card"><div class="hotel-photo"><img src="${esc(h.photo||"assets/tsaranoro.jpg")}" alt="${esc(h.photoAlt||h.name)}" onerror="this.src='assets/tsaranoro.jpg'"></div><div class="hotel-logo-frame"><img class="hotel-logo" src="${esc(h.logo||"assets/favicon.svg")}" alt="Logo ${esc(h.name)}" onerror="this.style.display='none';this.closest('.hotel-logo-frame').classList.add('logo-missing')"></div><h3>🏨 ${esc(h.name)}</h3><p>${esc(h.description||"")}</p><p>📍 ${esc(h.location||"")}</p>${h.services?`<p>🛎️ ${esc(h.services)}</p>`:""}<div class="card-actions"><button class="btn light" onclick="openDetail('hotel',${h.id})">Voir</button><button class="btn" onclick="reserveHotel('${jsSafe(h.name)}')">Réserver</button></div></article>`).join("");
 document.getElementById("hotelChoice").innerHTML='<option value="">Choisir un hébergement (optionnel)</option>'+a.map(h=>`<option value="${esc(h.name)}">${esc(h.name)}</option>`).join("");
}
function jsSafe(s){return String(s??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\r?\n/g," ")}
function selectCircuit(id){const x=circuitsData().find(z=>z.id===id);if(!x)return;document.getElementById("choice").value=x.name;document.getElementById("booking").scrollIntoView({behavior:"smooth"})}
function openCircuit(id){const x=circuitsData().find(z=>z.id===id);if(!x)return;document.getElementById("detailContent").innerHTML=`<div class="photo large" style="background-image:url('${esc(x.photos?.[0]||"assets/tsaranoro.jpg")}')"></div><h2>🥾 ${esc(x.name)}</h2><p>${esc(x.description||"Découvrez ce circuit à Tsaranoro.")}</p><p>⏱️ ${esc(x.duration||"À définir")} · ${esc(x.difficulty||"À définir")}</p>${x.itinerary?`<p><b>Itinéraire :</b> ${esc(x.itinerary)}</p>`:""}${x.points?`<p><b>Points importants :</b> ${esc(x.points)}</p>`:""}<button class="btn" onclick="selectCircuit(${x.id});closeDetail()">Réserver</button>`;document.getElementById("detailModal").hidden=false}
function openDetail(type,id){
 let x=type==="guide"?guideData().find(z=>z.id===id):type==="hotel"?hotelData().find(z=>z.id===id):activityData().find(z=>z.id===id);if(!x)return;
 const photo=x.photo||(x.photos&&x.photos[0])||"assets/tsaranoro.jpg";
 const title=type==="guide"?"👨‍🏫 "+x.name:type==="hotel"?"🏨 "+x.name:"🏄 "+x.name;
 const extra=type==="activity"?`<p>${esc(x.description||"")}</p>${x.duration?`<p>⏱️ ${esc(x.duration)}</p>`:""}${x.difficulty?`<p>📊 ${esc(x.difficulty)}</p>`:""}${x.trek?`<p>🥾 <b>Trek :</b> ${esc(x.trek)}</p>`:""}${x.equipment?`<p>🧰 <b>Matériel :</b> ${esc(x.equipment)}</p>`:""}`
 :`<p>${esc(x.description||"")}</p>${x.location?`<p>📍 ${esc(x.location)}</p>`:""}${x.phone?`<p>📞 ${esc(x.phone)}</p>`:""}${x.url?`<p><a href="${esc(x.url)}" target="_blank" rel="noopener">Voir le site web</a></p>`:""}`;
 const reserve=type==="activity"?`reserveActivity('${jsSafe(x.name)}')`:type==="guide"?`reserveGuide('${jsSafe(x.name)}')`:`reserveHotel('${jsSafe(x.name)}')`;
 document.getElementById("detailContent").innerHTML=`<div class="photo large" style="background-image:url('${esc(photo)}')"></div><h2>${esc(title)}</h2>${extra}<p>⭐ <b>Recommandé</b></p><button class="btn" onclick="${reserve}">Réserver</button>`;
 document.getElementById("detailModal").hidden=false;
}
function closeDetail(){document.getElementById("detailModal").hidden=true}
function reserveActivity(name){closeDetail();document.getElementById("choice").value="Activité : "+name;document.getElementById("booking").scrollIntoView({behavior:"smooth"})}
function reserveGuide(name){closeDetail();document.getElementById("guideChoice").value=name;document.getElementById("booking").scrollIntoView({behavior:"smooth"})}
function reserveHotel(name){closeDetail();document.getElementById("hotelChoice").value=name;document.getElementById("booking").scrollIntoView({behavior:"smooth"})}

const GALLERY_MEDIA=[
  {src:"assets/tsaranoro-cover-01.jpg",title:"Vallée de Tsaranoro",type:"Paysage"},
  {src:"assets/tsaranoro-cover-02.jpg",title:"Massif du Tsaranoro",type:"Montagne"},
  {src:"assets/tsaranoro-cover-03.jpg",title:"Tsaranoro • Andringitra",type:"Paysage"},
  {src:"assets/tsaranoro-cover-04.jpg",title:"Rizières au pied du massif",type:"Vallée"},
  ...CURATED_CIRCUIT_PHOTOS.map((src,i)=>({src,title:(defaults[i]||[])[0]||"Circuit Tsaranoro",type:"Circuit"})),
  {src:"assets/hotels/tsarasoa-view.jpg",title:"Tsarasoa Lodge",type:"Hébergement"},
  {src:"assets/hotels/camp-catta-room.jpg",title:"Camp Catta",type:"Hébergement"},
  {src:"assets/hotels/camp-catta-bedroom.jpg",title:"Camp Catta • Chambre",type:"Hébergement"}
];

function renderGallery(){
  const root=document.getElementById("galleryGrid");
  if(!root)return;
  root.innerHTML=GALLERY_MEDIA.map((x,i)=>`<button class="gallery-item" type="button" onclick="openGallery(${i})">
    <img src="${esc(x.src)}" alt="${esc(x.title)}" loading="lazy">
    <span class="gallery-overlay"><b>${esc(x.title)}</b><small>${esc(x.type)}</small></span>
  </button>`).join("");
}
function openGallery(i){
  const x=GALLERY_MEDIA[i];
  if(!x)return;
  document.getElementById("detailContent").innerHTML=`<img class="gallery-modal-image" src="${esc(x.src)}" alt="${esc(x.title)}"><h2>${esc(x.title)}</h2><p>📍 Vallée de Tsaranoro • Andringitra, Madagascar</p>`;
  document.getElementById("detailModal").hidden=false;
}

function whatsapp(message){window.open("https://wa.me/261387134259?text="+encodeURIComponent(message),"_blank","noopener")}
document.getElementById("wa").href="https://wa.me/261387134259?text="+encodeURIComponent("Bonjour, je souhaite visiter la Vallée de Tsaranoro et réserver un guide.");

document.getElementById("bookingForm").addEventListener("submit",e=>{
 e.preventDefault();
 const r={id:Date.now(),name:document.getElementById("name").value.trim(),country:document.getElementById("country").value.trim(),circuit:document.getElementById("choice").value,guide:document.getElementById("guideChoice").value,hotel:document.getElementById("hotelChoice").value,date:document.getElementById("date").value,people:document.getElementById("people").value,email:document.getElementById("email").value.trim(),phone:"",message:document.getElementById("message").value.trim(),status:"En attente"};
 const rs=read(RES,[]);rs.push(r);write(RES,rs);
 whatsapp(`Bonjour, je souhaite visiter la Vallée de Tsaranoro et faire une réservation.

Client : ${r.name}
Pays : ${r.country}
Circuit/Activité : ${r.circuit}
Guide : ${r.guide||"—"}
Hôtel : ${r.hotel||"—"}
Date : ${r.date}
Personnes : ${r.people}
Email : ${r.email||"—"}
Message : ${r.message||"—"}`);
});

document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDetail()});
ensureCuratedPhotos();renderSiteBackground();renderHeroShowcase();render();renderActivities();renderGuides();renderHotelsPublic();renderGallery();renderAdminVideosPublic();
