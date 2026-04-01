// Main.js - Orquestra todos os módulos

document.addEventListener('DOMContentLoaded', function () {
    const addTask = document.querySelectorAll('#tarefa')
    const modal = document.querySelector('#tarefa-modal')
    const buscaInput = document.querySelector('#tarefa-busca')
    const listaResultados = document.querySelector('#resultado-tarefas')

    // Variable global para compartilhar entre módulos
    window.targetCell = null

    // Filtrar tarefas no modal
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

    // Listener para abrir modal ao clicar em célula vazia
    addTask.forEach(tarefa => {
        tarefa.addEventListener('click', function (event) {
            if (event.target.closest('.tarefa-item')) {
                return
            }

            window.targetCell = this
            modal.showModal()
            buscaInput.value = ''
            filtrarTarefas()
            buscaInput.focus()
        })
    })

    // Listener para fechar modal
    document.querySelector('#fechar-modal').addEventListener('click', () => modal.close())

    // Inicializar módulos
    ver_tasks()
    setupDeleteListener()
    setupSaveTarefaListener(listaResultados)
    setupTarefaMenuListener()
})
