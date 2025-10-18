from django.urls import path
from . import views

urlpatterns = [
    # List and create patients
    path('patients', views.patient_list, name='patient-list'),
    
    # Copy external patient (must come before detail routes to avoid conflicts)
    path('patients/copy', views.copy_external_patient, name='copy-patient'),
    
    # Patient detail routes
    path('patients/<str:patient_id>', views.patient_detail, name='patient-detail'),
    path('patients/<str:patient_id>/process', views.process_patient, name='process-patient'),
    path('patients/<str:patient_id>/delete', views.delete_patient, name='delete-patient'),
]