document.addEventListener('DOMContentLoaded', function () {
    const catSelect = document.getElementById('cat_id');

    // Buscar tarefas iniciais (caso já venha algo selecionado)
    buscarTarefas();

    // Listener para mudança de categoria
    if (catSelect) {
        catSelect.addEventListener('change', function () {
            buscarTarefas();
        });
    }
});

function buscarTarefas() {
    const catSelect = document.getElementById('cat_id');
    const categoria = catSelect ? catSelect.value : 'nenhuma';

    // Se for "nenhuma", limpa as listas e não faz fetch
    if (categoria === 'nenhuma') {
        renderizarTarefas([]);
        return;
    }

    fetch(`/api/buscar-tarefas/?categoria=${encodeURIComponent(categoria)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderizarTarefas(data.tarefas);
            }
        })
        .catch(error => console.error('Erro ao buscar tarefas:', error));
}

function renderizarTarefas(tarefas) {
    const listEspera = document.getElementById('list-espera');
    const listAndamento = document.getElementById('list-andamento');
    const listConcluidas = document.getElementById('list-concluidas');

    // Limpar listas
    listEspera.innerHTML = '';
    listAndamento.innerHTML = '';
    listConcluidas.innerHTML = '';

    tarefas.forEach(tarefa => {
        const card = criarCardTarefa(tarefa);
        const status = (tarefa.status || '').toUpperCase().trim();

        if (status === 'ES') {
            listEspera.appendChild(card);
        } else if (status === 'AN') {
            listAndamento.appendChild(card);
        } else if (status === 'CO') {
            listConcluidas.appendChild(card);
        } else {
            // Caso existam outros status ou valores legados
            console.warn(`Status desconhecido para tarefa ${tarefa.id}: ${status}`);
            listEspera.appendChild(card);
        }
    });
}

function criarCardTarefa(tarefa) {
    const div = document.createElement('div');
    div.className = 'task-card-item';
    div.innerHTML = `
        <div class="task-card-content">
            <h3 class="task-title">${tarefa.nome}</h3>
            <p class="task-desc">${tarefa.descricao || 'Sem descrição'}</p>
            <div class="task-meta">
                <span class="task-priority badge-${tarefa.prioridade.toLowerCase()}">${tarefa.prioridade}</span>
                <span class="task-category">${tarefa.categoria}</span>
            </div>
        </div>
        <button class="btn-view-details" title="Ver detalhes" onclick="window.location.href='/horas/${tarefa.id}/'">
            <i class="fas fa-eye"></i> 👀
        </button>
    `;
    return div;
}
