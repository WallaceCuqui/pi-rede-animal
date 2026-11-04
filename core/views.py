from django.contrib import messages
from django.conf import settings
from django.http import HttpResponseNotAllowed
from django.shortcuts import redirect, render

from .forms import AdForm
from .models import Ad


def _render_index(request):
    ads = [
        {
            'id': ad.id,
            'status': ad.status,
            'animalName': ad.animal_name or (
                'Animal Encontrado (Sem identificação)'
                if ad.status == Ad.Status.SEEN
                else 'Desconhecido'
            ),
            'location': ad.location,
            'date': ad.created_at.strftime('%d/%m'),
            'imageUrl': ad.image.url if ad.image else ad.legacy_image_url,
            'phone': ad.phone,
        }
        for ad in Ad.objects.all()
    ]
    return render(request, 'index.html', {'ads': ads})


def index(request):
    return _render_index(request)


def create_ad(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    form = AdForm(request.POST, request.FILES)
    if form.is_valid():
        ad = form.save(commit=False)
        ad.animal_name = ad.animal_name.strip().upper()
        ad.save()
        messages.success(request, 'Cartaz publicado com sucesso!')
    else:
        errors = '; '.join(
            f'{field}: {", ".join(error_list)}'
            for field, error_list in form.errors.items()
        )
        messages.error(request, f'Não foi possível publicar o anúncio. {errors}')

    return redirect('index')

def clear_db(request):
    # Apaga todos os anúncios cadastrados no banco de dados
    Ad.objects.all().delete()
    messages.success(request, 'Banco de dados limpo com sucesso!')
    return redirect('index')