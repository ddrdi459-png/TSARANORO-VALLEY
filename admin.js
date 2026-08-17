const KEYS={videos:"tsaranoro_videos_v1",circuits:"tsaranoro_circuits_v2",activities:"tsaranoro_activities_v1",hotels:"tsaranoro_hotels_v1",reservations:"tsaranoro_reservations_v1"};
const AUTH="tsaranoro_admin_auth";
const defaults=[["Circuit Buvoika Tsaranoro","🔴 Difficile","À compléter"],["Circuit Buvoika Dondy","🔴 Difficile","À compléter"],["Circuit Grand Tour Tsaranoro","🔴 Difficile","7h à 8h"],["Circuit Caméléon","🟡 Assez facile","5h à 6h"],["Forêt + Piscine naturelle + Village","🟢 Facile","3h à 4h"],["Circuit Cascade","🟡 Assez facile","5h à 6h"],["Circuit Dondy","🔴 Difficile","8h"],["Circuit Pyramide","🔴 Difficile","5h à 6h"],["Envers du Tsaranoro","⚪ À compléter","5h à 6h"]];
const defaultActivities=[
  {id:1001,name:"Parapente",duration:"À définir",price:"",difficulty:"À définir",description:"Vol en parapente au-dessus des paysages de Tsaranoro.",trek:"",equipment:"Parapente, casque, équipement de sécurité.",photo:""},
  {id:1002,name:"Escalade",duration:"À définir",price:"",difficulty:"À définir",description:"Escalade sur les parois et sites adaptés de Tsaranoro.",trek:"",equipment:"Corde, baudrier, casque, chaussons d’escalade, matériel d’assurage.",photo:""},
  {id:1003,name:"Canoë",duration:"À définir",price:"",difficulty:"À définir",description:"Activité nautique en canoë selon les sites et conditions disponibles.",trek:"",equipment:"Canoë, pagaie, gilet de sauvetage, casque si nécessaire.",photo:""}
];
function activityData(){let a=read("activities");if(a.length)return a;write("activities",defaultActivities);return defaultActivities}
const $=id=>document.getElementById(id);
function read(k,f=[]){try{return JSON.parse(localStorage.getItem(KEYS[k]))||f}catch(e){return f}}
function write(k,v){localStorage.setItem(KEYS[k],JSON.stringify(v))}
function circuitData(){let a=read("circuits");if(a.length)return a;return defaults.map((d,i)=>({id:i+1,name:d[0],difficulty:d[1],duration:d[2],description:"",price:"",itinerary:"",points:"",photos:[]}))}
function login(){if($("adminUser").value==="admin"&&$("adminPass").value==="tsaranoro2026"){sessionStorage.setItem(AUTH,"1");show()}else alert("Identifiant ou mot de passe incorrect.")}
function logout(){sessionStorage.removeItem(AUTH);location.reload()}
function show(){$("loginBox").hidden=true;$("panel").hidden=false;renderAll()}
if(sessionStorage.getItem(AUTH)==="1")show();

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".admin-section").forEach(s=>s.hidden=true);$(b.dataset.tab).hidden=false});
function renderAll(){renderCircuits();renderActivities();renderHotels();renderReservations();renderVideos();stats()}
function stats(){let c=circuitData(),a=read("activities"),h=read("hotels"),r=read("reservations");$("stats").innerHTML=`<div><b>${c.length}</b><span>Circuits</span></div><div><b>${a.length}</b><span>Activités</span></div><div><b>${h.length}</b><span>Hébergements</span></div><div><b>${r.filter(x=>x.status==="En attente").length}</b><span>Réservations en attente</span></div><div><b>${videoData().length}</b><span>Vidéos</span></div>`}

