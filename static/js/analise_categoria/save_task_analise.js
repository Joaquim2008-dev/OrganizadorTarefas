document.addEventListener('DOMContentLoaded', () => {
    const createTaskForm = document.getElementById('createTaskForm');
    const modal = document.getElementById('taskModal');
    const categorySelect = document.getElementById('cat_id');

    if (createTaskForm) {
        createTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(createTaskForm);
            const url = createTaskForm.getAttribute('action');

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success') {
                        // Fecha o modal
                        modal.style.display = 'none';
                        createTaskForm.reset();

                        // Se estivermos filtrando por uma categoria e a tarefa for dessa categoria (ou se for "nenhuma")
                        // vamos recarregar a lista para mostrar a nova tarefa
                        if (categorySelect) {
                            categorySelect.dispatchEvent(new Event('change'));
                        }
                    } else {
                        alert('Erro ao salvar tarefa: ' + (data.message || 'Erro desconhecido'));
                    }
                } else {
                    alert('Erro na requisição.');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao tentar salvar a tarefa.');
            }
        });
    }

    // Botão Cancelar dentro do modal
    const cancelBtn = document.querySelector('.btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            createTaskForm.reset();
        });
    }
});
