async function addSubtarefa() {
    const input = document.getElementById('subtarefa-nome');
    const nome = input.value.trim();
    const tarefaId = document.body.dataset.tarefaId;

    if (!nome) return;

    try {
        const response = await fetch('/api/subtarefa/add/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                tarefa_id: tarefaId,
                nome: nome
            })
        });
        const data = await response.json();
        if (data.success) {
            input.value = '';
            loadSubtarefas();
        }
    } catch (error) {
        console.error('Erro ao adicionar subtarefa:', error);
    }
}

async function loadSubtarefas() {
    const tarefaId = document.body.dataset.tarefaId;
    const container = document.getElementById('subtarefas-list');

    try {
        const response = await fetch(`/api/subtarefa/list/${tarefaId}/`);
        const data = await response.json();

        if (data.success) {
            container.innerHTML = data.subtarefas.map(sub => `
                <div class="subtarefa-item" data-id="${sub.id}">
                    <span class="sub-nome">${sub.nome}</span>
                    <div class="sub-tempo-input">
                        <input type="number" class="sub-h" placeholder="h" min="0" value="${Math.floor(sub.tempo_trabalhado / 60)}">
                        <span>h</span>
                        <input type="number" class="sub-m" placeholder="m" min="0" max="59" value="${sub.tempo_trabalhado % 60}">
                        <span>m</span>
                        <button onclick="updateSubTempo(${sub.id})" class="btn-sub-save" title="Salvar tempo">Salvar</button>
                        <button onclick="deleteSubtarefa(${sub.id})" class="btn-sub-del" title="Excluir subtarefa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar subtarefas:', error);
    }
}

async function updateSubTempo(subId) {
    const item = document.querySelector(`.subtarefa-item[data-id="${subId}"]`);
    const horas = parseInt(item.querySelector('.sub-h').value) || 0;
    const minutos = parseInt(item.querySelector('.sub-m').value) || 0;
    const tempoTotal = (horas * 60) + minutos;

    try {
        const response = await fetch('/api/subtarefa/update_tempo/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                subtarefa_id: subId,
                tempo_minutos: tempoTotal
            })
        });
        const data = await response.json();
        if (data.success) {
            alert('Tempo atualizado!');
            // Atualizar o display de horas trabalhadas da tarefa pai na tela
            const displayTotal = document.getElementById('horas-trabalhadas-display');
            if (displayTotal && data.nova_hora_total) {
                displayTotal.textContent = data.nova_hora_total;
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar tempo:', error);
    }
}

async function deleteSubtarefa(subId) {
    if (!confirm('Tem certeza que deseja excluir esta subtarefa?')) return;

    try {
        const response = await fetch('/api/subtarefa/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                subtarefa_id: subId
            })
        });
        const data = await response.json();
        if (data.success) {
            // Atualizar o display de horas trabalhadas da tarefa pai na tela
            const displayTotal = document.getElementById('horas-trabalhadas-display');
            if (displayTotal && data.nova_hora_total) {
                displayTotal.textContent = data.nova_hora_total;
            }
            loadSubtarefas();
        } else {
            alert('Erro ao excluir: ' + data.error);
        }
    } catch (error) {
        console.error('Erro ao excluir subtarefa:', error);
    }
}

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

document.addEventListener('DOMContentLoaded', loadSubtarefas);
