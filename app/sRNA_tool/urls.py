from django.urls import path
from . import views

urlpatterns = [
    path('', views.index),
    path('HCL', views.HCL),
    path('list/<str:list>', views.list),
    path('HCL_list/<str:list>', views.HCL_list),
    path('id/<str:id>/<str:type>/<str:tool>', views.job_id),
]