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

  function repairCircuits() {
    try {
      const key = 'tsaranoro_circuits_v2';
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return false;
      let changed = false;
      data.forEach(c => {
        if (Array.isArray(c.photos)) {
          const next = c.photos.map(toPublicUrl);
          if (JSON.stringify(next) !== JSON.stringify(c.photos)) { c.photos = next; changed = true; }
        }
        if (c.image_url) {
          const next = toPublicUrl(c.image_url);
          if (next !== c.image_url) { c.image_url = next; changed = true; }
        }
      });
      if (changed) localStorage.setItem(key, JSON.stringify(data));
      return changed;
    } catch (e) {
      console.warn('Public media URL repair:', e);
      return false;
    }
  }

  const run = () => {
    const changed = repairCircuits();
    if (changed && typeof window.render === 'function') window.render();
  };

  run();
  window.addEventListener('load', run);
  setTimeout(run, 300);
  setTimeout(run, 1500);
})();
