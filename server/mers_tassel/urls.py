"""
URL configuration for MERS Tassel project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health(_request):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('health/', health, name='health'),
    path('admin/', admin.site.urls),
    path('api/products/', include('products.urls')),
    path('api/contact/', include('contact.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/v1/catalog/', include('products.urls')),
    path('api/v1/products/', include('products.urls')),
    path('api/v1/commerce/', include('commerce.urls')),
    path('api/v1/support/', include('support.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
