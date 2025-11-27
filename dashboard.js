/* ===========================================================
   DASHBOARD.JS — V10 FINAL CORRIGIDO
   Resumo mensal + últimos movimentos
=========================================================== */

const DASHBOARD = {

    /* ===========================================================
       CARREGAR DASHBOARD
    ============================================================ */
    async load() {

        // verificar sessão válida
        if (!APP.userId) {
            console.warn("Sem sessão ativa.");
            return;
        }

        const client = APP.ensureClient();
        if (!client) return;

        const userId = APP.userId;
        const mes = APP.mesAtual;
        const ano = APP.anoAtual;

        const mesStr = String(mes).padStart(2, "0");

        /* =======================================================
           1) CARREGAR MOVIMENTOS PARA O USER LOGADO
        ======================================================== */
        const { data: movs, error: e1 } = await client
            .from("movimentos")
            .select("id, data, descricao, valor, tipo, user_id")
            .eq("user_id", userId)
            .gte("data", `${ano}-${mesStr}-01`)
            .lte("data", `${ano}-${mesStr}-31`)
            .order("data", { ascending: false });

        if (e1) {
            console.error("Erro movimentos:", e1);
            return;
        }

        /* =======================================================
           2) CARREGAR ORÇAMENTO DO MÊS
        ======================================================== */
        const { data: orc, error: e2 } = await client
            .from("orcamentos")
            .select("*")
            .eq("user_id", userId)
            .eq("mes", mes)
            .eq("ano", ano)
            .maybeSingle();

        if (e2) {
            console.error("Erro orcamento:", e2);
        }

        /* =======================================================
           3) CALCULOS
        ======================================================== */
        let totalEntradas = 0;
        let totalDespesas = 0;

        if (movs && movs.length) {
            movs.forEach(m => {
                if (m.tipo === "entrada") totalEntradas += Number(m.valor);
                if (m.tipo === "despesa") totalDespesas += Number(m.valor);
            });
        }

        const saldoMes = totalEntradas - totalDespesas;
        const orcamento = orc ? Number(orc.total) : null;

        /* =======================================================
           4) RENDER
        ======================================================== */
        this.renderResumo({ totalEntradas, totalDespesas, saldoMes, orcamento });
        this.renderUltimos(movs || []);
    },


    /* ===========================================================
       RESUMO
    ============================================================ */
    renderResumo(data) {
        const box = document.getElementById("dashboard-resumo");

        box.innerHTML = `
            <table class="dash-table">
                <tr><th>Entradas</th><td>${data.totalEntradas.toFixed(2)} €</td></tr>
                <tr><th>Despesas</th><td>${data.totalDespesas.toFixed(2)} €</td></tr>
                <tr><th>Saldo do Mês</th><td>${data.saldoMes.toFixed(2)} €</td></tr>
                <tr><th>Orçamento</th>
                    <td>${data.orcamento !== null ? data.orcamento.toFixed(2) + " €" : "-"}</td>
                </tr>
            </table>
        `;
    },


    /* ===========================================================
       LISTA DOS ÚLTIMOS MOVIMENTOS
    ============================================================ */
    renderUltimos(movs) {

        const box = document.getElementById("dashboard-ultimos");

        if (!movs || movs.length === 0) {
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
