document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('taskModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.btn-cancel');

    function openModal() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevenir scroll no fundo
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    if (openBtn) {
        openBtn.addEventListener('click', openModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    // Fechar ao clicar fora do modal
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // O backend já trata a soma de horas e minutos em view.adicionar_tarefa
    const form = document.getElementById('createTaskForm');
    form.addEventListener('submit', function () {
        // O formulário será enviado via POST normal para a view existente
        console.log("Enviando tarefa...");
    });
});
