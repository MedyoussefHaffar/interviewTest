from django.urls import path
from . import views

urlpatterns = [
    path('patients', views.patient_list, name='patient-list'),
    path('patients/<str:patient_id>', views.patient_detail, name='patient-detail'),
    path('patients/<str:patient_id>/process', views.process_patient, name='process-patient'),
    path('patients/<str:patient_id>/delete', views.delete_patient, name='delete-patient'),
    path('patients/stats', views.local_patients_stats, name='patient-stats'),
    path('patients/<str:patient_id>/copy', views.copy_external_patient, name='copy-patient'),

]