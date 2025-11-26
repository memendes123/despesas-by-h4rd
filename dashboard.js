/* ===========================================================
   DASHBOARD.JS — V10 FINAL
   Resumo mensal + últimos movimentos
=========================================================== */

const DASHBOARD = {

    /* ===========================================================
       CARREGAR DASHBOARD
    ============================================================ */
    async load() {

        if (!APP.currentUser) return;

        const userId = APP.currentUser.id;
        const mes = APP.mesAtual;
        const ano = APP.anoAtual;

        // carregar movimentos do mês
        const { data: movs } = await supabase
            .from("movimentos")
            .select("id, data, descricao, valor, tipo, user_id")
            .gte("data", `${ano}-${String(mes).padStart(2,'0')}-01`)
            .lte("data", `${ano}-${String(mes).padStart(2,'0')}-31`)
            .order("data", { ascending: false });

        // carregar orçamento
        const { data: orc } = await supabase
            .from("orcamentos")
            .select("*")
            .eq("user_id", userId)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();

        let totalEntradas = 0;
        let totalDespesas = 0;

        movs.forEach(m => {
            if (m.tipo === "entrada") totalEntradas += Number(m.valor);
            if (m.tipo === "despesa") totalDespesas += Number(m.valor);
        });

        let saldoMes = totalEntradas - totalDespesas;
        let orcamento = orc ? Number(orc.total) : null;

        DASHBOARD.renderResumo({ totalEntradas, totalDespesas, saldoMes, orcamento });
        DASHBOARD.renderUltimos(movs);
    },


    /* ===========================================================
       RESUMO EM TABELA
    ============================================================ */
    renderResumo(data) {
        const box = document.getElementById("dashboard-resumo");

        box.innerHTML = `
            <table class="dash-table">
                <tr><th>Entradas</th><td>${data.totalEntradas.toFixed(2)} €</td></tr>
                <tr><th>Despesas</th><td>${data.totalDespesas.toFixed(2)} €</td></tr>
                <tr><th>Saldo do Mês</th><td>${data.saldoMes.toFixed(2)} €</td></tr>
                <tr><th>Orçamento</th><td>${data.orcamento !== null ? data.orcamento.toFixed(2) + " €" : "-"}</td></tr>
            </table>
        `;
    },


    /* ===========================================================
       LISTA DOS ÚLTIMOS MOVIMENTOS
    ============================================================ */
    renderUltimos(movs) {
        const box = document.getElementById("dashboard-ultimos");

        if (!movs.length) {
            box.innerHTML = "<p>Sem movimentos este mês.</p>";
            return;
        }

        let html = `
            <h3>Últimos Movimentos</h3>
            <table class="mov-table">
                <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                </tr>
        `;

        movs.forEach(m => {
            html += `
                <tr>
                    <td>${m.data}</td>
                    <td>${m.descricao ?? "-"}</td>
                    <td>${m.tipo}</td>
                    <td>${Number(m.valor).toFixed(2)} €</td>
                </tr>
            `;
        });

        html += "</table>";

        box.innerHTML = html;
    }
};
