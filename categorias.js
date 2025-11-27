/* ===========================================================
   CATEGORIAS.JS — Gestão básica de categorias por utilizador
=========================================================== */

const CATEGORIAS = {

    /* =======================================================
       Carregar lista de categorias do utilizador
    ======================================================== */
    async load() {

        if (!APP.userId) {
            console.warn("Sem sessão ativa (CATEGORIAS.load)");
            return;
        }

        const lista = document.getElementById("cat-lista");
        if (!lista) return;

        lista.innerHTML = "A carregar...";

        const categorias = await DB.getCategorias();

        if (!categorias || categorias.length === 0) {
            lista.innerHTML = "<p>Sem categorias registadas.</p>";
            return;
        }

        // Apenas admins recebem o nome do utilizador associado
        let mapUsers = null;
        if (APP.role === "admin") {
            const users = await ADMIN.loadUsers();
            mapUsers = Object.fromEntries(users.map(u => [u.id, `${u.username} (${u.role})`]));
        }

        const linhas = categorias.map(c => {
            const owner = mapUsers ? ` — <i>${mapUsers[c.user_id] || "(sem utilizador)"}</i>` : "";
            return `<div class="admin-line">${c.nome}${owner}</div>`;
        });

        lista.innerHTML = linhas.join("");
    },


    /* =======================================================
       Criar nova categoria para o user atual
    ======================================================== */
    async criar() {

        if (!APP.userId) {
            alert("Sessão expirada. Faça login novamente.");
            return;
        }

        const input = document.getElementById("cat-nome");
        const nome = input?.value.trim();

        if (!nome) {
            alert("Indique o nome da categoria.");
            return;
        }

        const { error } = await DB.addCategoria(nome, APP.userId);

        if (error) {
            console.error("Erro ao criar categoria:", error);
            alert("Não foi possível criar a categoria.");
            return;
        }

        alert("Categoria criada.");
        input.value = "";
        await this.load();
    }
};
