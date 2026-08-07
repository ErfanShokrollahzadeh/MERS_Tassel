"""
WSGI config for MERS Tassel project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mers_tassel.settings')
application = get_wsgi_application()
