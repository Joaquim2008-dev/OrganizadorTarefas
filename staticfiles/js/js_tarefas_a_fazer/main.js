document.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById('select-tarefa-fazer')
    const addBtn = document.getElementById('btn-adicionar-tarefa-fazer')
    const listWrapper = document.getElementById('tarefas-a-fazer-list')

    const maxCards = 5
    const dataSelecionada = document.body.dataset.tarefaData || ''

    function getCookie(name) {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop().split(';').shift()
        return ''
    }

    function formatHorasMinutos(minutos) {
        const total = Number(minutos) || 0
        const hours = Math.floor(total / 60)
        const mins = total % 60
        return `${hours}h ${String(mins).padStart(2, '0')}m`
    }

    const selectedItems = []

    function renderCards(items) {
        listWrapper.innerHTML = ''

        if (items.length === 0) {
            listWrapper.innerHTML = '<div style="color: #4f6aa5;">Nenhuma tarefa selecionada.</div>'
            return
        }

        items.slice(0, maxCards).forEach(item => {
            const card = document.createElement('div')
            card.classList.add('tarefas-a-fazer-card')
            card.dataset.tarefaId = item.tarefa_id
            card.dataset.itemId = item.id

            card.innerHTML = `
        <button class="btn-close-card" title="Remover">×</button>
        <h3>${item.tarefa_nome}</h3>
        <small>${item.descricao || 'Sem descrição'}</small>
        <span>Horas estimadas: ${formatHorasMinutos(item.horas_estimadas)}</span>
      `

            const closeBtn = card.querySelector('.btn-close-card')
            closeBtn.addEventListener('click', () => {
                fetch('/api-tarefa-fazer-delete/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify({ id: item.id }),
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            const index = selectedItems.findIndex(el => el.id === item.id)
                            if (index !== -1) selectedItems.splice(index, 1)
                            renderCards(selectedItems)
                        }
                    })
            })

            listWrapper.appendChild(card)
        })
    }

    // Carregar tarefas já salvas para este dia
    if (dataSelecionada) {
        fetch(`/api-tarefa-fazer-list/?data=${dataSelecionada}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    selectedItems.push(...data.items)
                    renderCards(selectedItems)
                }
            })
    } else {
        renderCards(selectedItems)
    }

    addBtn.addEventListener('click', () => {
        const selectedOption = select.options[select.selectedIndex]
        if (!selectedOption || !selectedOption.value) {
            alert('Selecione uma tarefa primeiro.')
            return
        }

        if (selectedItems.length >= maxCards) {
            alert('Máximo de 5 tarefas alcançado.')
            return
        }

        const tarefaId = selectedOption.value
        const alreadyExists = selectedItems.find(item => item.tarefa_id === tarefaId)
        if (alreadyExists) {
            alert('Esta tarefa já está na lista de tarefas a fazer.')
            return
        }

        fetch('/api-tarefa-fazer/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({ tarefa_id: tarefaId, data: dataSelecionada }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    selectedItems.push({
                        id: data.id,
                        tarefa_id: String(data.tarefa_id),
                        tarefa_nome: data.tarefa_nome,
                        descricao: data.descricao,
                        horas_estimadas: data.horas_estimadas,
                    })
                    renderCards(selectedItems)
                } else {
                    alert('Erro ao salvar: ' + (data.error || 'desconhecido'))
                }
            })
            .catch(() => alert('Erro de conexão ao salvar tarefa.'))
    })
})