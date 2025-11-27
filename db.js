/* ===========================================================
   DB.JS — V12 FINAL CORRIGIDO
   Todas as operações de base de dados centralizadas,
   compatível com APP.userId e RLS atual
=========================================================== */

const DB = {

    /* ===========================================================
       DEFINIR UTILIZADOR PARA RLS
    ============================================================ */

    async setSessionUser(userId) {
        const client = APP.ensureClient();
        if (!client || !userId) return { error: null };

        const { error } = await client.rpc("set_app_user", { userid: userId });

        if (error) console.error("Erro setSessionUser:", error);
        return { error };
    },

    /* ===========================================================
       CATEGORIAS
    ============================================================ */

    async getCategorias() {
        const client = APP.ensureClient();
        if (!client) return [];

        const { data, error } = await client
            .from("categorias")
            .select("*")
            .order("nome");

        if (error) console.error("Erro getCategorias:", error);
        return data || [];
    },

    async addCategoria(nome, userId) {
        const client = APP.ensureClient();
        if (!client) return { error: { message: "Supabase indisponível" } };

        return await client
            .from("categorias")
            .insert({ nome, user_id: userId });
    },


    /* ===========================================================
       MOVIMENTOS
    ============================================================ */

    async addMovimento({ data, descricao, categoria_id, tipo, valor }) {

        if (!APP.userId) {
            console.warn("Sem sessão para addMovimento");
            return;
        }

        const client = APP.ensureClient();
        if (!client) return { error: { message: "Supabase indisponível" } };

        return await client
            .from("movimentos")
            .insert({
                data,
                descricao,
                categoria_id,
                tipo,
                valor,
                user_id: APP.userId
            });
    },


    async getMovimentosMes(mes, ano) {

        if (!APP.userId) return [];

        const mesStr = String(mes).padStart(2, "0");

        const client = APP.ensureClient();
        if (!client) return [];

        const { data, error } = await client
            .from("movimentos")
            .select("*")
            .eq("user_id", APP.userId)
            .gte("data", `${ano}-${mesStr}-01`)
            .lte("data", `${ano}-${mesStr}-31`)
            .order("data", { ascending: false });

        if (error) console.error("Erro getMovimentosMes:", error);

        return data || [];
    },


    /* ===========================================================
       DÉBITOS DIRETOS
    ============================================================ */

    async getDebitos() {

        if (!APP.userId) return [];

        const client = APP.ensureClient();
        if (!client) return [];

        const { data, error } = await client
            .from("debitos")
            .select("*")
            .eq("user_id", APP.userId)
            .order("dia");

        if (error) console.error("Erro getDebitos:", error);

        return data || [];
    },


    async addDebito({ nome, valor, dia, inicio, fim }) {

        if (!APP.userId) {
            console.warn("Sem sessão addDebito");
            return;
        }

        const client = APP.ensureClient();
        if (!client) return { error: { message: "Supabase indisponível" } };

        return await client
            .from("debitos")
            .insert({
                nome,
                valor,
                dia,
                inicio,
                fim,
                user_id: APP.userId
            });
    },


    /* ===========================================================
       METAS
    ============================================================ */

    async getMetas() {

        if (!APP.userId) return [];

        const client = APP.ensureClient();
        if (!client) return [];

        const { data, error } = await client
            .from("metas")
            .select("*")
            .eq("user_id", APP.userId)
            .order("created_at", { ascending: false });

        if (error) console.error("Erro getMetas:", error);

        return data || [];
    },


    async addMeta({ nome, objetivo, inicio, fim }) {

        if (!APP.userId) return;

        const client = APP.ensureClient();
        if (!client) return { error: { message: "Supabase indisponível" } };

        return await client
            .from("metas")
            .insert({
                nome,
                objetivo,
                inicio,
                fim,
                user_id: APP.userId
            });
    },


    /* ===========================================================
       ORÇAMENTOS MENSAIS
    ============================================================ */

    async getOrcamento(mes, ano) {

        if (!APP.userId) return null;

        const client = APP.ensureClient();
        if (!client) return null;

        const { data, error } = await client
            .from("orcamentos")
            .select("*")
            .eq("user_id", APP.userId)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();

        if (error) console.error("Erro getOrcamento:", error);

        return data || null;
    },


    async setOrcamento(mes, ano, total) {

        if (!APP.userId) return;

        // Verificar se já existe
        const client = APP.ensureClient();
        if (!client) return { error: { message: "Supabase indisponível" } };

        const { data: existing } = await client
            .from("orcamentos")
            .select("*")
            .eq("user_id", APP.userId)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();

        if (existing) {
            return await client
                .from("orcamentos")
                .update({ total })
                .eq("id", existing.id);
        }

        // Criar novo
        return await client
            .from("orcamentos")
            .insert({
                user_id: APP.userId,
                mes,
                ano,
                total
            });
    },


    /* ===========================================================
       SALDOS MENSAIS
    ============================================================ */

    async getSaldo(mes, ano) {

        if (!APP.userId) return null;

        const client = APP.ensureClient();
        if (!client) return null;

        const { data, error } = await client
            .from("saldos")
            .select("*")
            .eq("user_id", APP.userId)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();

        if (error) console.error("Erro getSaldo:", error);

        return data || null;
    },


    async setSaldo(mes, ano, saldo) {

        if (!APP.userId) return;

        const client = APP.ensureClient();
        if (!client) return { error: { message: "Supabase indisponível" } };

        const { data: existing } = await client
            .from("saldos")
            .select("*")
            .eq("user_id", APP.userId)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();

        if (existing) {
            return await client
                .from("saldos")
                .update({ saldo })
                .eq("id", existing.id);
        }

        return await client
            .from("saldos")
            .insert({
                user_id: APP.userId,
                mes,
                ano,
                saldo
            });
    }
};
