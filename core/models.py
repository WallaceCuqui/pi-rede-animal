from django.db import models


class Ad(models.Model):
    class Status(models.TextChoices):
        LOST = 'perdido', 'Perdido'
        SEEN = 'visto', 'Visto/Encontrado'

    status = models.CharField(max_length=10, choices=Status.choices)
    animal_name = models.CharField(max_length=120, blank=True)
    location = models.CharField(max_length=200)
    image = models.ImageField(upload_to='publicacoes/%Y/%m/', verbose_name='Foto do Animal')
    legacy_image_url = models.URLField(max_length=500, blank=True)
    responsible_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.animal_name or self.get_status_display()
