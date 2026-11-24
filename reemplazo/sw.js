// Ruta Reemplazo: guarda la app en el teléfono para que funcione sin señal
const V='ruta-reemplazo-v2',TILES='ruta-reemplazo-mapas';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const LIB=['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css','https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all([c.addAll(CORE),...LIB.map(u=>c.add(u).catch(()=>{}))])));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==TILES).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// Página de la app: intenta internet 3,5 s; si no hay señal, usa la copia guardada
function netFirst(req){return new Promise(res=>{let done=false;
  const fallback=()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'));
  const t=setTimeout(()=>{caches.match(req,{ignoreSearch:true}).then(r=>{if(r&&!done){done=true;res(r)}})},3500);
  fetch(req).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(req,cp))}if(!done){done=true;clearTimeout(t);res(r)}})
   .catch(()=>{clearTimeout(t);if(!done){done=true;res(fallback())}});
})}
// Librerías, letras y mapas ya vistos: primero la copia guardada
function cacheFirst(req,name,limit){return caches.open(name).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque')){c.put(req,r.clone());if(limit)c.keys().then(k=>{if(k.length>limit)k.slice(0,k.length-limit).forEach(x=>c.delete(x))})}return r})))}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const u=new URL(req.url);
  if(u.origin===location.origin){e.respondWith(netFirst(req));return}
  if(/tile\.openstreetmap\.org|arcgisonline\.com/.test(u.hostname)){e.respondWith(cacheFirst(req,TILES,3000).catch(()=>new Response('',{status:504})));return}
  if(/cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)){e.respondWith(cacheFirst(req,V).catch(()=>new Response('',{status:504})))}
});
