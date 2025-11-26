/* ===========================================================
   APP.JS — V10 FINAL
   Gestão de sessão, login, navegação e inicialização
=========================================================== */

const APP = {
    currentUser: null,
    mesAtual: new Date().getMonth() + 1,
    anoAtual: new Date().getFullYear(),

    /* ===========================================================
       MOSTRAR PÁGINA
    ============================================================ */
    showPage(page) {
        document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
        document.getElementById(`page-${page}`).classList.remove("hidden");
    },

    /* ===========================================================
       LOGIN — V10 (FUNCIONAL COM SUPABASE + RLS)
    ============================================================ */
    async appLogin(username, password) {

        if (!username || !password) {
            alert("Preencha username e password.");
            return;
        }

        /* Hash da password */
        const hash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(password)
        );
        const hex = Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

        /* 1) Buscar user pelo username */
        const { data: user, error: errUser } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .maybeSingle();

        if (!user) {
            alert("Utilizador não encontrado.");
            return;
        }

        /* 2) Buscar password sha256 */
        const { data: passRow } = await supabase
            .from("user_passwords")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!passRow || passRow.password_sha256 !== hex) {
            alert("Password incorreta.");
            return;
        }

        /* 3) ATIVAR RLS NA SESSÃO */
        await supabase.rpc("set_app_user", {
            userid: user.id
        });

        /* Guardar sessão local */
        APP.currentUser = user;
        localStorage.setItem("sessao-user", JSON.stringify(user));

        /* UI */
        APP.showPage("dashboard");
        DASHBOARD.load();
    },

    /* ===========================================================
       LOGOUT
    ============================================================ */
    appLogout() {
        localStorage.removeItem("sessao-user");
        APP.currentUser = null;
        APP.showPage("login");
    },

    /* ===========================================================
       REATIVAR SESSÃO AO ENTRAR NO SITE
    ============================================================ */
    async iniciar() {

        const sessao = localStorage.getItem("sessao-user");

        if (sessao) {
            APP.currentUser = JSON.parse(sessao);

            /* Reativar RLS */
            await supabase.rpc("set_app_user", {
                userid: APP.currentUser.id
            });

            APP.showPage("dashboard");
            DASHBOARD.load();
        } else {
            APP.showPage("login");
        }

        // bottom nav
        document.querySelectorAll(".bottom-nav button").forEach(btn => {
            btn.onclick = () => {
                const tab = btn.dataset.tab;
                APP.showPage(tab);

                if (tab === "dashboard") DASHBOARD.load();
                if (tab === "debitos") DEBITOS.load();
                if (tab === "metas") METAS.load();
            };
        });
    }
};

/* ===========================================================
   INICIAR APP
=========================================================== */
window.addEventListener("load", () => {
    APP.iniciar();
});