function renderCircuits(){let a=circuitData();$("circuitList").innerHTML=a.map(x=>`<article class="admin-card"><div class="thumb">${x.photos?.[0]?`<img src="${x.photos[0]}">`:"🌄"}</div><div><h3>${esc(x.name)}</h3><p>${esc(x.difficulty||"")} · ⏱️ ${esc(x.duration||"—")}</p><p>📸 ${x.photos?.length||0} photo(s)</p><button class="btn small" onclick="editCircuit(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteCircuit(${x.id})">🗑️ Supprimer</button></div></article>`).join("")}
function newCircuit(){$("circuitForm").hidden=false;$("circuitFormTitle").textContent="Nouveau circuit";["editId","cName","cDuration","cPrice","cDesc","cItinerary","cPoints"].forEach(i=>$(i).value="");$("cDifficulty").value="unknown";$("photoPreview").innerHTML=""}
function editCircuit(id){let x=circuitData().find(z=>z.id===id);if(!x)return;$("circuitForm").hidden=false;$("circuitFormTitle").textContent="Modifier le circuit";$("editId").value=x.id;$("cName").value=x.name;$("cDuration").value=x.duration||"";$("cPrice").value=x.price||"";$("cDesc").value=x.description||"";$("cItinerary").value=x.itinerary||"";$("cPoints").value=x.points||"";$("cDifficulty").value=x.difficulty==="🔴 Difficile"?"hard":x.difficulty==="🟡 Assez facile"?"medium":x.difficulty==="🟢 Facile"?"easy":"unknown";renderPhotoManager("photoPreview",x.photos||[],"circuit")}
$("cPhotos").onchange=async()=>{let id=+$("editId").value;if(!id){alert("Enregistrez d'abord le circuit, puis ajoutez ses photos.");$("cPhotos").value="";return}let a=circuitData(),x=a.find(z=>z.id===id);for(const f of $("cPhotos").files)x.photos.push(await fileURL(f));write("circuits",a);renderPhotoManager("photoPreview",x.photos,"circuit");renderCircuits();stats();$("cPhotos").value=""}
$("circuitForm").onsubmit=e=>{e.preventDefault();let a=circuitData(),id=+$("editId").value||Date.now(),x=a.find(z=>z.id===id);if(!x){x={id,photos:[]};a.push(x)}Object.assign(x,{name:$("cName").value,duration:$("cDuration").value,price:$("cPrice").value,description:$("cDesc").value,itinerary:$("cItinerary").value,points:$("cPoints").value,difficulty:{hard:"🔴 Difficile",medium:"🟡 Assez facile",easy:"🟢 Facile",unknown:"⚪ À compléter"}[$("cDifficulty").value]});write("circuits",a);$("editId").value=id;renderAll();alert("Circuit enregistré.");}

function renderActivities(){let a=activityData();$("activityList").innerHTML=a.map(x=>`<article class="admin-card"><div class="thumb">${x.photo?`<img src="${x.photo}">`:"🏄"}</div><div><h3>${esc(x.name)}</h3><p>⏱️ ${esc(x.duration||"—")} · ${esc(x.difficulty||"")}</p><p>🧰 ${esc((x.equipment||"").slice(0,70))}</p><button class="btn small" onclick="editActivity(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteActivity(${x.id})">🗑️ Supprimer</button></div></article>`).join("")||'<p class="empty">Aucune activité.</p>'}
function newActivity(){$("activityForm").hidden=false;$("activityFormTitle").textContent="Nouvelle activité";["aId","aName","aDuration","aPrice","aDifficulty","aDesc","aTrek","aEquipment"].forEach(i=>$(i).value="");$("aPhoto").value="";$("aPhotoPreview").innerHTML=""}
async function editActivity(id){let x=read("activities").find(z=>z.id===id);if(!x)return;$("activityForm").hidden=false;$("activityFormTitle").textContent="Modifier l'activité";$("aId").value=x.id;$("aName").value=x.name;$("aDuration").value=x.duration||"";$("aPrice").value=x.price||"";$("aDifficulty").value=x.difficulty||"";$("aDesc").value=x.description||"";$("aTrek").value=x.trek||"";$("aEquipment").value=x.equipment||"";renderPhotoManager("aPhotoPreview",x.photo?[x.photo]:[],"activity")}
$("activityForm").onsubmit=async e=>{e.preventDefault();let a=activityData(),id=+$("aId").value||Date.now(),x=a.find(z=>z.id===id)||{id,photo:""};if($("aPhoto").files[0])x.photo=await fileURL($("aPhoto").files[0]);Object.assign(x,{name:$("aName").value,duration:$("aDuration").value,price:$("aPrice").value,difficulty:$("aDifficulty").value,description:$("aDesc").value,trek:$("aTrek").value,equipment:$("aEquipment").value});if(!a.includes(x))a.push(x);write("activities",a);renderAll();alert("Activité enregistrée.");}
function deleteActivity(id){if(confirm("Supprimer cette activité ?")){write("activities",read("activities").filter(x=>x.id!==id));renderAll()}}

