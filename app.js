/* ===========================================================
   APP.JS — VERSÃO FINAL (100% FUNCIONAL)
=========================================================== */

const APP = {

    currentUser: null,
    mesAtual: new Date().getMonth() + 1,
    anoAtual: new Date().getFullYear(),

    /* ===========================================================
       INICIAR APP
    ============================================================ */
    init: async function () {

        // Carregar sessão guardada
        let sessao = localStorage.getItem("sessao-user");
        if (sessao) {
            APP.currentUser = JSON.parse(sessao);

            // Reativar RLS
            await supabase.rpc("set_app_user", { userid: APP.currentUser.id });

            APP.showPage("dashboard");
        } else {
            APP.showPage("login");
        }

        // Navegação
        document.querySelectorAll(".bottom-nav button").forEach(btn => {
            btn.onclick = () => APP.showPage(btn.dataset.tab);
        });
    },

    /* ===========================================================
       LOGIN
    ============================================================ */
    appLogin: async function (username, password) {

        if (!username || !password) {
            return alert("Preencha username e password");
        }

        // 1) Buscar user
        let { data: users, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .limit(1);

        if (error) {
            console.error(error);
            return alert("Erro a procurar utilizador.");
        }

        if (!users || users.length === 0) {
            return alert("Utilizador não encontrado.");
        }

        let user = users[0];

        // 2) Buscar hash da password
        let { data: passdata } = await supabase
            .from("user_passwords")
            .select("password_sha256")
            .eq("user_id", user.id)
            .limit(1);

        if (!passdata || passdata.length === 0) {
            return alert("Password não configurada.");
        }

        let storedHash = passdata[0].password_sha256;

        // 3) Calcular hash SHA-256 da password introduzida
        let encoder = new TextEncoder();
        let buffer = await crypto.subtle.digest("SHA-256", encoder.encode(password));
        let hashHex = [...new Uint8Array(buffer)]
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

        if (hashHex !== storedHash) {
            return alert("Password incorreta.");
        }

        // 4) Guardar sessão
        APP.currentUser = user;
        localStorage.setItem("sessao-user", JSON.stringify(user));

        // 5) Ativar RLS
        await supabase.rpc("set_app_user", { userid: user.id });

        // 6) Abrir dashboard
        APP.showPage("dashboard");
    },

    /* ===========================================================
       LOGOUT
    ============================================================ */
    appLogout: function () {
        localStorage.removeItem("sessao-user");
        APP.currentUser = null;
        APP.showPage("login");
    },

    /* ===========================================================
       MOSTRAR PÁGINAS
    ============================================================ */
    showPage: function (page) {
        document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
        document.getElementById("page-" + page).classList.remove("hidden");

        if (page === "dashboard") DASHBOARD.load();
        if (page === "debitos") DEBITOS.load();
        if (page === "metas") METAS.load();
        if (page === "conta") APP.loadConta();
    },

    /* ===========================================================
       CARREGAR PÁGINA CONTA
    ============================================================ */
    loadConta: function () {

        if (!APP.currentUser) return;

        document.getElementById("conta-user").textContent = APP.currentUser.username;
        document.getElementById("conta-role").textContent = APP.currentUser.role;

        // Mostrar painel admin
        if (APP.currentUser.role === "admin")
            document.getElementById("admin-panel").classList.remove("hidden");
        else
            document.getElementById("admin-panel").classList.add("hidden");
    }
};


/* ===========================================================
   INICIAR A APLICAÇÃO
=========================================================== */
document.addEventListener("DOMContentLoaded", APP.init);
