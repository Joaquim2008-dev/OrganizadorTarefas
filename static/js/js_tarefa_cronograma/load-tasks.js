// Carrega tarefas já existentes no cronograma

function appendTarefaItem(taskTd, tarefa) {
    const id = tarefa.id || tarefa.dia_tarefa_id || ''
    taskTd.insertAdjacentHTML('beforeend', `
        <div class="tarefa-item" data-dia-id="${id}">
            <span class="tarefa-nome">${tarefa.tarefa_nome}</span>
            <button class="tarefa-delete" type="button" data-dia-id="${id}" title="Remover">✕</button>
        </div>
    `)
}

function ver_tasks() {
    window.addEventListener('load', () => {
        if (dia_tarefas) {
            const dataSelecionada = document.body.dataset.tarefaData || ''

            dia_tarefas
                .filter(tarefa => tarefa.data === dataSelecionada)
                .forEach(tarefa => {
                    const cell = [...document.querySelectorAll('tr')]
                        .find(tr => tr.querySelector('td:first-child')?.textContent.trim() === tarefa.hora_cronograma)

                    const taskTd = cell?.querySelector('td.task-cron')
                    if (taskTd) appendTarefaItem(taskTd, tarefa)
                })
        }
    })
}
