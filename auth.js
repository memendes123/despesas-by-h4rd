/* ===========================================================
   AUTH.JS — V10 FINAL CORRIGIDO PARA GITHUB PAGES + SUPABASE
   (Agora sem RPC, totalmente compatível com APP.JS V12)
=========================================================== */

const AUTH = {

    /* ===========================================================
       DEVOLVER INFO DO USER ATUAL
    ============================================================ */
    getUser() {
        return {
            username: APP.user,
            id: APP.userId,
            role: APP.role
        };
    },

    /* ===========================================================
       VERIFICAR SE É ADMIN
    ============================================================ */
    isAdmin() {
        return APP.role === "admin";
    },

    /* ===========================================================
       LOGOUT TOTAL
    ============================================================ */
    logout() {
        localStorage.removeItem("sessao");   // sessão correta
        APP.user = null;
        APP.userId = null;
        APP.role = null;

        APP.showPage("login");
    }

};


/* ===========================================================
   AO CARREGAR A APP
   (não há mais RLS via RPC)
=========================================================== */
window.addEventListener("load", () => {
    // Nada aqui — o APP.handleSession já trata tudo
});
