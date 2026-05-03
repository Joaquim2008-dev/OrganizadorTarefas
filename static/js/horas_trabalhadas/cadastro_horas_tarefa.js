document.addEventListener('DOMContentLoaded', function () {
    const formRegistrar = document.getElementById('form-registrar-tempo');
    const msgRegistrar = document.getElementById('msg-registrar-tempo');
    const displayHorasTrabalhadas = document.querySelector('.detalhe-item:nth-child(4) span');

    if (formRegistrar) {
        formRegistrar.addEventListener('submit', (event) => {
            event.preventDefault();

            const horas = Math.max(0, parseInt(document.getElementById('input-horas').value, 10) || 0);
            const minutos = Math.max(0, parseInt(document.getElementById('input-minutos').value, 10) || 0);
            const totalMinutos = horas * 60 + minutos;

            if (totalMinutos === 0) {
                mostrarMsg('Informe ao menos 1 minuto.', false);
                return;
            }

            const tarefaId = document.body.dataset.tarefaId;

            fetch('/api-registrar-tempo-trabalhado/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ tarefa_id: tarefaId, minutos: totalMinutos }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        mostrarMsg('Tempo registrado com sucesso!', true);
                        document.getElementById('input-horas').value = 0;
                        document.getElementById('input-minutos').value = 0;

                        // Atualiza o display de horas trabalhadas automaticamente
                        if (displayHorasTrabalhadas && data.horas_trabalhadas !== undefined) {
                            displayHorasTrabalhadas.textContent = formatarMinutosParaString(data.horas_trabalhadas);
                        }
                    } else {
                        mostrarMsg('Falha: ' + (data.error || 'erro desconhecido'), false);
                    }
                })
                .catch(() => mostrarMsg('Erro de conexão.', false));
        });
    }

    function mostrarMsg(texto, sucesso) {
        if (!msgRegistrar) return;
        msgRegistrar.textContent = texto;
        msgRegistrar.style.color = sucesso ? 'green' : 'red';
        msgRegistrar.hidden = false;
        setTimeout(() => { msgRegistrar.hidden = true; }, 4000);
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }

    function formatarMinutosParaString(totalMinutos) {
        const h = Math.floor(totalMinutos / 60);
        const m = totalMinutos % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    }
});
