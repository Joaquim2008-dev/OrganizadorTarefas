from django.db import models


class Tarefa(models.Model):
    PRIORIDADE_CHOICES = [
        ('BA', 'Baixa'),
        ('ME', 'Média'),
        ('AL', 'Alta'),
    ]

    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True)
    prioridade = models.CharField(
        max_length=2, choices=PRIORIDADE_CHOICES, default='ME')
    horas_estimadas = models.PositiveIntegerField(
        default=0, help_text='Minutos estimados')
    horas_trabalhadas = models.PositiveIntegerField(
        default=0, help_text='Minutos trabalhados')
    data = models.DateField()

    @property
    def horas_estimadas_formatadas(self):
        horas = self.horas_estimadas // 60
        minutos = self.horas_estimadas % 60
        if horas > 0 and minutos > 0:
            return f"{horas}h {minutos}m"
        if horas > 0:
            return f"{horas}h"
        return f"{minutos}m"

    @property
    def horas_trabalhadas_formatadas(self):
        horas = self.horas_trabalhadas // 60
        minutos = self.horas_trabalhadas % 60
        if horas > 0 and minutos > 0:
            return f"{horas}h {minutos}m"
        if horas > 0:
            return f"{horas}h"
        return f"{minutos}m"

    def __str__(self):
        return f"{self.nome} ({self.get_prioridade_display()})"


class DiaTarefa(models.Model):
    tarefa = models.ForeignKey(
        Tarefa, on_delete=models.CASCADE, related_name='dia_tarefas')
    data = models.DateField()
    hora_cronograma = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        unique_together = ('tarefa', 'data', 'hora_cronograma')
        ordering = ['data', 'tarefa__nome']

    def __str__(self):
        return f"{self.data} – {self.tarefa.nome}"


class EntradaPlanejador(models.Model):
    PERIODO_CHOICES = [
        ('manha', 'Manhã'),
        ('tarde', 'Tarde'),
        ('noite', 'Noite'),
    ]
    tarefa = models.ForeignKey(
        Tarefa, on_delete=models.CASCADE, related_name='entradas_planejador')
    # 0=Seg, 1=Ter, 2=Qua, 3=Qui, 4=Sex, 5=Sáb, 6=Dom
    dia_semana = models.IntegerField()
    periodo = models.CharField(max_length=10, choices=PERIODO_CHOICES)
    # hora inicial do slot, ex: 5 = 5h–6h
    hora = models.IntegerField(default=0)

    class Meta:
        unique_together = ('tarefa', 'dia_semana', 'periodo', 'hora')

    def __str__(self):
        dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
        return f"{dias[self.dia_semana]} {self.periodo} {self.hora}h — {self.tarefa.nome}"
