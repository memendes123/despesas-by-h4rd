/* ===========================================================
   METAS.JS — V12 FINAL CORRIGIDO
   Gestão de metas do utilizador
=========================================================== */

const METAS = {

    /* ===========================================================
       Carregar metas
    ============================================================ */
    async load() {

        if (!APP.userId) {
            console.warn("Sem sessão ativa (METAS.load)");
            return;
        }

        const box = document.getElementById("metas-lista");
        box.innerHTML = "A carregar...";

        const metas = await DB.getMetas();

        if (!metas || metas.length === 0) {
            box.innerHTML = "<p>Sem metas registadas.</p>";
            return;
        }

        let html = `
            <table class="mov-table">
                <tr>
                    <th>Meta</th>
                    <th>Objetivo</th>
                    <th>Início</th>
                    <th>Fim</th>
                </tr>
        `;

        metas.forEach(m => {
            html += `
                <tr>
                    <td>${m.nome}</td>
                    <td>${Number(m.objetivo).toFixed(2)} €</td>
                    <td>${m.inicio ?? "-"}</td>
                    <td>${m.fim ?? "-"}</td>
                </tr>
            `;
        });

        html += "</table>";
        box.innerHTML = html;
    },


    /* ===========================================================
       Abrir modal
    ============================================================ */
    abrirAdicionar() {

        if (!APP.userId) {
            alert("É necessário iniciar sessão.");
            return;
        }

        document.getElementById("modal-meta").classList.remove("hidden");
    },


    /* ===========================================================
       Fechar modal + limpar inputs
    ============================================================ */
    fecharAdicionar() {

        document.getElementById("modal-meta").classList.add("hidden");

        document.getElementById("meta-nome").value = "";
        document.getElementById("meta-objetivo").value = "";
        document.getElementById("meta-inicio").value = "";
        document.getElementById("meta-fim").value = "";
    },


    /* ===========================================================
       Adicionar nova meta
    ============================================================ */
    async adicionar() {

        if (!APP.userId) {
            alert("Sessão expirada. Faça login novamente.");
            return;
        }

        const nome = document.getElementById("meta-nome").value.trim();
        const objetivo = document.getElementById("meta-objetivo").value;
        const inicio = document.getElementById("meta-inicio").value;
        const fim = document.getElementById("meta-fim").value;

        if (!nome || !objetivo) {
            alert("Nome e objetivo são obrigatórios.");
            return;
        }

        const { error } = await DB.addMeta({
            nome,
            objetivo,
            inicio: inicio || null,
            fim: fim || null
        });

        if (error) {
            console.error("Erro ao adicionar meta:", error);
            alert("Erro ao guardar a meta.");
            return;
        }

        alert("Meta adicionada com sucesso!");

        METAS.fecharAdicionar();
        METAS.load();
    }

};
