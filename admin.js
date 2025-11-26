/* ===========================================================
   ADMIN.JS — V10 FINAL
   Gestão de Users, Categorias e Orçamentos
=========================================================== */

const ADMIN = {

    /* ===========================================================
       LISTA DE UTILIZADORES
    ============================================================ */
    async showUsers() {

        const cont = document.getElementById("admin-modais");
        cont.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <h3>Utilizadores</h3>
                    <div id="admin-users-list">A carregar...</div>

                    <h4>Novo Utilizador</h4>
                    <input id="new-username" placeholder="username">
                    <input id="new-password" type="password" placeholder="password inicial">

                    <select id="new-role">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>

                    <button class="btn-success" onclick="ADMIN.criarUser()">Criar</button>
                    <button class="btn-danger" onclick="ADMIN.fecharModais()">Fechar</button>
                </div>
            </div>
        `;

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .order("username");

        if (error) {
            return alert("Erro ao carregar utilizadores.");
        }

        const lista = data.map(u => `
            <div class="admin-line">
                <b>${u.username}</b> (${u.role})
                <button onclick="ADMIN.editarPassword('${u.id}','${u.username}')">Password</button>
            </div>
        `).join("");

        document.getElementById("admin-users-list").innerHTML = lista;
    },


    /* ===========================================================
       CRIAR UTILIZADOR
    ============================================================ */
    async criarUser() {
        let username = document.getElementById("new-username").value.trim().toLowerCase();
        let pass = document.getElementById("new-password").value.trim();
        let role = document.getElementById("new-role").value;

        if (!username || !pass) {
            alert("Preencha todos os campos.");
            return;
        }

        const id = crypto.randomUUID().replace(/-/g, "");

        const { error: e1 } = await supabase.from("users").insert({
            id,
            username,
            role
        });

        if (e1) return alert("Erro ao criar user.");

        const hash = await APP.hash(pass);

        const { error: e2 } = await supabase.from("user_passwords").insert({
            user_id: id,
            password_sha256: hash
        });

        if (e2) return alert("Erro ao gravar password.");

        alert("Utilizador criado.");
        ADMIN.showUsers();
    },


    /* ===========================================================
       ALTERAR PASSWORD — ABRIR MODAL
    ============================================================ */
    editarPassword(userid, username) {

        const cont = document.getElementById("admin-modais");

        cont.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <h3>Password de ${username}</h3>

                    <input id="pass1" type="password" placeholder="Nova password">
                    <input id="pass2" type="password" placeholder="Confirmar">

                    <button class="btn-success" onclick="ADMIN.gravarPassword('${userid}')">Guardar</button>
                    <button class="btn-danger" onclick="ADMIN.fecharModais()">Cancelar</button>
                </div>
            </div>
        `;
    },


    /* ===========================================================
       ALTERAR PASSWORD — GRAVAR
    ============================================================ */
    async gravarPassword(userid) {
        let p1 = document.getElementById("pass1").value.trim();
        let p2 = document.getElementById("pass2").value.trim();

        if (p1 !== p2) {
            alert("Passwords não coincidem.");
            return;
        }

        const hash = await APP.hash(p1);

        const { error } = await supabase.from("user_passwords")
            .update({ password_sha256: hash })
            .eq("user_id", userid);

        if (error) return alert("Erro ao alterar password.");

        alert("Password alterada.");
        ADMIN.fecharModais();
    },


    /* ===========================================================
       LISTAR CATEGORIAS
    ============================================================ */
    async listCategorias() {

        const cont = document.getElementById("admin-modais");

        cont.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <h3>Categorias</h3>

                    <div id="cat-lista">A carregar...</div>

                    <h4>Nova Categoria</h4>
                    <input id="new-cat-nome" placeholder="Nome">

                    <select id="new-cat-user">
                        <option value="helder">Helder</option>
                        <option value="goreti">Goreti</option>
                        <option value="conjunto">Conjunto</option>
                    </select>

                    <button class="btn-success" onclick="ADMIN.criarCategoria()">Criar</button>
                    <button class="btn-danger" onclick="ADMIN.fecharModais()">Fechar</button>
                </div>
            </div>
        `;

        const { data, error } = await supabase
            .from("categorias")
            .select("id, nome, user_id")
            .order("nome");

        if (error) return alert("Erro ao carregar categorias.");

        const mapUsers = {
            "1c98dd8f04fbfdbb0a48dce6bcf8247d924fb34a8b6f48b9c5557ffbcd7e45d1": "Helder",
            "2f9b1cc8b54a304b14f06716bf7f0ec2a3f8abf977dd8e650f5a1712da50e5a1": "Goreti",
            "a8ff446f10f0e0cf8f3ac8ea3245f033e7d5e9ff9c60139fbbd5bfe2ccea62b8": "Conjunto"
        };

        document.getElementById("cat-lista").innerHTML = data.map(c => `
            <div class="admin-line">
                ${c.nome} — <i>${mapUsers[c.user_id] ?? "???"}</i>
            </div>
        `).join("");
    },


    /* ===========================================================
       CRIAR CATEGORIA
    ============================================================ */
    async criarCategoria() {
        const nome = document.getElementById("new-cat-nome").value.trim();
        const userSel = document.getElementById("new-cat-user").value;

        const mapUserId = {
            "helder": "1c98dd8f04fbfdbb0a48dce6bcf8247d924fb34a8b6f48b9c5557ffbcd7e45d1",
            "goreti": "2f9b1cc8b54a304b14f06716bf7f0ec2a3f8abf977dd8e650f5a1712da50e5a1",
            "conjunto": "a8ff446f10f0e0cf8f3ac8ea3245f033e7d5e9ff9c60139fbbd5bfe2ccea62b8"
        };

        if (!nome) return alert("Escreva o nome da categoria.");

        const { error } = await supabase.from("categorias").insert({
            nome,
            user_id: mapUserId[userSel]
        });

        if (error) return alert("Erro ao criar categoria.");

        alert("Categoria criada.");
        ADMIN.listCategorias();
    },


    /* ===========================================================
       MOSTRAR ORÇAMENTOS
    ============================================================ */
    async showOrcamentos() {

        const cont = document.getElementById("admin-modais");

        cont.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    <h3>Orçamentos por Utilizador</h3>

                    <div id="orc-lista">A carregar...</div>

                    <button class="btn-danger" onclick="ADMIN.fecharModais()">Fechar</button>
                </div>
            </div>
        `;

        const { data, error } = await supabase
            .from("orcamentos")
            .select("*")
            .order("ano")
            .order("mes");

        if (error) return alert("Erro ao carregar orçamentos.");

        const out = data.map(o => `
            <div class="admin-line">
                <b>${o.user_id}</b> → ${o.mes}/${o.ano} = ${o.total}€
            </div>
        `).join("");

        document.getElementById("orc-lista").innerHTML = out || "Sem orçamentos.";
    },


    /* ===========================================================
       FECHAR MODAIS
    ============================================================ */
    fecharModais() {
        document.getElementById("admin-modais").innerHTML = "";
    }
};
