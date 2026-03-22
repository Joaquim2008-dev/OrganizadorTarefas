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
