from django.urls import path
from .views import *


urlpatterns = [
    path('login/', AdminLoginView.as_view(), name='admin_login'),
    path('csrf/', get_csrf_token, name='get-csrf-token'),

]
