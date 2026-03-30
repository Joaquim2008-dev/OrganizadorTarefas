// Deleta tarefas do cronograma

function deletar_botao(event) {
    const deleteBtn = event.target.closest('.tarefa-delete')
    if (!deleteBtn) return

    event.stopPropagation()
    const diaTarefaId = deleteBtn.dataset.diaId || ''
    const nome_tarefa = deleteBtn.closest('div').querySelector('.tarefa-nome').textContent.trim()
    const hora = deleteBtn.closest('tr').querySelector('td:first-child').textContent.trim()
    const dataSelecionada = document.body.dataset.tarefaData || ''

    if (!nome_tarefa || !hora || !dataSelecionada) {
        alert('Dados de tarefa incompletos para exclusão.')
        return
    }

    const tarefa_atual = deleteBtn.closest('.tarefa-item')
    const taskCell = deleteBtn.closest('td.task-cron') || deleteBtn.closest('td')

    fetch('/api-deletar-dia-tarefa/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
            dia_tarefa_id: diaTarefaId,
            nome_tarefa: nome_tarefa,
            hora: hora,
            data: dataSelecionada
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (tarefa_atual) tarefa_atual.remove()

                if (taskCell && taskCell.dataset.tarefas) {
                    try {
                        let tarefasExistentes = JSON.parse(taskCell.dataset.tarefas)
                        tarefasExistentes = tarefasExistentes.filter(item => String(item.diaTarefaId) !== String(diaTarefaId))
                        if (tarefasExistentes.length > 0) {
                            taskCell.dataset.tarefas = JSON.stringify(tarefasExistentes)
                        } else {
                            delete taskCell.dataset.tarefas
                        }
                    } catch (e) {
                        console.warn('Erro ao atualizar data-tarefas:', e)
                    }
                }

            } else {
                alert('Falha ao excluir tarefa: ' + (data.error || 'erro desconhecido'))
            }
        })
        .catch((err) => alert('Erro de rede: ' + err))
}

function setupDeleteListener() {
    const cronogramaWrapper = document.querySelector('.cronograma-table-wrapper')
    if (cronogramaWrapper) {
        cronogramaWrapper.addEventListener('click', (event) => {
            const deleteBtn = event.target.closest('.tarefa-delete')
            if (!deleteBtn) return
            event.stopPropagation()
            deletar_botao(event)
        })
    }
}
