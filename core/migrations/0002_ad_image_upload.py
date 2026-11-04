from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='ad',
            old_name='image_url',
            new_name='legacy_image_url',
        ),
        migrations.AlterField(
            model_name='ad',
            name='legacy_image_url',
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name='ad',
            name='image',
            field=models.ImageField(blank=True, upload_to='ads/%Y/%m/'),
        ),
    ]
