from django.urls import path
from . import views

urlpatterns = [
    path('', views.tarefas, name='tarefas'),
    path('especifica/<str:data>/', views.tarefa_especifica,
         name='tarefa_especifica'),
    path('adicionar/', views.adicionar_tarefa, name='adicionar_tarefa'),
    path('adicionar/<str:data>/', views.adicionar_tarefa,
         name='adicionar_tarefa_com_data'),
    path('horas/<int:tarefa_id>/', views.horas_tarefa, name='horas_tarefa'),
    path('deletar/<int:tarefa_id>/', views.deletar_tarefa, name='deletar_tarefa'),
    path('api-guadar-tempo-gasto/', views.api_guardar_tempo_gasto,
         name='api-guadar-tempo-gasto'),
    path('api-tarefas-por-mes/', views.api_tarefas_por_mes,
         name='api-tarefas-por-mes'),
    path('api-dia-tarefa/', views.api_dia_tarefa, name='api-dia-tarefa'),
    path('api-deletar-dia-tarefa/', views.api_deletar_dia_tarefa,
         name='api-deletar-dia-tarefa'),

]
