/* ===========================================================
   MOVIMENTOS.JS — Gestão de movimentos mensais
=========================================================== */

const MOVIMENTOS = {

    /* =======================================================
       Carregar lista de movimentos do mês atual
    ======================================================== */
    async load() {

        if (!APP.userId) {
            console.warn("Sem sessão ativa (MOVIMENTOS.load)");
            return;
        }

        await this.prepararSelects();

        const lista = document.getElementById("mov-lista");
        lista.innerHTML = "A carregar...";

        const movs = await DB.getMovimentosMes(APP.mesAtual, APP.anoAtual);

        if (!movs || movs.length === 0) {
            lista.innerHTML = "<p>Sem movimentos para este mês.</p>";
            return;
        }

        let html = `
            <table class="mov-table">
                <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                </tr>
        `;

        const categorias = await DB.getCategorias();
        const mapCat = Object.fromEntries(categorias.map(c => [c.id, c.nome]));

        movs.forEach(m => {
            html += `
                <tr>
                    <td>${m.data}</td>
                    <td>${m.descricao ?? "-"}</td>
                    <td>${m.tipo}</td>
                    <td>${mapCat[m.categoria_id] ?? "-"}</td>
                    <td>${Number(m.valor).toFixed(2)} €</td>
                </tr>
            `;
        });

        html += "</table>";
        lista.innerHTML = html;
    },


    /* =======================================================
       Preparar selects de mês/ano e categorias
    ======================================================== */
    async prepararSelects() {
        // sincronizar selects do dashboard para mês/ano
        const selMes = document.getElementById("sel-mes");
        const selAno = document.getElementById("sel-ano");
        if (selMes) selMes.value = APP.mesAtual;
        if (selAno) selAno.value = APP.anoAtual;

        await this.carregarCategorias();
    },


    /* =======================================================
       Abrir modal para adicionar movimento
    ======================================================== */
    async abrirAdicionar() {

        if (!APP.userId) {
            alert("É necessário iniciar sessão.");
            return;
        }

        await this.carregarCategorias();

        document.getElementById("mov-data").value = new Date().toISOString().slice(0, 10);
        document.getElementById("mov-desc").value = "";
        document.getElementById("mov-valor").value = "";
        document.getElementById("mov-tipo").value = "entrada";

        document.getElementById("modal-mov").classList.remove("hidden");
    },


    /* =======================================================
       Fechar modal
    ======================================================== */
    fechar() {
        document.getElementById("modal-mov").classList.add("hidden");
    },


    /* =======================================================
       Adicionar movimento
    ======================================================== */
    async adicionar() {

        if (!APP.userId) {
            alert("Sessão expirada. Faça login novamente.");
            return;
        }

        const data = document.getElementById("mov-data").value;
        const descricao = document.getElementById("mov-desc").value.trim();
        const valor = document.getElementById("mov-valor").value;
        const tipo = document.getElementById("mov-tipo").value;
        const categoria_id = document.getElementById("mov-cat").value;

        if (!data || !valor || !categoria_id) {
            alert("Preencha data, valor e categoria.");
            return;
        }

        const { error } = await DB.addMovimento({
            data,
            descricao: descricao || null,
            categoria_id,
            tipo,
            valor
        });

        if (error) {
            console.error("Erro ao adicionar movimento:", error);
            alert("Erro ao guardar o movimento.");
            return;
        }

        alert("Movimento adicionado.");
        this.fechar();
        await DASHBOARD.load();
        await this.load();
    },


    /* =======================================================
       Carregar categorias para o select
    ======================================================== */
    async carregarCategorias() {
        const cats = await DB.getCategorias();
        const sel = document.getElementById("mov-cat");

        if (!sel) return;

        sel.innerHTML = cats
            .map(c => `<option value="${c.id}">${c.nome}</option>`)
            .join("");
    }
};
