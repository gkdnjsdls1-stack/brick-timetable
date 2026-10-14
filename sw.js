/* 브릭 타임테이블 — 오프라인에서도 열리도록 하는 최소 캐시.
   항상 네트워크를 먼저 보고, 실패할 때만 캐시를 쓴다(업데이트가 밀리지 않게). */
var CACHE = "brick-tt-v1";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg",
              "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
      .catch(function(){})
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url;
  try { url = new URL(e.request.url); } catch(err) { return; }
  if(url.origin !== self.location.origin) return;   /* 구글 폰트 등 외부는 건드리지 않는다 */
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match("./index.html");
      });
    })
  );
});
