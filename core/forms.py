from django import forms

from .models import Ad


class AdForm(forms.ModelForm):
    image = forms.ImageField(required=True)

    class Meta:
        model = Ad
        fields = [
            'status',
            'animal_name',
            'location',
            'image',
            'responsible_name',
            'phone',
        ]

    def clean_image(self):
        image = self.cleaned_data['image']
        if image.size > 5 * 1024 * 1024:
            raise forms.ValidationError('A imagem deve ter no máximo 5 MB.')
        return image
