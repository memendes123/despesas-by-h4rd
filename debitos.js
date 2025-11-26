/* ===========================================================
   DEBITOS.JS — V10 FINAL
   Gestão completa de débitos diretos por utilizador
=========================================================== */

const DEBITOS = {

    /* ===========================================================
       Carregar lista de débitos
    ============================================================ */
    async load() {

        const lista = document.getElementById("debitos-lista");
        lista.innerHTML = "A carregar...";

        const debitos = await DB.getDebitos();

        if (!debitos.length) {
            lista.innerHTML = "<p>Sem débitos diretos.</p>";
            return;
        }

        let html = `
            <table class="mov-table">
                <tr>
                    <th>Nome</th>
                    <th>Valor</th>
                    <th>Dia</th>
                    <th>Início</th>
                    <th>Fim</th>
                </tr>
        `;

        debitos.forEach(d => {
            html += `
                <tr>
                    <td>${d.nome}</td>
                    <td>${Number(d.valor).toFixed(2)} €</td>
                    <td>${d.dia}</td>
                    <td>${d.inicio ?? "-"}</td>
                    <td>${d.fim ?? "-"}</td>
                </tr>
            `;
        });

        html += "</table>";
        lista.innerHTML = html;
    },


    /* ===========================================================
       Abrir modal para adicionar
    ============================================================ */
    abrirAdicionar() {
        document.getElementById("modal-debito").classList.remove("hidden");
    },


    fecharAdicionar() {
        document.getElementById("modal-debito").classList.add("hidden");

        document.getElementById("deb-nome").value = "";
        document.getElementById("deb-valor").value = "";
        document.getElementById("deb-dia").value = "";
        document.getElementById("deb-inicio").value = "";
        document.getElementById("deb-fim").value = "";
    },


    /* ===========================================================
       Guardar novo débito
    ============================================================ */
    async adicionarDebito() {

        const nome = document.getElementById("deb-nome").value.trim();
        const valor = document.getElementById("deb-valor").value;
        const dia = document.getElementById("deb-dia").value;
        const inicio = document.getElementById("deb-inicio").value;
        const fim = document.getElementById("deb-fim").value;

        if (!nome || !valor || !dia) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        await DB.addDebito({
            nome,
            valor,
            dia,
            inicio: inicio || null,
            fim: fim || null
        });

        alert("Débito adicionado com sucesso.");

        DEBITOS.fecharAdicionar();
        DEBITOS.load();
    },

};
