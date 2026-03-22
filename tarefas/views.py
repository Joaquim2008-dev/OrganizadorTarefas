import json
from decimal import Decimal
from datetime import datetime, date
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import Tarefa


def home(request):
    return render(request, 'index.html')


def tarefas(request):
    return render(request, 'tarefas.html')


def tarefa_especifica(request, data=None):
    # data via path param: /especifica/2026-03-21/
    datas = data or request.GET.get('data')
    data_obj = None
    if datas:
        parts = datas.split('-')
        if len(parts) == 3:
            try:
                data_obj = datetime(int(parts[0]), int(
                    parts[1]), int(parts[2])).date()
            except ValueError:
                data_obj = None

    tarefas_do_dia = []
    if data_obj:
        tarefas_do_dia = Tarefa.objects.filter(
            data=data_obj).order_by('prioridade', 'nome')

    context = {
        'data': data_obj,
        'datas': datas,
        'tarefas': tarefas_do_dia,
    }
    return render(request, 'tarefa_especific.html', context)


def horas_tarefa(request, tarefa_id):
    tarefa = get_object_or_404(Tarefa, id=tarefa_id)
    return render(request, 'horas_tarefa.html', {'tarefa': tarefa})


@require_POST
def deletar_tarefa(request, tarefa_id):
    tarefa = get_object_or_404(Tarefa, id=tarefa_id)
    tarefa.delete()
    return JsonResponse({'success': True})


@require_POST
def api_guardar_tempo_gasto(request):
    try:
        payload = json.loads(request.body)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

    tarefa_id = payload.get('tarefa_id')
    tempo_minutos = payload.get('tempo_minutos')

    if tarefa_id is None or tempo_minutos is None:
        return JsonResponse({'success': False, 'error': 'Dados incompletos'}, status=400)

    try:
        tarefa = get_object_or_404(Tarefa, id=tarefa_id)
        valor_adicional = Decimal(str(tempo_minutos))
        tarefa.horas_trabalhadas = tarefa.horas_trabalhadas + valor_adicional
        tarefa.save()
        return JsonResponse({'success': True, 'horas_trabalhadas': float(tarefa.horas_trabalhadas)})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def api_tarefas_por_data(request):
    data_str = request.GET.get('date')
    if not data_str:
        return JsonResponse({'success': False, 'error': 'Parametro date ausente'}, status=400)

    try:
        data_obj = datetime.strptime(data_str, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'success': False, 'error': 'Formato de data inválido'}, status=400)

    tarefas = list(Tarefa.objects.filter(data=data_obj).values(
        'id', 'nome', 'descricao', 'horas_estimadas', 'horas_trabalhadas'))
    return JsonResponse({'success': True, 'data': data_str, 'tarefas': tarefas})


def adicionar_tarefa(request, data=None):

    data_valida = None
    if data:
        parts = data.split('-')
        if len(parts) == 3:
            try:
                data_valida = datetime(int(parts[0]), int(
                    parts[1]), int(parts[2])).date()
            except ValueError:
                data_valida = None

    if request.method == 'POST':
        nome = request.POST.get('nome', '').strip()
        descricao = request.POST.get('descricao', '').strip()
        prioridade = request.POST.get('prioridade', 'ME')
        horas_estimadas = request.POST.get('horas_estimadas', '0')
        data_form = request.POST.get('data', '')

        try:
            horas_estimadas = float(horas_estimadas)
        except ValueError:
            horas_estimadas = 0

        data_obj = data_valida
        if data_form:
            try:
                data_obj = datetime.strptime(data_form, '%Y-%m-%d').date()
            except ValueError:
                data_obj = data_valida

        # Converter horas estimadas para minutos antes de salvar
        nova_tarefa = Tarefa.objects.create(
            nome=nome,
            descricao=descricao,
            prioridade=prioridade,
            horas_estimadas=horas_estimadas * 60,
            horas_trabalhadas=0,
            data=data_obj or date.today()
        )

        data_redirect = (data_obj or date.today()).isoformat()
        return redirect(reverse('tarefa_especifica', args=[data_redirect]))

    context = {
        'data': data_valida.isoformat() if data_valida else '',
    }
    return render(request, 'adicionar_tarefa.html', context)
