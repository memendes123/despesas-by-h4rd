/* ===========================================================
   AUTH.JS — V10 FINAL
   Módulo auxiliar de autenticação
   (O login real está em APP.appLogin)
=========================================================== */

const AUTH = {

    /* ===========================================================
       DEVOLVER USER ATUAL
    ============================================================ */
    getUser() {
        return APP.currentUser;
    },

    /* ===========================================================
       VERIFICAR SE É ADMIN
    ============================================================ */
    isAdmin() {
        return APP.currentUser && APP.currentUser.role === "admin";
    },

    /* ===========================================================
       LOGOUT TOTAL
    ============================================================ */
    logout() {
        localStorage.removeItem("sessao-user");
        APP.currentUser = null;
        APP.showPage("login");
    },

    /* ===========================================================
       REATIVAR RLS AO INICIAR A APP
       (sempre que se faz reload)
    ============================================================ */
    async reativarSessaoRLS() {

        if (!APP.currentUser) return;

        try {
            await supabase.rpc("set_app_user", {
                userid: APP.currentUser.id
            });
        } catch (e) {
            console.error("Erro ao reativar sessão RLS:", e);
        }
    }
};


/* ===========================================================
   AO CARREGAR A APP — REATIVA RLS
=========================================================== */
window.addEventListener("load", async () => {
    await AUTH.reativarSessaoRLS();
});
