from django.urls import path
from . import views

urlpatterns = [
    path('', views.tarefas, name='tarefas'),
    path('planejador/', views.planejador, name='planejador'),
    path('especifica/<str:data>/', views.tarefa_especifica,
         name='tarefa_especifica'),
    path('adicionar/<str:data>/', views.adicionar_tarefa, name='adicionar_tarefa'),
    path('horas/<int:tarefa_id>/', views.horas_tarefa, name='horas_tarefa'),
    path('deletar/<int:tarefa_id>/', views.deletar_tarefa, name='deletar_tarefa'),
    path('api-guadar-tempo-gasto/', views.api_guardar_tempo_gasto,
         name='api-guadar-tempo-gasto'),
    path('api-tarefas-por-data/', views.api_tarefas_por_data,
         name='api-tarefas-por-data'),
    path('api-dias-semana-no-mes/', views.api_dias_semana_no_mes,
         name='api-dias-semana-no-mes'),
    path('api-entradas-planejador/', views.api_entradas_planejador,
         name='api-entradas-planejador'),
    path('api-adicionar-entrada-planejador/', views.api_adicionar_entrada_planejador,
         name='api-adicionar-entrada-planejador'),
    path('api-remover-entrada-planejador/', views.api_remover_entrada_planejador,
         name='api-remover-entrada-planejador'),
]
