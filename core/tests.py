from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.test.utils import override_settings
from django.urls import reverse
from PIL import Image

from .models import Ad


class AdViewTests(TestCase):
    def setUp(self):
        self.media_directory = TemporaryDirectory()
        self.media_override = override_settings(
            MEDIA_ROOT=self.media_directory.name,
        )
        self.media_override.enable()

    def tearDown(self):
        self.media_override.disable()
        self.media_directory.cleanup()

    @staticmethod
    def make_image_upload(name='animal.png'):
        image_file = BytesIO()
        Image.new('RGB', (1, 1), color='red').save(image_file, format='PNG')
        return SimpleUploadedFile(
            name,
            image_file.getvalue(),
            content_type='image/png',
        )

    def test_index_lists_saved_ads(self):
        ad = Ad.objects.create(
            status=Ad.Status.LOST,
            animal_name='BENTO',
            location='Curitiba/PR',
            legacy_image_url='https://example.com/bento.jpg',
            responsible_name='Ana',
            phone='(41) 99999-0000',
        )

        response = self.client.get(reverse('index'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'BENTO')
        self.assertContains(response, 'data-phone="(41) 99999-0000"')
        self.assertEqual(response.context['ads'][0]['id'], ad.id)

    @override_settings(GOOGLE_MAPS_API_KEY='maps-test-key')
    def test_index_loads_google_places_autocomplete_when_configured(self):
        response = self.client.get(reverse('index'))

        self.assertContains(response, 'maps-test-key')
        self.assertContains(response, 'libraries=places')
        self.assertContains(response, 'initLocationAutocomplete')

    @override_settings(GOOGLE_MAPS_API_KEY='')
    def test_index_keeps_location_field_without_maps_key(self):
        response = self.client.get(reverse('index'))

        self.assertContains(response, 'name="location"')
        self.assertNotContains(response, 'maps.googleapis.com/maps/api/js')

    def test_create_ad_persists_valid_submission(self):
        response = self.client.post(
            reverse('create_ad'),
            {
                'status': Ad.Status.SEEN,
                'animal_name': '  Luna  ',
                'location': 'Campinas/SP',
                'image': self.make_image_upload('luna.png'),
                'responsible_name': 'Maria',
                'phone': '(19) 97777-0000',
            },
        )

        self.assertRedirects(response, reverse('index'))
        self.assertEqual(Ad.objects.count(), 1)
        self.assertEqual(Ad.objects.get().animal_name, 'LUNA')
        self.assertTrue(Ad.objects.get().image.name.startswith('ads/'))

    def test_created_ad_is_rendered_after_submission(self):
        response = self.client.post(
            reverse('create_ad'),
            {
                'status': Ad.Status.LOST,
                'animal_name': 'Rex',
                'location': 'Curitiba/PR',
                'image': self.make_image_upload('rex.png'),
                'responsible_name': 'João',
                'phone': '(41) 99999-1111',
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'REX')
        self.assertContains(response, 'Curitiba/PR')
        self.assertContains(response, 'data-phone="(41) 99999-1111"')
        self.assertContains(response, '/media/ads/')

    def test_uploaded_image_is_served_from_media(self):
        self.client.post(
            reverse('create_ad'),
            {
                'status': Ad.Status.LOST,
                'animal_name': 'Rex',
                'location': 'Curitiba/PR',
                'image': self.make_image_upload('rex.png'),
                'responsible_name': 'João',
                'phone': '(41) 99999-1111',
            },
        )
        ad = Ad.objects.get()
        image_saved = Path(ad.image.path).is_file()

        self.assertTrue(image_saved)

    def test_create_ad_rejects_invalid_submission(self):
        response = self.client.post(
            reverse('create_ad'),
            {
                'status': 'inválido',
                'location': '',
                'image': SimpleUploadedFile(
                    'not-image.txt',
                    b'not an image',
                    content_type='image/jpeg',
                ),
                'responsible_name': '',
                'phone': '',
            },
        )

        self.assertRedirects(
            response,
            reverse('index'),
            fetch_redirect_response=False,
        )
        self.assertEqual(Ad.objects.count(), 0)
        self.assertContains(
            self.client.get(reverse('index')),
            'Não foi possível publicar o anúncio.',
        )

    def test_create_ad_only_accepts_post(self):
        response = self.client.get(reverse('create_ad'))

        self.assertEqual(response.status_code, 405)
