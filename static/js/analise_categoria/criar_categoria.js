document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('catModal');
    const openBtn = document.getElementById('openCatModalBtn');
    const closeBtn = document.querySelector('.close-cat-modal');
    const cancelBtn = document.querySelector('.btn-cancel-cat');
    const saveBtn = document.getElementById('saveCatBtn');
    const catNomeInput = document.getElementById('cat_nome');

    // CSRF token helper
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    openBtn.onclick = () => {
        modal.style.display = 'flex';
        catNomeInput.value = '';
        catNomeInput.focus();
    };

    const closeModal = () => {
        modal.style.display = 'none';
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    saveBtn.onclick = function () {
        const nome = catNomeInput.value.trim();
        if (!nome) {
            alert('Por favor, insira um nome para a categoria.');
            return;
        }

        fetch('/api/criar-categoria/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ nome: nome })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Categoria criada com sucesso!');
                    closeModal();
                    // Opcional: Recarregar a página para atualizar o select de categorias
                    window.location.reload();
                } else {
                    alert('Erro ao criar categoria: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro de conexão ao criar categoria.');
            });
    };

    // --- NOVA LÓGICA DE LISTAGEM E EXCLUSÃO ---
    const listModal = document.getElementById('listCatModal');
    const closeListBtn = document.querySelector('.close-list-cat-modal');
    const cancelListBtn = document.querySelector('.btn-cancel-list-cat');
    const categoriesContainer = document.getElementById('categoriesContainer');

    openBtn.oncontextmenu = (e) => {
        e.preventDefault();
        loadAndShowCategories();
    };

    function loadAndShowCategories() {
        fetch('/api/listar-categorias/')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    renderCategories(data.categorias);
                    listModal.style.display = 'flex';
                }
            });
    }

    function renderCategories(categorias) {
        categoriesContainer.innerHTML = '';
        categorias.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'cat-item';
            div.innerHTML = `
                <span>${cat.nome}</span>
                <button class="btn-delete-cat" data-id="${cat.id}">🗑️</button>
            `;
            categoriesContainer.appendChild(div);
        });

        document.querySelectorAll('.btn-delete-cat').forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                if (confirm('Tem certeza que deseja excluir esta categoria?')) {
                    deleteCategory(id);
                }
            };
        });
    }

    function deleteCategory(id) {
        fetch('/api/excluir-categoria/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ id: id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadAndShowCategories(); // Atualiza a lista
            } else {
                alert('Erro ao excluir: ' + data.error);
            }
        });
    }

    const closeList = () => { listModal.style.display = 'none'; };
    closeListBtn.onclick = closeList;
    cancelListBtn.onclick = closeList;
});
