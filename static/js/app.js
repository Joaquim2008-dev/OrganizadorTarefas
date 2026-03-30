document.addEventListener('DOMContentLoaded', function () {
    const addTask = document.querySelectorAll('#tarefa')
    const modal = document.querySelector('#tarefa-modal')
    const buscaInput = document.querySelector('#tarefa-busca')
    const listaResultados = document.querySelector('#resultado-tarefas')
    let targetCell = null

    function getCookie(name) {
        let cookieValue = null
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';')
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim()
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                    break
                }
            }
        }
        return cookieValue
    }

    const csrftoken = getCookie('csrftoken')

    function appendTarefaItem(taskTd, tarefa) {
        const id = tarefa.id || tarefa.dia_tarefa_id || ''
        taskTd.insertAdjacentHTML('beforeend', `
            <div class="tarefa-item" data-dia-id="${id}">
                <span class="tarefa-nome">${tarefa.tarefa_nome}</span>
                <button class="tarefa-delete" type="button" data-dia-id="${id}" title="Remover">✕</button>
            </div>
        `)

    }

    //Verificar se já existe tarefas cadastradas no DiaTarefa para persistir dados no site:
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

    ver_tasks()

    const cronogramaWrapper = document.querySelector('.cronograma-table-wrapper')
    if (cronogramaWrapper) {
        cronogramaWrapper.addEventListener('click', (event) => {
            const deleteBtn = event.target.closest('.tarefa-delete')
            if (!deleteBtn) return
            event.stopPropagation()
            deletar_botao(event)
        })
    }

    //Função para deletar tarefa do template
    function deletar_botao(event) {
        const deleteBtn = event.target.closest('.tarefa-delete')
        if (!deleteBtn) return

        event.stopPropagation()
        // dados para backend (deletar tarefa)
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

    //Processor filtrar tarefas:
    function filtrarTarefas() {
        const termo = buscaInput.value.trim().toLowerCase()
        const itens = listaResultados.querySelectorAll('.item-tarefa')
        const resposta = document.querySelector('.nenhuma-tarefa')

        if (!termo) {
            itens.forEach(item => item.style.display = 'none')
            listaResultados.style.display = 'none'
            if (resposta) resposta.style.display = 'block'
            return
        }

        let encontrados = 0
        itens.forEach(item => {
            const nome = item.dataset.nome.toLowerCase()
            const match = nome.includes(termo)
            item.style.display = match ? 'block' : 'none'
            if (match) encontrados += 1
        })

        listaResultados.style.display = 'block'
        if (resposta) {
            resposta.style.display = encontrados ? 'none' : 'block'
        }
    }

    buscaInput.addEventListener('input', filtrarTarefas)

    //Até 3 tarefas na célula de tarefa
    function preencherCelula(tarefaNome, diaTarefaId) {
        if (!targetCell) return

        const tarefasExistentes = targetCell.dataset.tarefas
            ? JSON.parse(targetCell.dataset.tarefas)
            : []

        if (tarefasExistentes.length >= 3) {
            alert('A célula já possui 3 tarefas. Remova uma antes de adicionar outra.')
            return
        }

        tarefasExistentes.push({ nome: tarefaNome, diaTarefaId: diaTarefaId || '' })
        targetCell.dataset.tarefas = JSON.stringify(tarefasExistentes)

        const itemsHtml = tarefasExistentes
            .slice(0, 3)
            .map(item => `
                <div class="tarefa-item" data-dia-id="${item.diaTarefaId}">
                    <span class="tarefa-nome">${item.nome}</span>
                    <button class="tarefa-delete" type="button" data-dia-id="${item.diaTarefaId}" title="Remover">✕</button>
                </div>
            `)
            .join('')

        targetCell.innerHTML = itemsHtml
    }

    //Guardar as tarefas no model de Dia Tarefa
    listaResultados.addEventListener('click', (event) => {
        const item = event.target.closest('.item-tarefa')

        const tarefaNomeClicada = item.dataset.nome || item.querySelector('.tarefa-nome')?.textContent || item.textContent.trim()

        const tarefas_tr_atual = targetCell.closest('tr').querySelectorAll('.tarefa-nome')
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

        const hora = targetCell.closest('tr').querySelector('td:first-child').textContent.trim()
        const tarefaId = item.dataset.id
        const tarefaNome = item.dataset.nome
        const dataSelecionada = document.body.dataset.tarefaData || ''

        if (!dataSelecionada) {
            alert('Data da página não definida. Verifique se você está na página de tarefa específica.')
            return
        }

        if (!targetCell) {
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
                    preencherCelula(tarefaNome, data.dia_tarefa_id)

                } else {
                    alert('Falha ao salvar dia_tarefa: ' + (data.error || 'erro desconhecido'))
                }
            })
            .catch((error) => {
                alert('Erro de rede: ' + error)
            })
    })

    document.querySelector('#fechar-modal').addEventListener('click', () => modal.close())

    addTask.forEach(tarefa => {
        tarefa.addEventListener('click', function (event) {
            // Se o clique foi dentro de uma tarefa já adicionada, não abrir modal.
            if (event.target.closest('.tarefa-item')) {
                return
            }

            targetCell = this
            modal.showModal()
            buscaInput.value = ''
            filtrarTarefas()
            buscaInput.focus()
        })
    })

})