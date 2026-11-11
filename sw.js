const CACHE_NAME = "4000-weeks-v5";
const PRECACHE = [
  "./",
  "./index.html",
  "./plan.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith("4000-weeks-") && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* แสดงจากแคชทันที (ปัดเปลี่ยนหน้าเร็ว) แล้วอัปเดตสำเนาเบื้องหลัง
   ครั้งถัดไปที่เปิดจะได้ไฟล์ใหม่ ถ้าไม่มีในแคชจะโหลดจากเน็ต ถ้าออฟไลน์จะใช้หน้าแรก */
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(req).then(hit => {
        const network = fetch(req, { cache: "no-cache" })
          .then(res => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);

        if (hit) {
          event.waitUntil(network);
          return hit;
        }
        return network.then(res =>
          res || (req.mode === "navigate" ? cache.match("./index.html") : undefined)
        );
      })
    )
  );
});
