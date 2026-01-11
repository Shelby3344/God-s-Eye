// Analytics Tracker - Adicione este script nos seus sites
// Cole no <head> ou antes do </body>
//
// CONFIGURAÇÃO: Troque SUPABASE_URL e SUPABASE_ANON_KEY pelos valores do projeto

(function() {
    const SUPABASE_URL = 'https://SEU_PROJECT_REF.supabase.co';
    const SUPABASE_ANON_KEY = 'sua_anon_key_aqui';

    // Evita contar a mesma sessão múltiplas vezes
    const sessionKey = 'pv_session';
    const lastPath = sessionStorage.getItem(sessionKey);
    const currentPath = window.location.pathname;

    if (lastPath === currentPath) return;
    sessionStorage.setItem(sessionKey, currentPath);

    // Envia o pageview
    fetch(`${SUPABASE_URL}/rest/v1/page_views`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            path: currentPath,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent
        })
    }).catch(() => {});
})();
