// Salva tarefas no cronograma

function preencherCelula(tarefaNome, diaTarefaId, tarefaId) {
    if (!window.targetCell) return

    const tarefasExistentes = window.targetCell.dataset.tarefas
        ? JSON.parse(window.targetCell.dataset.tarefas)
        : []

    if (tarefasExistentes.length >= 3) {
        alert('A célula já possui 3 tarefas. Remova uma antes de adicionar outra.')
        return
    }

    tarefasExistentes.push({ nome: tarefaNome, diaTarefaId: diaTarefaId || '', tarefaId: tarefaId || '' })
    window.targetCell.dataset.tarefas = JSON.stringify(tarefasExistentes)

    const itemsHtml = tarefasExistentes
        .slice(0, 3)
        .map(item => `
            <div class="tarefa-item" data-dia-id="${item.diaTarefaId}" data-tarefa-id="${item.tarefaId}">
                <span class="tarefa-nome">${item.nome}</span>
                <button class="tarefa-delete" type="button" data-dia-id="${item.diaTarefaId}" title="Remover">✕</button>
            </div>
        `)
        .join('')

    window.targetCell.innerHTML = itemsHtml
}

function setupSaveTarefaListener(listaResultados) {
    listaResultados.addEventListener('click', (event) => {
        const item = event.target.closest('.item-tarefa')

        const tarefaNomeClicada = item.dataset.nome || item.querySelector('.tarefa-nome')?.textContent || item.textContent.trim()

        const tarefas_tr_atual = window.targetCell.closest('tr').querySelectorAll('.tarefa-nome')
        let verificador = false
        tarefas_tr_atual.forEach(task => {
            console.log(task.textContent)
            if (task.textContent.trim() == tarefaNomeClicada) {
                verificador = true
            }
        })

        if (verificador) {
            alert('Tarefa não pode ser repetida!')
            return
        }

        if (!item) return

        const hora = window.targetCell.closest('tr').querySelector('td:first-child').textContent.trim()
        const tarefaId = item.dataset.id
        const tarefaNome = item.dataset.nome
        const dataSelecionada = document.body.dataset.tarefaData || ''

        if (!dataSelecionada) {
            alert('Data da página não definida. Verifique se você está na página de tarefa específica.')
            return
        }

        if (!window.targetCell) {
            alert('Clique em um horário primeiro para associar a tarefa.')
            return
        }

        fetch('/api-dia-tarefa/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                tarefa_id: tarefaId,
                data: dataSelecionada,
                hora: hora
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text.substring(0, 120)}`) })
                }
                return response.json()
            })
            .then((data) => {
                if (data.success) {
                    preencherCelula(tarefaNome, data.dia_tarefa_id, tarefaId)

                } else {
                    alert('Falha ao salvar dia_tarefa: ' + (data.error || 'erro desconhecido'))
                }
            })
            .catch((error) => {
                alert('Erro de rede: ' + error)
            })
    })
}
