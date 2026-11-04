from django.urls import path
import core.views

urlpatterns = [
    path('', core.views.index, name='index'),
    path('publicacoes/criar/', core.views.create_ad, name='create_ad'),
    path('limpar/', core.views.clear_db, name='clear_db'),
]