function hotelData(){let a=read("hotels");const seedKey=KEYS.hotels+"_seed_v2";const d=[{id:1,name:"Tsarasoa Lodge",description:"Perma lodge au cœur de Sahanambo, dans la vallée de Tsaranoro, au pied du Langela. Hébergements authentiques, cuisine locale et engagement écologique.",location:"Vallée de Tsaranoro, Madagascar",url:"https://www.tsarasoa.com/",logo:"https://www.google.com/s2/favicons?domain=tsarasoa.com&sz=256",photo:"assets/hotels/tsarasoa-view.jpg",photoAlt:"Vue de la vallée depuis Tsarasoa Lodge",services:"Bungalows, cases rondes, maison familiale, camping, cuisine bio et locale."},{id:2,name:"Camp Catta",description:"Camp situé au pied de la falaise du Tsaranoro, avec bungalows, tentes et emplacements, et restauration. Point de départ pour balades, trek, escalade et parapente.",location:"Vallée de Tsaranoro, Madagascar",url:"",logo:"https://www.google.com/s2/favicons?domain=campcatta.com&sz=256",photo:"assets/hotels/camp-catta-room.jpg",photoAlt:"Chambre d'un bungalow du Camp Catta",services:"Bungalows, tentes, emplacements, pension complète ou demi-pension, snack-bar."}];if(!a.length){write("hotels",d);localStorage.setItem(seedKey,"1");return d}if(!localStorage.getItem(seedKey)){if(!a.some(x=>x.name==="Camp Catta")){a.push(d[1]);write("hotels",a)}localStorage.setItem(seedKey,"1")}return a}
function renderHotels(){let a=hotelData();$("hotelList").innerHTML=a.map(x=>`<article class="admin-card"><div class="thumb">${x.logo?`<img src="${x.logo}" onerror="this.src='assets/favicon.svg'">`:"🏨"}</div><div><h3>${esc(x.name)}</h3><p>📍 ${esc(x.location||"")}</p><p>📸 ${x.photos?.length||0} photo(s)</p><button class="btn small" onclick="editHotel(${x.id})">✏️ Modifier</button> <button class="btn small danger" onclick="deleteHotel(${x.id})">🗑️ Supprimer</button></div></article>`).join("")||'<p class="empty">Aucun hébergement.</p>'}
function newHotel(){$("hotelForm").hidden=false;$("hotelFormTitle").textContent="Nouvel hôtel";["hId","hName","hLocation","hPhone","hUrl","hLogo","hDesc","hServices"].forEach(i=>$(i).value="");$("hPhotos").value="";$("hPhotoPreview").innerHTML=""}
function editHotel(id){let x=read("hotels").find(z=>z.id===id);if(!x)return;$("hotelForm").hidden=false;$("hotelFormTitle").textContent="Modifier l'hôtel";$("hId").value=x.id;["hName","hLocation","hPhone","hUrl","hLogo","hDesc","hServices"].forEach(i=>$(i).value=x[{hName:"name",hLocation:"location",hPhone:"phone",hUrl:"url",hLogo:"logo",hDesc:"description",hServices:"services"}[i]]||"");renderPhotoManager("hPhotoPreview",x.photos||[],"hotel")}
$("hotelForm").onsubmit=async e=>{e.preventDefault();let a=hotelData(),id=+$("hId").value||Date.now(),x=a.find(z=>z.id===id)||{id,photos:[]};for(const f of $("hPhotos").files)x.photos.push(await fileURL(f));Object.assign(x,{name:$("hName").value,location:$("hLocation").value,phone:$("hPhone").value,url:$("hUrl").value,logo:$("hLogo").value,description:$("hDesc").value,services:$("hServices").value});if(!a.includes(x))a.push(x);write("hotels",a);renderAll();alert("Hébergement enregistré.");}
function deleteHotel(id){if(confirm("Supprimer cet hébergement ?")){write("hotels",hotelData().filter(x=>x.id!==id));renderAll()}}

