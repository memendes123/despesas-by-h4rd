/* ===========================================================
   DB.JS — V12 FINAL CORRIGIDO
   Todas as operações de base de dados centralizadas,
   compatível com APP.userId e RLS atual
=========================================================== */

const DB = {

    /* ===========================================================
       CATEGORIAS
    ============================================================ */

    async getCategorias() {
        const { data, error } = await supabase
            .from("categorias")
            .select("*")
            .order("nome");

        if (error) console.error("Erro getCategorias:", error);
        return data || [];
    },

    async addCategoria(nome, userId) {
        return await supabase
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

        return await supabase
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

        const { data, error } = await supabase
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

        const { data, error } = await supabase
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

        return await supabase
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

        const { data, error } = await supabase
            .from("metas")
            .select("*")
            .eq("user_id", APP.userId)
            .order("created_at", { ascending: false });

        if (error) console.error("Erro getMetas:", error);

        return data || [];
    },


    async addMeta({ nome, objetivo, inicio, fim }) {

        if (!APP.userId) return;

        return await supabase
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

        const { data, error } = await supabase
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
        const { data: existing } = await supabase
            .from("orcamentos")
            .select("*")
            .eq("user_id", APP.userId)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();

        if (existing) {
            return await supabase
                .from("orcamentos")
                .update({ total })
                .eq("id", existing.id);
        }

        // Criar novo
        return await supabase
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

        const { data, error } = await supabase
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

        const { data: existing } = await supabase
            .from("saldos")
            .select("*")
            .eq("user_id", APP.userId)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();

        if (existing) {
            return await supabase
                .from("saldos")
                .update({ saldo })
                .eq("id", existing.id);
        }

        return await supabase
            .from("saldos")
            .insert({
                user_id: APP.userId,
                mes,
                ano,
                saldo
            });
    }
};
