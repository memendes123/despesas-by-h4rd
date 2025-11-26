/* ===========================================================
   DEBITOS.JS — V12 FINAL CORRIGIDO
   Gestão completa de débitos diretos por utilizador
=========================================================== */

const DEBITOS = {

    /* ===========================================================
       Carregar lista de débitos
    ============================================================ */
    async load() {

        if (!APP.userId) {
            console.warn("Sem sessão ativa (DEBITOS.load)");
            return;
        }

        const lista = document.getElementById("debitos-lista");
        lista.innerHTML = "A carregar...";

        const debitos = await DB.getDebitos();

        if (!debitos || debitos.length === 0) {
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
        if (!APP.userId) {
            alert("É necessário iniciar sessão.");
            return;
        }

        document.getElementById("modal-debito").classList.remove("hidden");
    },


    fecharAdicionar() {
        document.getElementById("modal-debito").classList.add("hidden");

        // limpar campos
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

        if (!APP.userId) {
            alert("Sessão expirada. Faça login novamente.");
            return;
        }

        const nome = document.getElementById("deb-nome").value.trim();
        const valor = document.getElementById("deb-valor").value;
        const dia = document.getElementById("deb-dia").value;
        const inicio = document.getElementById("deb-inicio").value;
        const fim = document.getElementById("deb-fim").value;

        if (!nome || !valor || !dia) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        const { error } = await DB.addDebito({
            nome,
            valor,
            dia,
            inicio: inicio || null,
            fim: fim || null
        });

        if (error) {
            console.error("Erro ao adicionar débito:", error);
            alert("Erro ao guardar o débito.");
            return;
        }

        alert("Débito adicionado com sucesso.");

        DEBITOS.fecharAdicionar();
        DEBITOS.load();
    }

};
