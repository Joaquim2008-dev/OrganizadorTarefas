from django.contrib import admin
from .models import Tarefa, DiaTarefa, TarefaFazer, CategoriaTarefa

admin.site.register(Tarefa)
admin.site.register(DiaTarefa)
admin.site.register(TarefaFazer)
admin.site.register(CategoriaTarefa)
