import json
import calendar as cal_module
from decimal import Decimal
from datetime import datetime, date
from django.db import IntegrityError
from django.db.models import Sum
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import Tarefa, DiaTarefa, EntradaPlanejador, TarefaFazer, CategoriaTarefa, TarefaHistorico
from django.core.paginator import Paginator


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
    todas_tarefas = Tarefa.objects.select_related(
        'categoria').all().order_by('nome')
    tarefas_dia_tarefa = DiaTarefa.objects.all().order_by('data')
    categorias = CategoriaTarefa.objects.all()

    context = {
        'data': data_obj,
        'datas': datas,
        'dia_tarefas': tarefas_do_dia,
        'horarios': range(5, 23),
        'tarefas': todas_tarefas,
        'dia_tarefas': tarefas_dia_tarefa,
        'categorias': categorias,
    }
    return render(request, 'tarefa_especific.html', context)


def horas_tarefa(request, tarefa_id):
    tarefa = get_object_or_404(Tarefa, id=tarefa_id)
    data_cronograma = request.GET.get('data', '') or str(tarefa.data)
    return render(request, 'horas_tarefa.html', {'tarefa': tarefa, 'data_cronograma': data_cronograma})


@require_POST
def deletar_tarefa(request, tarefa_id):
    tarefa = get_object_or_404(Tarefa, id=tarefa_id)
    if tarefa.horas_trabalhadas > 0:
        TarefaHistorico.objects.create(
            nome=tarefa.nome,
            descricao=tarefa.descricao,
            prioridade=tarefa.prioridade,
            horas_estimadas=tarefa.horas_estimadas,
            horas_trabalhadas=tarefa.horas_trabalhadas,
            data_tarefa=tarefa.data,
            categoria_nome=tarefa.categoria.nome if tarefa.categoria else '',
        )
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


