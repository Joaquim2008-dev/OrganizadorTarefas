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
    horas_estimadas = models.DecimalField(
        max_digits=6, decimal_places=2, default=0)
    horas_trabalhadas = models.DecimalField(
        max_digits=6, decimal_places=2, default=0)
    data = models.DateField()

    def __str__(self):
        return f"{self.nome} ({self.get_prioridade_display()})"


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
