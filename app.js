/* ===========================================================
   APP.JS — V12 FINAL CORRIGIDO PARA GITHUB PAGES + SUPABASE
=========================================================== */

const APP = {

    user: null,
    userId: null,
    role: null,
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

        // SHA256
        const enc = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(password));
        const hashHex = [...new Uint8Array(hashBuffer)]
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

        // 1) Buscar user
        const { data: users, error: e1 } = await supabase
            .from("users")
            .select("*")
            .eq("username", username.toLowerCase())
            .limit(1);

        if (e1) {
            console.error(e1);
            return alert("Erro ao ligar ao servidor.");
        }

        if (!users?.length) {
            return alert("Utilizador não encontrado.");
        }

        const user = users[0];

        // 2) Buscar hash da password
        const { data: pass, error: e2 } = await supabase
            .from("user_passwords")
            .select("password_sha256")
            .eq("user_id", user.id)
            .limit(1);

        if (e2) {
            console.error(e2);
            return alert("Erro ao verificar password.");
        }

        if (!pass?.length) {
            return alert("Password não encontrada.");
        }

        if (hashHex !== pass[0].password_sha256) {
            return alert("Password incorreta.");
        }

        // 3) Guardar sessão localmente
        APP.user = user.username;
        APP.userId = user.id;
        APP.role = user.role;

        localStorage.setItem("sessao", JSON.stringify({
            user: APP.user,
            id: APP.userId,
            role: APP.role
        }));

        // 4) Carregar dashboard **APÓS DEFINIR userId**
        APP.showPage("dashboard");
        await DASHBOARD.load();
    },


    /* ===========================================================
       RESTAURAR SESSÃO
    ============================================================ */
    async restoreSession() {

        const s = localStorage.getItem("sessao");
        if (!s) return;

        try {
            const session = JSON.parse(s);

            APP.user = session.user;
            APP.userId = session.id;
            APP.role = session.role;

            APP.showPage("dashboard");
            await DASHBOARD.load();

        } catch (e) {
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
       TROCAR DE PÁGINA
    ============================================================ */
    showPage(pg) {
        document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
        document.getElementById(`page-${pg}`).classList.remove("hidden");
    },


    /* ===========================================================
       HASH UTIL
    ============================================================ */
    async hash(text) {
        const enc = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(text));
        return [...new Uint8Array(hashBuffer)]
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    },


    /* ===========================================================
       ALTERAR PASSWORD DO UTILIZADOR ATUAL
    ============================================================ */
    async mudarPassword() {

        if (!APP.userId) {
            alert("Sessão expirada. Faça login novamente.");
            return;
        }

        const p1 = document.getElementById("new-pass1").value.trim();
        const p2 = document.getElementById("new-pass2").value.trim();

        if (!p1 || !p2) {
            alert("Preencha ambos os campos.");
            return;
        }

        if (p1 !== p2) {
            alert("As passwords não coincidem.");
            return;
        }

        const hash = await APP.hash(p1);

        const { error } = await supabase
            .from("user_passwords")
            .update({ password_sha256: hash })
            .eq("user_id", APP.userId);

        if (error) {
            console.error(error);
            alert("Erro ao alterar password.");
            return;
        }

        alert("Password alterada.");
        document.getElementById("new-pass1").value = "";
        document.getElementById("new-pass2").value = "";
    }

};


/* ===========================================================
   Inicialização
=========================================================== */
window.addEventListener("load", () => {

    document.querySelectorAll(".bottom-nav button").forEach(btn => {
        btn.addEventListener("click", async () => {
            APP.showPage(btn.dataset.tab);

            if (btn.dataset.tab === "dashboard") await DASHBOARD.load();
            if (btn.dataset.tab === "movimentos") await MOVIMENTOS.load();
            if (btn.dataset.tab === "debitos") await DEBITOS.load();
            if (btn.dataset.tab === "metas") await METAS.load();
        });
    });

    APP.restoreSession();
});
