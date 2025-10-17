from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services import api_client
from .serializers import ProcessPatientSerializer, CreatePatientSerializer
from .models import Patient

@api_view(['GET', 'POST'])
def patient_list(request):
    """
    GET /patients - List all patients with pagination
    POST /patients - Create a new patient in both local DB and third-party API
    """
    if request.method == 'GET':
        # Get page parameter from query string, default to 1
        page = request.GET.get('page', '1')
        
        # Validate page parameter
        try:
            page = int(page)
            if page < 1:
                return Response(
                    {"error": "Page must be a positive integer"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"error": "Page must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Always pass page to the service (even if it's 1)
        data, status_code = api_client.get_combined_patients(page=page)
        return Response(data, status=status_code)
    
    elif request.method == 'POST':
        """
        Create a new patient in both local database and third-party API
        """
        serializer = CreatePatientSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid patient data", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the patient in both systems
        data, status_code = api_client.create_patient(serializer.validated_data)
        return Response(data, status=status_code)
    
@api_view(['GET'])
def patient_detail(request, patient_id):
    """GET /patients/{id} - Get patient details from local DB or third-party API"""
    data, status_code = api_client.get_patient(patient_id)
    return Response(data, status=status_code)

@api_view(['POST'])
def process_patient(request, patient_id):
    """POST /patients/{id}/process - Process patient data"""
    serializer = ProcessPatientSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {"error": "Invalid data", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Process the patient with validated data
    data, status_code = api_client.process_patient(patient_id, serializer.validated_data)
    return Response(data, status=status_code)

@api_view(['GET'])
def local_patients_stats(request):
    """GET /patients/stats - Get statistics about patients"""
    try:
        # Get combined patients data to calculate accurate stats
        data, status_code = api_client.get_combined_patients()
        
        if status_code != 200:
            return Response({"error": "Failed to load patient data"}, status=status_code)
        
        patients = data.get('patients', [])
        sources = data.get('sources', {})
        
        # Calculate stats from the combined data
        local_count = sources.get('local_count', 0)
        third_party_count = sources.get('third_party_count', 0)
        total_patients = len(patients)
        
        # Calculate local_only (patients that are only in local DB, not synced)
        local_only_count = sum(1 for p in patients if p.get('source') == 'local')
        synced_count = sum(1 for p in patients if p.get('source') == 'both')
        
        return Response({
            'total_patients': total_patients,
            'local_count': local_count,
            'third_party_count': third_party_count,
            'local_only_count': local_only_count,
            'synced_count': synced_count
        })
    except Exception as e:
        return Response({"error": f"Failed to get stats: {str(e)}"}, status=500)
    
@api_view(['DELETE'])
def delete_patient(request, patient_id):
    """
    DELETE /patients/{id} - Delete a local patient
    """
    data, status_code = api_client.delete_patient(patient_id)
    return Response(data, status=status_code)

@api_view(['POST'])
def copy_external_patient(request, patient_id):
    """
    POST /patients/{id}/copy - Create a local copy of an external patient
    """
    data, status_code = api_client.copy_external_patient(patient_id)
    return Response(data, status=status_code)