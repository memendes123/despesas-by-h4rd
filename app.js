/* ===========================================================
   APP.JS — V12 FINAL CORRIGIDO PARA GITHUB PAGES + SUPABASE
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
       GARANTIR QUE O CLIENTE SUPABASE EXISTE
    ============================================================ */
    ensureClient() {
        if (this.supabaseClient) return this.supabaseClient;

        if (!window.supabase || typeof window.supabase.createClient !== "function") {
            alert("Supabase não está disponível. Verifique a ligação ou recarregue a página.");
            return null;
        }

        this.supabaseClient = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
        // manter compatibilidade com os restantes módulos
        window.supabase = this.supabaseClient;
        return this.supabaseClient;
    },


    /* ===========================================================
       AGUARDAR PELA SDK SUPABASE
    ============================================================ */
    async waitForSupabase(timeoutMs = 5000) {
        if (this.supabaseClient) return true;

        if (window.supabase && typeof window.supabase.createClient === "function") {
            return true;
        }

        if (!this.supabaseReady) {
            this.supabaseReady = new Promise(resolve => {
                const start = performance.now();
                const timer = setInterval(() => {
                    const ready = window.supabase && typeof window.supabase.createClient === "function";
                    const timedOut = performance.now() - start >= timeoutMs;

                    if (ready || timedOut) {
                        clearInterval(timer);
                        resolve(!!ready);
                    }
                }, 100);
            });
        }

        return await this.supabaseReady;
    },


    /* ===========================================================
       LOGIN
    ============================================================ */
    async appLogin(username, password) {

        const ready = await APP.waitForSupabase();
        if (!ready) {
            alert("Supabase não carregou. Verifique a ligação à internet e recarregue a página.");
            return;
        }

        const client = APP.ensureClient();
        if (!client) return;

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
        const { data: users, error: e1 } = await client
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
        const { data: pass, error: e2 } = await client
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

        // 3) Definir RLS para a sessão
        const { error: rlsError } = await DB.setSessionUser(user.id);

        if (rlsError) {
            alert("Erro a preparar sessão segura.");
            return;
        }

        // 4) Guardar sessão localmente
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

        // 5) Carregar dashboard **APÓS DEFINIR userId**
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

            const ready = await APP.waitForSupabase();
            if (!ready) {
                console.warn("Supabase não carregou — sessão não restaurada.");
                return;
            }

            const { error } = await DB.setSessionUser(APP.userId);
            if (error) {
                console.warn("Não foi possível reativar RLS da sessão.");
            }

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
       GERIR TAB DE ADMIN
    ============================================================ */
    ensureAdminTab() {
        const nav = document.querySelector(".bottom-nav");
        if (!nav) return;

        const existing = nav.querySelector("button[data-tab='admin']");

        if (APP.role === "admin") {
            if (!existing) {
                const btn = document.createElement("button");
                btn.textContent = "Admin";
                btn.dataset.tab = "admin";
                nav.appendChild(btn);
            }
        } else if (existing) {
            existing.remove();
        }
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
       RENDER INFO DA CONTA
    ============================================================ */
    renderContaInfo() {
        const userEl = document.getElementById("conta-user");
        const idEl = document.getElementById("conta-id");
        const roleEl = document.getElementById("conta-role");

        if (!userEl || !idEl || !roleEl) return;

        userEl.textContent = APP.user ?? "-";
        idEl.textContent = APP.userId ?? "-";
        roleEl.textContent = APP.role ?? "-";
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

        const client = APP.ensureClient();
        if (!client) return;

        const { error } = await client
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

    (async () => {
        const ready = await APP.waitForSupabase();
        if (!ready) {
            alert("Supabase não carregou. Confirme a ligação à internet e volte a abrir a app.");
            return;
        }

        const client = APP.ensureClient();
        if (!client) return;

    const nav = document.querySelector(".bottom-nav");

        nav.addEventListener("click", async (evt) => {
            const btn = evt.target.closest("button");
            if (!btn || !nav.contains(btn)) return;

            const tab = btn.dataset.tab;
            if (!tab) return;

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