@require_POST
def api_registrar_tempo_trabalhado(request):
    try:
        payload = json.loads(request.body)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

    tarefa_id = payload.get('tarefa_id')
    minutos = payload.get('minutos')

    if tarefa_id is None or minutos is None:
        return JsonResponse({'success': False, 'error': 'Dados incompletos'}, status=400)

    try:
        minutos_int = int(minutos)
        if minutos_int <= 0:
            return JsonResponse({'success': False, 'error': 'Minutos devem ser maiores que zero'}, status=400)
    except (TypeError, ValueError):
        return JsonResponse({'success': False, 'error': 'minutos inválido'}, status=400)

    try:
        tarefa = get_object_or_404(Tarefa, id=tarefa_id)
        tarefa.horas_trabalhadas += minutos_int
        tarefa.save()
        return JsonResponse({'success': True, 'horas_trabalhadas': tarefa.horas_trabalhadas})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def api_excluir_tarefa_banco(request):
    try:
        payload = json.loads(request.body)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

    tarefa_id = payload.get('tarefa_id')

    if not tarefa_id:
        return JsonResponse({'success': False, 'error': 'tarefa_id não informado'}, status=400)

    try:
        tarefa = get_object_or_404(Tarefa, id=tarefa_id)
        if tarefa.horas_trabalhadas > 0:
            TarefaHistorico.objects.create(
                nome=tarefa.nome,
                descricao=tarefa.descricao,
                prioridade=tarefa.prioridade,
                horas_estimadas=tarefa.horas_estimadas,
                horas_trabalhadas=tarefa.horas_trabalhadas,
                data_tarefa=tarefa.data,
                categoria_nome=tarefa.categoria.nome if tarefa.categoria else '',
            )
        tarefa.delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def api_tarefa_fazer(request):
    try:
        payload = json.loads(request.body)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

    tarefa_id = payload.get('tarefa_id')
    data_str = payload.get('data')

    if not tarefa_id or not data_str:
        return JsonResponse({'success': False, 'error': 'Dados incompletos'}, status=400)

    try:
        tarefa = get_object_or_404(Tarefa, id=tarefa_id)
        data_obj = datetime.strptime(data_str, '%Y-%m-%d').date()
        obj, created = TarefaFazer.objects.get_or_create(
            tarefa=tarefa, data=data_obj)
        return JsonResponse({
            'success': True,
            'created': created,
            'id': obj.id,
            'tarefa_id': tarefa.id,
            'tarefa_nome': tarefa.nome,
            'descricao': tarefa.descricao,
            'horas_estimadas': tarefa.horas_estimadas,
        })
    except ValueError:
        return JsonResponse({'success': False, 'error': 'Data inválida'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def api_tarefa_fazer_list(request):
    data_str = request.GET.get('data')
    if not data_str:
        return JsonResponse({'success': False, 'error': 'Parâmetro data ausente'}, status=400)
    try:
        data_obj = datetime.strptime(data_str, '%Y-%m-%d').date()
    except ValueError:
        return JsonResponse({'success': False, 'error': 'Data inválida'}, status=400)

    items = TarefaFazer.objects.filter(data=data_obj).select_related('tarefa')
    result = [{
        'id': item.id,
        'tarefa_id': item.tarefa.id,
        'tarefa_nome': item.tarefa.nome,
        'descricao': item.tarefa.descricao,
        'horas_estimadas': item.tarefa.horas_estimadas,
    } for item in items]
    return JsonResponse({'success': True, 'items': result})


@require_POST
def api_tarefa_fazer_delete(request):
    try:
        payload = json.loads(request.body)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

    item_id = payload.get('id')
    if not item_id:
        return JsonResponse({'success': False, 'error': 'id não informado'}, status=400)

    try:
        obj = get_object_or_404(TarefaFazer, id=item_id)
        obj.delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def api_editar_tarefa(request):
    try:
        payload = json.loads(request.body)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'JSON inválido'}, status=400)

    tarefa_id = payload.get('tarefa_id')
    if not tarefa_id:
        return JsonResponse({'success': False, 'error': 'tarefa_id não informado'}, status=400)

    try:
        tarefa = get_object_or_404(Tarefa, id=tarefa_id)
        tarefa.nome = payload.get('nome', tarefa.nome).strip()
        tarefa.descricao = payload.get('descricao', tarefa.descricao).strip()
        tarefa.prioridade = payload.get('prioridade', tarefa.prioridade)
        categoria_id = payload.get('categoria_id')
        tarefa.categoria_id = int(categoria_id) if categoria_id else None
        horas = int(payload.get('horas', 0) or 0)
        minutos = int(payload.get('minutos', 0) or 0)
        horas += minutos // 60
        minutos = minutos % 60
        tarefa.horas_estimadas = horas * 60 + minutos
        tarefa.save()
        return JsonResponse({
            'success': True,
            'nome': tarefa.nome,
            'descricao': tarefa.descricao,
            'prioridade': tarefa.prioridade,
            'prioridade_display': tarefa.get_prioridade_display(),
            'categoria_nome': tarefa.categoria.nome if tarefa.categoria else '',
            'horas_estimadas_formatadas': tarefa.horas_estimadas_formatadas,
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def api_tarefa_fazer_eventos(request):
    items = TarefaFazer.objects.select_related('tarefa').all()
    result = [
        {
            'title': item.tarefa.nome,
            'start': item.data.isoformat(),
            'allDay': True,
        }
        for item in items
    ]
    return JsonResponse({'success': True, 'events': result})


def relatorio_categorias(request):
    data_inicio = request.GET.get('data_inicio', '')
    data_fim = request.GET.get('data_fim', '')

    qs = TarefaHistorico.objects.all()
    if data_inicio:
        try:
            qs = qs.filter(data_exclusao__date__gte=datetime.strptime(
                data_inicio, '%Y-%m-%d').date())
        except ValueError:
            pass
    if data_fim:
        try:
            qs = qs.filter(data_exclusao__date__lte=datetime.strptime(
                data_fim, '%Y-%m-%d').date())
        except ValueError:
            pass

    dados = list(qs.values('categoria_nome').annotate(
        total_minutos=Sum('horas_trabalhadas')).order_by('categoria_nome'))
    labels = [item['categoria_nome'] or 'Sem categoria' for item in dados]
    valores = [item['total_minutos'] or 0 for item in dados]

    context = {
        'labels': json.dumps(labels),
        'valores': json.dumps(valores),
        'has_data': len(dados) > 0,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
    }
    return render(request, 'relatorio_categorias.html', context)


def relatorio_tarefas_categoria(request):
    categoria = request.GET.get('categoria', '')
    data_inicio = request.GET.get('data_inicio', '')
    data_fim = request.GET.get('data_fim', '')

    qs = TarefaHistorico.objects.filter(categoria_nome=categoria)
    if data_inicio:
        try:
            qs = qs.filter(data_exclusao__date__gte=datetime.strptime(
                data_inicio, '%Y-%m-%d').date())
        except ValueError:
            pass
    if data_fim:
        try:
            qs = qs.filter(data_exclusao__date__lte=datetime.strptime(
                data_fim, '%Y-%m-%d').date())
        except ValueError:
            pass

    dados = list(qs.values('nome').annotate(total_minutos=Sum(
        'horas_trabalhadas')).order_by('-total_minutos'))
    labels = [item['nome'] for item in dados]
    valores = [item['total_minutos'] or 0 for item in dados]

    context = {
        'categoria': categoria or 'Sem categoria',
        'labels': json.dumps(labels),
        'valores': json.dumps(valores),
        'has_data': len(dados) > 0,
        'data_inicio': data_inicio,
        'data_fim': data_fim,
    }
    return render(request, 'relatorio_tarefas.html', context)


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
            data=data_obj or date.today(),
            categoria_id=request.POST.get('categoria') or None
        )
        return redirect('adicionar_tarefa')

    categoria_filtro = request.GET.get('categoria', '')
    todas_tarefas = Tarefa.objects.select_related('categoria').order_by('-id')
    if categoria_filtro:
        todas_tarefas = todas_tarefas.filter(categoria_id=categoria_filtro)
    paginator = Paginator(todas_tarefas, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    categorias = CategoriaTarefa.objects.all()

    context = {
        'data': data_valida.isoformat() if data_valida else '',
        'page_obj': page_obj,
        'categorias': categorias,
        'categoria_filtro': categoria_filtro,
    }
    return render(request, 'adicionar_tarefa.html', context)
