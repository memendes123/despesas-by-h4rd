/* ===========================================================
   APP.JS — V10 FINAL
   Correção completa do Login + Navegação + Sessão RLS
=========================================================== */

const APP = {

    currentUser: null,
    mesAtual: new Date().getMonth() + 1,
    anoAtual: new Date().getFullYear(),


    /* ===========================================================
       Trocar de página
    ============================================================ */
    showPage(page) {
        document.querySelectorAll(".page")
            .forEach(p => p.classList.add("hidden"));

        document.getElementById("page-" + page)
            .classList.remove("hidden");
    },


    /* ===========================================================
       LOGIN
    ============================================================ */
    async appLogin(username, password) {

        if (!username || !password) {
            alert("Preencha username e password.");
            return;
        }

        username = username.toLowerCase().trim();

        // buscar user
        const { data: userRow } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .maybeSingle();

        if (!userRow) {
            alert("Utilizador não encontrado.");
            return;
        }

        // buscar hash da password
        const { data: passRow } = await supabase
            .from("user_passwords")
            .select("*")
            .eq("user_id", userRow.id)
            .maybeSingle();

        if (!passRow) {
            alert("Password não encontrada.");
            return;
        }

        // gerar hash do que o user escreveu
        const hash = await APP.hash(password);

        if (hash !== passRow.password_sha256) {
            alert("Password incorreta.");
            return;
        }

        // ativar sessão RLS
        await supabase.rpc("set_app_user", { userid: userRow.id });

        // guardar sessão local
        APP.currentUser = userRow;
        localStorage.setItem("sessao-user", JSON.stringify(userRow));

        APP.entrarDashboard();
    },


    /* ===========================================================
       AUTOLOGIN
    ============================================================ */
    async tryAutoLogin() {
        const saved = localStorage.getItem("sessao-user");
        if (!saved) return false;

        const user = JSON.parse(saved);

        APP.currentUser = user;

        // reativar user para RLS
        await supabase.rpc("set_app_user", { userid: user.id });

        APP.entrarDashboard();
        return true;
    },


    /* ===========================================================
       HASH DA PASSWORD (SHA-256)
    ============================================================ */
    async hash(text) {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    },


    /* ===========================================================
       ENTRAR NO DASHBOARD
    ============================================================ */
    entrarDashboard() {

        APP.showPage("dashboard");

        document.getElementById("conta-user").textContent = APP.currentUser.username;
        document.getElementById("conta-role").textContent = APP.currentUser.role;

        // mostrar painel admin se for admin
        if (APP.currentUser.role === "admin") {
            document.getElementById("admin-panel").classList.remove("hidden");
        } else {
            document.getElementById("admin-panel").classList.add("hidden");
        }

        // set valores do seletor mês/ano
        document.getElementById("sel-mes").value = APP.mesAtual;
        document.getElementById("sel-ano").value = APP.anoAtual;

        DASHBOARD.load();
    },


    /* ===========================================================
       LOGOUT
    ============================================================ */
    appLogout() {
        localStorage.removeItem("sessao-user");
        APP.currentUser = null;
        APP.showPage("login");
    }
};



/* ===========================================================
   NAVEGAÇÃO PELO MENU INFERIOR
=========================================================== */
document.querySelectorAll(".bottom-nav button").forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        APP.showPage(tab);

        if (tab === "dashboard") DASHBOARD.load();
        if (tab === "debitos") DEBITOS.load();
        if (tab === "metas") METAS.load();

        if (tab === "conta" && APP.currentUser) {
            document.getElementById("conta-user").textContent = APP.currentUser.username;
            document.getElementById("conta-role").textContent = APP.currentUser.role;
        }
    });
});


/* ===========================================================
   AUTOLOGIN AO INICIAR
=========================================================== */
window.addEventListener("load", async () => {
    const ok = await APP.tryAutoLogin();
    if (!ok) APP.showPage("login");
});
