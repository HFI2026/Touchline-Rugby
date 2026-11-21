const CACHE='touchline-shell-v14';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/touchline.svg','./touchline-studio.css','./touchline-studio.js','./touchline-animation-v2.css','./touchline-animation-v2.js','./touchline-experience-v3.css','./touchline-experience-v3.js','./touchline-positions-v4.js','./touchline-rules-v4.js','./touchline-selection-v4.js','./touchline-theme-v4.js','./touchline-presets-v4.js','./touchline-agegrade-v4.css','./touchline-ux-v5.js','./touchline-ux-v5.css','./touchline-home-v5.js','./touchline-home-v5.css','./touchline-visual-v6.css','./touchline-visual-v6.js','./touchline-cloud-config.js','./touchline-cloud.js','./touchline-cloud.css'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('touchline-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin||url.pathname.includes('/api/'))return;
 const isCode=['script','style'].includes(event.request.destination);
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(c=>c.put('./index.html',response.clone())).catch(()=>{});return response}).catch(()=>caches.match('./index.html')));
  return;
 }
 if(isCode){
  event.respondWith(fetch(event.request).then(response=>{
   if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone())).catch(()=>{});
   return response;
  }).catch(()=>caches.match(event.request)));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});