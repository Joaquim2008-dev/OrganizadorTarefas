// Gerencia o modal de ações para tarefas já cadastradas

function setupTarefaMenuListener() {
    const cronogramaWrapper = document.querySelector('.cronograma-table-wrapper')
    const tarefaMenuModal = document.querySelector('#tarefa-menu-modal')
    const tarefaMenuTitulo = document.querySelector('#tarefa-menu-titulo')
    const tarefaMenuStart = document.querySelector('#tarefa-menu-start')
    const tarefaMenuExcluir = document.querySelector('#tarefa-menu-excluir')
    const tarefaMenuFechar = document.querySelector('#tarefa-menu-fechar')

    if (cronogramaWrapper) {
        cronogramaWrapper.addEventListener('click', (event) => {
            // Ignora clique no botão de deletar (tratado em delete-tarefa.js)
            if (event.target.closest('.tarefa-delete')) return

            const tarefaItem = event.target.closest('.tarefa-item')
            if (!tarefaItem) return

            event.stopPropagation()

            const tarefaNome = tarefaItem.querySelector('.tarefa-nome')?.textContent || 'Tarefa'
            tarefaMenuTitulo.textContent = tarefaNome
            tarefaMenuModal.dataset.selectedTarefa = tarefaItem.dataset.diaId || ''
            tarefaMenuModal.dataset.selectedTarefaId = tarefaItem.dataset.tarefaId || ''

            tarefaMenuModal.showModal()
        })
    }

    // Fechar modal
    if (tarefaMenuFechar) {
        tarefaMenuFechar.addEventListener('click', () => {
            tarefaMenuModal.close()
        })
    }

    // Start: redireciona para a página de horas da tarefa, passando a data do cronograma
    if (tarefaMenuStart) {
        tarefaMenuStart.addEventListener('click', () => {
            const tarefaId = tarefaMenuModal.dataset.selectedTarefaId
            if (!tarefaId) {
                alert('Tarefa sem ID definido.')
                return
            }
            const dataCronograma = document.body.dataset.tarefaData || ''
            window.location.href = `/horas/${tarefaId}/?data=${dataCronograma}`
        })
    }

    // Excluir: remove tarefa definitivamente do banco de dados
    if (tarefaMenuExcluir) {
        tarefaMenuExcluir.addEventListener('click', () => {
            const tarefaId = tarefaMenuModal.dataset.selectedTarefaId
            const tarefaNome = tarefaMenuTitulo.textContent

            if (!tarefaId) {
                alert('Tarefa sem ID definido.')
                return
            }

            const confirmar = window.confirm(`Deseja excluir permanentemente a tarefa "${tarefaNome}"?`)
            if (!confirmar) return

            fetch('/api-excluir-tarefa-banco/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({ tarefa_id: tarefaId }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        tarefaMenuModal.close()
                        // Remove o item visualmente de todas as células do cronograma
                        document.querySelectorAll(`.tarefa-item[data-tarefa-id="${tarefaId}"]`).forEach(el => el.remove())
                        // Remove do modal de busca de tarefas
                        document.querySelectorAll(`#resultado-tarefas li.item-tarefa[data-id="${tarefaId}"]`).forEach(el => el.remove())
                    } else {
                        alert('Falha ao excluir tarefa: ' + (data.error || 'erro desconhecido'))
                    }
                })
                .catch(err => alert('Erro de rede: ' + err))
        })
    }
}