function renderReservations(){let a=read("reservations");$("reservationList").innerHTML=a.length?a.slice().reverse().map(x=>`<article class="reservation"><div><h3>📅 ${esc(x.name||"Client")}</h3><p><b>${esc(x.circuit||"")}</b> · ${esc(x.date||"")} · ${esc(x.people||"")} personne(s)</p><p>🌍 ${esc(x.country||"")} · ${esc(x.email||"")} · ${esc(x.phone||"")}</p><p>${esc(x.message||"")}</p></div><select onchange="reservationStatus(${x.id},this.value)"><option ${x.status==="En attente"?"selected":""}>En attente</option><option ${x.status==="Confirmée"?"selected":""}>Confirmée</option><option ${x.status==="Refusée"?"selected":""}>Refusée</option></select><button class="btn small danger" onclick="deleteReservation(${x.id})">🗑️</button></article>`).join(""):'<p class="empty">Aucune réservation enregistrée.</p>'}
function reservationStatus(id,status){let a=read("reservations");let x=a.find(z=>z.id===id);if(x)x.status=status;write("reservations",a);renderAll()}
function deleteReservation(id){if(confirm("Supprimer cette réservation ?")){write("reservations",read("reservations").filter(x=>x.id!==id));renderAll()}}
function renderPhotoManager(target,photos,type){$(target).innerHTML=(photos||[]).map((p,i)=>`<div class="managed-photo"><img src="${p}"><button type="button" onclick="removeManagedPhoto('${type}',${i},${type==="circuit"?+$("editId").value:type==="activity"?+$("aId").value:+$("hId").value})">🗑️</button></div>`).join("")}
function removeManagedPhoto(type,i,id){if(type==="circuit"){let a=circuitData(),x=a.find(z=>z.id===id);x.photos.splice(i,1);write("circuits",a);renderPhotoManager("photoPreview",x.photos,type)}else if(type==="hotel"){let a=read("hotels"),x=a.find(z=>z.id===id);x.photos.splice(i,1);write("hotels",a);renderPhotoManager("hPhotoPreview",x.photos,type)}else{let a=read("activities"),x=a.find(z=>z.id===id);x.photo="";write("activities",a);renderPhotoManager("aPhotoPreview",[],type)}renderAll()}
function closeEditors(){document.querySelectorAll(".editor").forEach(x=>x.hidden=true)}
function deleteCircuit(id){if(confirm("Supprimer ce circuit et toutes ses photos ?")){write("circuits",circuitData().filter(x=>x.id!==id));closeEditors();renderAll()}}
function fileURL(f){return new Promise((res,rej)=>{let r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}


/* ==================== GESTION DES VIDÉOS — IndexedDB ==================== */
const VIDEO_DB="tsaranoro_video_db_v2";
const VIDEO_STORE="videos";

function openVideoDB(){
  return new Promise((resolve,reject)=>{
    if(!("indexedDB" in window)){reject(new Error("IndexedDB non disponible"));return;}
    const req=indexedDB.open(VIDEO_DB,1);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(VIDEO_STORE))db.createObjectStore(VIDEO_STORE,{keyPath:"id"});};
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function idbAll(){
  const db=await openVideoDB();
  return new Promise((resolve,reject)=>{const r=db.transaction(VIDEO_STORE,"readonly").objectStore(VIDEO_STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});
}
async function idbGet(id){
  const db=await openVideoDB();
  return new Promise((resolve,reject)=>{const r=db.transaction(VIDEO_STORE,"readonly").objectStore(VIDEO_STORE).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
async function idbPut(v){
  const db=await openVideoDB();
  return new Promise((resolve,reject)=>{const r=db.transaction(VIDEO_STORE,"readwrite").objectStore(VIDEO_STORE).put(v);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});
}
async function idbDelete(id){
  const db=await openVideoDB();
  return new Promise((resolve,reject)=>{const r=db.transaction(VIDEO_STORE,"readwrite").objectStore(VIDEO_STORE).delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});
}
function videoData(){return window.__videoCache||[]}
async function refreshVideoCache(){window.__videoCache=(await idbAll()).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));return window.__videoCache}
async function renderVideos(){
  try{
    const a=await refreshVideoCache();
    $("videoList").innerHTML=a.map(x=>`
      <article class="admin-card">
        <div class="thumb video-thumb">${x.file?`<video controls muted preload="metadata" src="${URL.createObjectURL(x.file)}"></video>`:"🎬"}</div>
        <div><h3>${esc(x.title)}</h3><p>📁 ${esc(x.fileName||"Fichier vidéo")} · ${Number(x.sizeMB||0).toFixed(1)} MB · Ordre ${Number(x.order)||0}</p>
        <p>${esc(x.description||"")}</p>
        <button class="btn small" onclick="editVideo(${x.id})">✏️ Modifier</button>
        <button class="btn small danger" onclick="deleteVideo(${x.id})">🗑️ Supprimer</button></div>
      </article>`).join("")||'<p class="empty">Aucune vidéo locale. Cliquez sur « Nouvelle vidéo ».</p>';
    stats();
  }catch(e){$("videoList").innerHTML='<p class="empty">⚠️ Stockage vidéo indisponible dans ce navigateur.</p>';console.error(e);}
}
function newVideo(){
  $("videoForm").hidden=false;$("videoFormTitle").textContent="Nouvelle vidéo";
  $("vId").value="";$("vTitle").value="";$("vDesc").value="";$("vOrder").value=videoData().length+1;
  $("vFile").value="";$("vFileInfo").textContent="Sélectionnez un fichier MP4/WebM.";
  $("vPreview").innerHTML="";
}
async function editVideo(id){
  const x=await idbGet(id);if(!x)return;
  $("videoForm").hidden=false;$("videoFormTitle").textContent="Modifier la vidéo";
  $("vId").value=x.id;$("vTitle").value=x.title||"";$("vOrder").value=x.order||0;$("vDesc").value=x.description||"";
  $("vFile").value="";$("vFileInfo").textContent=`Fichier actuel : ${x.fileName||"vidéo locale"} — ${Number(x.sizeMB||0).toFixed(1)} MB`;
  $("vPreview").innerHTML=x.file?`<video controls preload="metadata" src="${URL.createObjectURL(x.file)}"></video>`:"";
}
$("vFile").onchange=()=>{
  const f=$("vFile").files[0]; $("vFileInfo").textContent=f?`Fichier sélectionné : ${f.name} — ${(f.size/1024/1024).toFixed(1)} MB`:"";
  $("vPreview").innerHTML="";
  if(f){$("vPreview").innerHTML=`<video controls preload="metadata" src="${URL.createObjectURL(f)}"></video>`;}
};
$("videoForm").onsubmit=async e=>{
  e.preventDefault();
  const id=+$("vId").value||Date.now(); const old=await idbGet(id); const f=$("vFile").files[0];
  if(!old && !f){alert("⚠️ Misafidiana fichier vidéo aloha.");return;}
  const v={id,title:$("vTitle").value.trim(),order:Number($("vOrder").value)||0,description:$("vDesc").value.trim(),
    file: f || old.file,fileName:f?f.name:old.fileName,type:f?f.type:old.type,sizeMB:f?(f.size/1024/1024):old.sizeMB,updatedAt:new Date().toISOString()};
  try{await idbPut(v);closeEditors();await renderVideos();alert("✅ Vidéo enregistrée.");}
  catch(err){console.error(err);alert("❌ Tsy voatahiry ilay vidéo. Andramo Chrome/Edge ary jereo raha manana toerana malalaka ny navigateur.");}
};
async function deleteVideo(id){
  if(confirm("Supprimer cette vidéo locale ?")){await idbDelete(id);await renderVideos();}
}
