(() => {
  const STORAGE_BASE = 'https://ksdhdceasgubtixyzqdd.supabase.co/storage/v1/object/public/tsaranoro-media/';
  const toPublicUrl = (value) => {
    if (!value) return value;
    const s = String(value).trim();
    if (/^https?:\/\//i.test(s) || s.startsWith('data:') || s.startsWith('blob:')) return s;
    const clean = s.replace(/^\.?\//, '').replace(/^\//, '');
    if (clean.startsWith('galerie/')) return STORAGE_BASE + clean;
    if (clean.startsWith('media/')) return STORAGE_BASE + clean;
    return s;
  };
  function repair(key, fieldOrPhotos) {
    try {
      const raw = localStorage.getItem(key); if (!raw) return false;
      const data = JSON.parse(raw); if (!Array.isArray(data)) return false;
      let changed = false;
      data.forEach(item => {
        if (fieldOrPhotos === 'photos' && Array.isArray(item.photos)) {
          const next = item.photos.map(toPublicUrl);
          if (JSON.stringify(next) !== JSON.stringify(item.photos)) { item.photos = next; changed = true; }
        } else if (fieldOrPhotos && item[fieldOrPhotos]) {
          const next = toPublicUrl(item[fieldOrPhotos]);
          if (next !== item[fieldOrPhotos]) { item[fieldOrPhotos] = next; changed = true; }
        }
      });
      if (changed) localStorage.setItem(key, JSON.stringify(data));
      return changed;
    } catch (e) { console.warn('Public media URL repair:', e); return false; }
  }
  function run() {
    const changed = repair('tsaranoro_circuits_v2','photos') ||
      repair('tsaranoro_circuits_v2','image_url') ||
      repair('tsaranoro_activities_v1','photo') ||
      repair('tsaranoro_guides_v1','photo') ||
      repair('tsaranoro_hotels_v1','photo');
    if (changed) {
      if (typeof window.render === 'function') window.render();
      if (typeof window.renderActivities === 'function') window.renderActivities();
      if (typeof window.renderGuides === 'function') window.renderGuides();
      if (typeof window.renderHotels === 'function') window.renderHotels();
    }
  }
  run();
  window.addEventListener('load', run);
  [300,1500,3000,5000].forEach(ms => setTimeout(run, ms));
  setInterval(run, 2000);
})();
