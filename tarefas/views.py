import json
import calendar as cal_module
from decimal import Decimal
from datetime import datetime, date
from django.db import IntegrityError
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import Tarefa, DiaTarefa, EntradaPlanejador


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

    # carregar todas as tarefas para o modal de busca
    todas_tarefas = Tarefa.objects.all().order_by('nome')
    tarefas_dia_tarefa = DiaTarefa.objects.all().order_by('data')

    context = {
        'data': data_obj,
        'datas': datas,
        'dia_tarefas': tarefas_do_dia,
        'horarios': range(5, 12),
        'tarefas': todas_tarefas,
        'dia_tarefas': tarefas_dia_tarefa
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
        try:
            valor_adicional = int(round(float(tempo_minutos)))
        except (TypeError, ValueError):
            return JsonResponse({'success': False, 'error': 'tempo_minutos inválido'}, status=400)

        tarefa.horas_trabalhadas = tarefa.horas_trabalhadas + valor_adicional
        tarefa.save()
        return JsonResponse({'success': True, 'horas_trabalhadas': tarefa.horas_trabalhadas})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def api_tarefas_por_mes(request):
    mes_str = request.GET.get('mes')
    if not mes_str:
        return JsonResponse({'success': False, 'error': 'Parâmetro mes ausente'}, status=400)

    try:
        ano, mes = map(int, mes_str.split('-'))
        date(ano, mes, 1)
    except (ValueError, TypeError):
        return JsonResponse({'success': False, 'error': 'Formato de mes inválido'}, status=400)

    tarefas = list(Tarefa.objects.filter(data__year=ano, data__month=mes).values(
        'id', 'nome', 'descricao', 'prioridade', 'horas_estimadas', 'horas_trabalhadas', 'data'))
    return JsonResponse({'success': True, 'mes': mes_str, 'tarefas': tarefas})


@require_POST
def api_dia_tarefa(request):
    try:
        payload = json.loads(request.body)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

    tarefa_id = payload.get('tarefa_id')
    data_str = payload.get('data')

    if not tarefa_id or not data_str:
        return JsonResponse({'success': False, 'error': 'Dados incompletos'}, status=400)

    hora_cronograma = payload.get('hora') or ''

    try:
        tarefa = get_object_or_404(Tarefa, id=tarefa_id)
        data_obj = datetime.strptime(data_str, '%Y-%m-%d').date()

        dia_tarefa, created = DiaTarefa.objects.get_or_create(
            tarefa=tarefa,
            data=data_obj,
            hora_cronograma=hora_cronograma
        )

        dia_tarefa_data = {
            'id': dia_tarefa.id,
            'tarefa_id': dia_tarefa.tarefa.id,
            'data': dia_tarefa.data.isoformat(),
            'hora_cronograma': dia_tarefa.hora_cronograma,
        }

        return JsonResponse({'success': True, 'created': created,
                             'dia_tarefa_id': dia_tarefa.id,
                             'tarefa_id': tarefa.id,
                             'dia_tarefa': dia_tarefa_data,
                             'data': data_str})
    except ValueError:
        return JsonResponse({'success': False, 'error': 'Data inválida'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def api_deletar_dia_tarefa(request):
    try:
        payload = json.loads(request.body)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

    dia_tarefa_id = payload.get('dia_tarefa_id')
    nome_tarefa = payload.get('nome_tarefa')
    data_str = payload.get('data')
    hora_cronograma = payload.get('hora')

    if not (nome_tarefa and data_str and hora_cronograma):
        return JsonResponse({'success': False, 'error': 'Parâmetros insuficientes para deletar dia_tarefa'}, status=400)

    dia_tarefa = None
    try:
        try:
            data_obj = datetime.strptime(data_str, '%Y-%m-%d').date()
        except Exception:
            return JsonResponse({'success': False, 'error': 'Data inválida para filtro'}, status=400)

        dia_tarefa = DiaTarefa.objects.filter(
            tarefa__nome=nome_tarefa,
            data=data_obj,
            hora_cronograma=hora_cronograma
        ).first()

        if not dia_tarefa:
          return JsonResponse({'success': False, 'error': 'No DiaTarefa matches the given query.'}, status=404)

        dia_tarefa.delete()
        return JsonResponse({'success': True})
    except Exception as e:
       return JsonResponse({'success': False, 'error': str(e)}, status=500)


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
        horas_estimadas_horas = request.POST.get(
            'horas_estimadas_horas', '').strip()
        horas_estimadas_minutos = request.POST.get(
            'horas_estimadas_minutos', '').strip()
        data_form = request.POST.get('data', '')

        minutos_estimados = 0
        if horas_estimadas_horas != '' or horas_estimadas_minutos != '':
            try:
                horas = int(
                    horas_estimadas_horas) if horas_estimadas_horas != '' else 0
            except ValueError:
                horas = 0
            try:
                minutos = int(
                    horas_estimadas_minutos) if horas_estimadas_minutos != '' else 0
            except ValueError:
                minutos = 0

            horas = max(0, horas)
            minutos = max(0, minutos)
            horas += minutos // 60
            minutos = minutos % 60
            minutos_estimados = horas * 60 + minutos
        else:
            # compatibilidade com campo antigo (horas como decimal)
            horas_estimadas = request.POST.get('horas_estimadas', '0')
            try:
                horas_estimadas_float = float(horas_estimadas)
            except ValueError:
                horas_estimadas_float = 0.0
            minutos_estimados = max(0, int(round(horas_estimadas_float * 60)))

        data_obj = data_valida
        if data_form:
            try:
                data_obj = datetime.strptime(data_form, '%Y-%m-%d').date()
            except ValueError:
                data_obj = data_valida

        nova_tarefa = Tarefa.objects.create(
            nome=nome,
            descricao=descricao,
            prioridade=prioridade,
            horas_estimadas=minutos_estimados,
            horas_trabalhadas=0,
            data=data_obj or date.today()
        )
        return redirect('tarefas')

    context = {
        'data': data_valida.isoformat() if data_valida else '',
    }
    return render(request, 'adicionar_tarefa.html', context)
