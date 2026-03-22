from django.urls import path
from . import views

urlpatterns = [
    path('', views.tarefas, name='tarefas'),
    path('especifica/<str:data>/', views.tarefa_especifica,
         name='tarefa_especifica'),
    path('adicionar/<str:data>/', views.adicionar_tarefa, name='adicionar_tarefa'),
    path('horas/<int:tarefa_id>/', views.horas_tarefa, name='horas_tarefa'),
    path('deletar/<int:tarefa_id>/', views.deletar_tarefa, name='deletar_tarefa'),
    path('api-guadar-tempo-gasto/', views.api_guardar_tempo_gasto,
         name='api-guadar-tempo-gasto'),
    path('api-tarefas-por-data/', views.api_tarefas_por_data,
         name='api-tarefas-por-data'),
]
