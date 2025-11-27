/* ===========================================================
   APP.JS — V14 FINAL CORRIGIDO PARA GITHUB PAGES + SUPABASE
=========================================================== */

const APP = {

    user: null,
    userId: null,
    role: null,
    mesAtual: new Date().getMonth() + 1,
    anoAtual: new Date().getFullYear(),

    supabaseUrl: "https://wcdzwswjbhwkyfdqpner.supabase.co",
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZHp3c3dqYmh3a3lmZHFwbmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDExNjEsImV4cCI6MjA3OTMxNzE2MX0.PX6lM9MTiu1TcffOiGKw2jVQkl8x1pZBRY8HcDHseMs",

    supabaseClient: null,
    supabaseReady: null,


    /* ===========================================================
       GARANTIR CLIENTE SUPABASE
    ============================================================ */
    ensureClient() {
        if (this.supabaseClient) return this.supabaseClient;

        if (!window.supabase || typeof window.supabase.createClient !== "function") {
            console.error("Supabase SDK não disponível!");
            alert("Erro ao iniciar Supabase.");
            return null;
        }

        this.supabaseClient = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
        return this.supabaseClient;
    },


    /* ===========================================================
       AGUARDAR SDK SUPABASE
    ============================================================ */
    async waitForSupabase(timeout = 5000) {
        if (window.supabase?.createClient) return true;

        return new Promise(resolve => {
            const start = Date.now();
            const timer = setInterval(() => {
                if (window.supabase?.createClient || Date.now() - start >= timeout) {
                    clearInterval(timer);
                    resolve(!!window.supabase?.createClient);
                }
            }, 100);
        });
    },


    /* ===========================================================
       LOGIN
    ============================================================ */
    async appLogin(username, password) {

        const ok = await APP.waitForSupabase();
        if (!ok) return alert("Supabase falhou ao carregar.");

        const client = APP.ensureClient();
        if (!client) return;

        if (!username || !password) {
            alert("Preencha username e password.");
            return;
        }

        // HASH SHA256
        const enc = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(password));
        const hashHex = [...new Uint8Array(hashBuffer)]
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

        // 1) Buscar utilizador
        const { data: users, error: e1 } = await client
            .from("users")
            .select("*")
            .eq("username", username.toLowerCase())
            .limit(1);

        if (e1) {
            console.error(e1);
            return alert("Erro ao procurar utilizador.");
        }

        if (!users?.length) return alert("Utilizador não encontrado.");
        const user = users[0];

        // 2) Ir buscar password hash
        const { data: pass, error: e2 } = await client
            .from("user_passwords")
            .select("password_sha256")
            .eq("user_id", user.id)
            .limit(1);

        if (e2) {
            console.error(e2);
            return alert("Erro ao validar password.");
        }

        if (!pass?.length) return alert("Password não encontrada.");

        if (hashHex !== pass[0].password_sha256) {
            return alert("Password incorreta.");
        }

        // 3) Ativar RLS
        const { error: rls } = await DB.setSessionUser(user.id);
        if (rls) {
            console.error(rls);
            return alert("Erro interno a ativar sessão segura.");
        }

        // 4) Guardar sessão local
        APP.user = user.username;
        APP.userId = user.id;
        APP.role = user.role;

        APP.ensureAdminTab();
        APP.renderContaInfo();

        localStorage.setItem("sessao", JSON.stringify({
            user: APP.user,
            id: APP.userId,
            role: APP.role
        }));

        // 5) Ir para Dashboard
        APP.showPage("dashboard");
        await DASHBOARD.load();
    },


    /* ===========================================================
       RESTAURAR SESSÃO
    ============================================================ */
    async restoreSession() {
        const saved = localStorage.getItem("sessao");
        if (!saved) return;

        try {
            const sessao = JSON.parse(saved);

            APP.user = sessao.user;
            APP.userId = sessao.id;
            APP.role = sessao.role;

            await DB.setSessionUser(APP.userId);

            APP.ensureAdminTab();
            APP.renderContaInfo();

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

        APP.ensureAdminTab();
        APP.renderContaInfo();

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
       ADMIN TAB NO MENU
    ============================================================ */
    ensureAdminTab() {
        const nav = document.querySelector(".bottom-nav");
        if (!nav) return;

        const exists = nav.querySelector("button[data-tab='admin']");

        if (APP.role === "admin") {
            if (!exists) {
                const b = document.createElement("button");
                b.textContent = "Admin";
                b.dataset.tab = "admin";
                nav.appendChild(b);
            }
        } else if (exists) {
            exists.remove();
        }
    },


    /* ===========================================================
       ALTERAR PASSWORD
    ============================================================ */
    async mudarPassword() {

        if (!APP.userId) return alert("Sessão expirada.");

        const p1 = document.getElementById("new-pass1").value.trim();
        const p2 = document.getElementById("new-pass2").value.trim();

        if (!p1 || !p2) return alert("Preencha tudo.");
        if (p1 !== p2) return alert("As passwords não coincidem.");

        const hash = await APP.hash(p1);

        const client = APP.ensureClient();
        if (!client) return;

        const { error } = await client
            .from("user_passwords")
            .update({ password_sha256: hash })
            .eq("user_id", APP.userId);

        if (error) {
            console.error(error);
            return alert("Erro ao atualizar password.");
        }

        alert("Password alterada.");
    },


    /* ===========================================================
       HASH
    ============================================================ */
    async hash(text) {
        const enc = new TextEncoder();
        const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    },


    /* ===========================================================
       INFO DA CONTA
    ============================================================ */
    renderContaInfo() {
        const u = document.getElementById("conta-user");
        const i = document.getElementById("conta-id");
        const r = document.getElementById("conta-role");

        if (!u) return;

        u.textContent = APP.user ?? "-";
        i.textContent = APP.userId ?? "-";
        r.textContent = APP.role ?? "-";
    }
};


/* ===========================================================
   INICIALIZAÇÃO
=========================================================== */
window.addEventListener("load", () => {

    (async () => {

        if (!await APP.waitForSupabase()) {
            alert("Supabase não carregou.");
            return;
        }

        APP.ensureClient();

        const nav = document.querySelector(".bottom-nav");

        nav.addEventListener("click", async (e) => {
            const b = e.target.closest("button");
            if (!b) return;

            const tab = b.dataset.tab;
            APP.showPage(tab);

            if (tab === "dashboard") await DASHBOARD.load();
            if (tab === "movimentos") await MOVIMENTOS.load();
            if (tab === "categorias") await CATEGORIAS.load();
            if (tab === "debitos") await DEBITOS.load();
            if (tab === "metas") await METAS.load();
        });

        APP.restoreSession();

    })();
});
