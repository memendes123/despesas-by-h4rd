/* ===========================================================
   METAS.JS — V10 FINAL
   Gestão de metas do utilizador
=========================================================== */

const METAS = {

    /* ===========================================================
       Carregar metas
    ============================================================ */
    async load() {

        const box = document.getElementById("metas-lista");
        box.innerHTML = "A carregar...";

        const metas = await DB.getMetas();

        if (!metas.length) {
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
       Abrir modal para adicionar meta
    ============================================================ */
    abrirAdicionar() {
        document.getElementById("modal-meta").classList.remove("hidden");
    },


    fecharAdicionar() {
        document.getElementById("modal-meta").classList.add("hidden");

        document.getElementById("meta-nome").value = "";
        document.getElementById("meta-objetivo").value = "";
        document.getElementById("meta-inicio").value = "";
        document.getElementById("meta-fim").value = "";
    },


    /* ===========================================================
       Guardar nova meta
    ============================================================ */
    async adicionar() {

        const nome = document.getElementById("meta-nome").value.trim();
        const objetivo = document.getElementById("meta-objetivo").value;
        const inicio = document.getElementById("meta-inicio").value;
        const fim = document.getElementById("meta-fim").value;

        if (!nome || !objetivo) {
            alert("Nome e objetivo são obrigatórios.");
            return;
        }

        await DB.addMeta({
            nome,
            objetivo,
            inicio: inicio || null,
            fim: fim || null
        });

        alert("Meta adicionada com sucesso!");

        METAS.fecharAdicionar();
        METAS.load();
    },

};
