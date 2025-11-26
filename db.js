/* ===========================================================
   DB.JS — V10 FINAL
   Todas as operações de base de dados centralizadas
=========================================================== */

const DB = {

    /* ===========================================================
       CATEGORIAS
    ============================================================ */

    async getCategorias() {
        const { data } = await supabase
            .from("categorias")
            .select("*")
            .order("nome");
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
        return await supabase
            .from("movimentos")
            .insert({
                data,
                descricao,
                categoria_id,
                tipo,
                valor,
                user_id: APP.currentUser.id
            });
    },


    async getMovimentosMes(mes, ano) {
        const { data } = await supabase
            .from("movimentos")
            .select("*")
            .gte("data", `${ano}-${String(mes).padStart(2, "0")}-01`)
            .lte("data", `${ano}-${String(mes).padStart(2, "0")}-31`)
            .order("data", { ascending: false });

        return data || [];
    },



    /* ===========================================================
       DÉBITOS DIRETOS
    ============================================================ */

    async getDebitos() {
        const { data } = await supabase
            .from("debitos")
            .select("*")
            .order("dia");
        return data || [];
    },


    async addDebito({ nome, valor, dia, inicio, fim }) {
        return await supabase
            .from("debitos")
            .insert({
                nome,
                valor,
                dia,
                inicio,
                fim,
                user_id: APP.currentUser.id
            });
    },



    /* ===========================================================
       METAS
    ============================================================ */

    async getMetas() {
        const { data } = await supabase
            .from("metas")
            .select("*")
            .order("created_at", { ascending: false });

        return data || [];
    },


    async addMeta({ nome, objetivo, inicio, fim }) {
        return await supabase
            .from("metas")
            .insert({
                nome,
                objetivo,
                inicio,
                fim,
                user_id: APP.currentUser.id
            });
    },



    /* ===========================================================
       ORÇAMENTO MENSAL
    ============================================================ */

    async getOrcamento(mes, ano) {
        const { data } = await supabase
            .from("orcamentos")
            .select("*")
            .eq("user_id", APP.currentUser.id)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();
        return data || null;
    },


    async setOrcamento(mes, ano, total) {
        // tentar atualizar
        const { data: existing } = await supabase
            .from("orcamentos")
            .select("*")
            .eq("user_id", APP.currentUser.id)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();

        if (existing) {
            return await supabase
                .from("orcamentos")
                .update({ total })
                .eq("id", existing.id);
        }

        // inserir se não existe
        return await supabase
            .from("orcamentos")
            .insert({
                user_id: APP.currentUser.id,
                mes,
                ano,
                total
            });
    },



    /* ===========================================================
       SALDOS
    ============================================================ */

    async getSaldo(mes, ano) {
        const { data } = await supabase
            .from("saldos")
            .select("*")
            .eq("user_id", APP.currentUser.id)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();
        return data || null;
    },


    async setSaldo(mes, ano, saldo) {
        const { data: existing } = await supabase
            .from("saldos")
            .select("*")
            .eq("user_id", APP.currentUser.id)
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
                user_id: APP.currentUser.id,
                mes,
                ano,
                saldo
            });
    }
};
