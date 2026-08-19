(() => {
  const sb = window.tsaranoroAdmin;
  const UID = window.TSARANORO_ADMIN_UID;
  const EMAIL = window.TSARANORO_ADMIN_EMAIL;
  const $ = id => document.getElementById(id);

  async function clearWrongSession() {
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user?.id && session.user.id !== UID) {
        await sb.auth.signOut();
        $('loginBox').hidden = false;
        $('panel').hidden = true;
      }
    } catch (_) {}
  }

  window.login = async () => {
    const id = $('adminId').value.trim();
    const pass = $('adminPass').value;
    const box = $('loginError');
    box.hidden = true;
    if (id !== 'admin') {
      box.textContent = 'Identifiant administrateur incorrect.';
      box.hidden = false;
      return;
    }
    try {
      await sb.auth.signOut();
      const { error } = await sb.auth.signInWithPassword({ email: EMAIL, password: pass });
      if (error) throw error;
      const { data: { user } } = await sb.auth.getUser();
      if (!user || user.id !== UID) {
        await sb.auth.signOut();
        throw new Error('Compte administrateur non autorisé.');
      }
      await window.showPanel();
    } catch (e) {
      await sb.auth.signOut();
      box.textContent = 'Connexion impossible : ' + (e?.message || e);
      box.hidden = false;
    }
  };

  window.toggleActive = async (table, id, active) => {
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user || user.id !== UID) throw new Error('Compte administrateur non autorisé.');
      const { error } = await sb.from(table).update({ actif: active }).eq('id', id);
      if (error) throw error;
      await window.showPanel();
    } catch (e) {
      alert('Impossible de modifier la visibilité : ' + (e?.message || e));
    }
  };

  clearWrongSession();
})();
