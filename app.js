/* ===========================================================
   APP.JS — V12 FINAL
   Gestão geral da app + login + navegação
=========================================================== */

const APP = {

    user: null,          // dados do utilizador logado
    userId: null,        // ID SHA256
    role: null,          // admin | user
    mesAtual: new Date().getMonth() + 1,
    anoAtual: new Date().getFullYear(),


    /* ===========================================================
       LOGIN
    ============================================================ */
    async appLogin(username, password) {

        if (!username || !password) {
            alert("Preencha username e password.");
            return;
        }

        // hash SHA256 em JS
        const enc = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(password));
        const hashHex = [...new Uint8Array(hashBuffer)]
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

        // 1) Buscar user pelo username
        const { data: users, error: e1 } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .limit(1);

        if (e1) {
            console.error(e1);
            alert("Erro ao ligar ao servidor.");
            return;
        }

        if (!users || users.length === 0) {
            alert("Utilizador não encontrado.");
            return;
        }

        const user = users[0];

        // 2) Buscar password hash
        const { data: pass, error: e2 } = await supabase
            .from("user_passwords")
            .select("password_sha256")
            .eq("user_id", user.id)
            .limit(1);

        if (e2) {
            console.error(e2);
            alert("Erro ao verificar password.");
            return;
        }

        if (!pass || pass.length === 0) {
            alert("Password não encontrada.");
            return;
        }

        const hashDB = pass[0].password_sha256;

        if (hashHex !== hashDB) {
            alert("Password incorreta.");
            return;
        }

        // 3) DEFINIR UTILIZADOR NA SESSÃO DO SUPABASE (RLS)
        await supabase.rpc("set_app_user", { userid: user.id });

        // guardar sessão
        APP.user = user.username;
        APP.userId = user.id;
        APP.role = user.role;

        localStorage.setItem("sessao", JSON.stringify({
            user: APP.user,
            id: APP.userId,
            role: APP.role
        }));

        APP.showPage("dashboard");
        DASHBOARD.load();
    },


    /* ===========================================================
       RESTORE SESSION
    ============================================================ */
    async restoreSession() {
        const s = localStorage.getItem("sessao");
        if (!s) return;

        try {
            const session = JSON.parse(s);

            APP.user = session.user;
            APP.userId = session.id;
            APP.role = session.role;

            // reativar RLS
            await supabase.rpc("set_app_user", { userid: APP.userId });

            APP.showPage("dashboard");
            DASHBOARD.load();
        } catch(e) {
            console.warn("Sessão inválida.");
        }
    },


    /* ===========================================================
       LOGOUT
    ============================================================ */
    appLogout() {
        localStorage.removeItem("sessao");

        APP.user = null;
        APP.userId = null;
        APP.role = null;

        APP.showPage("login");
    },


    /* ===========================================================
       TROCAR ENTRE PÁGINAS
    ============================================================ */
    showPage(pg) {
        document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
        document.getElementById(`page-${pg}`).classList.remove("hidden");
    }

};


/* ===========================================================
   Inicialização
=========================================================== */

window.addEventListener("load", () => {

    // bottom nav
    document.querySelectorAll(".bottom-nav button").forEach(btn => {
        btn.addEventListener("click", () => {
            APP.showPage(btn.dataset.tab);
            if (btn.dataset.tab === "dashboard") DASHBOARD.load();
            if (btn.dataset.tab === "debitos") DEBITOS.load();
            if (btn.dataset.tab === "metas") METAS.load();
        });
    });

    APP.restoreSession();
});
