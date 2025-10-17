import requests
import json
from django.core.cache import cache
from django.conf import settings
import time
from urllib.parse import urlencode
from datetime import datetime
from .models import Patient
from dateutil import parser


class PatientAPIClient:
    def __init__(self):
        self.base_url = settings.EXTERNAL_API_URL
        self.session = requests.Session()
    
    def _make_get_request(self, endpoint, params=None):
        """Generic method to make GET API requests with query parameters"""
        url = f"{self.base_url}/{endpoint}"
        if params:
            query_string = urlencode(params)
            url = f"{url}?{query_string}"
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.json(), response.status_code
        except requests.exceptions.RequestException as e:
            return {"error": f"Failed to fetch data: {str(e)}"}, 500
    
    def _make_post_request(self, endpoint, data):
        """Generic method to make POST API requests"""
        url = f"{self.base_url}/{endpoint}"
        
        # Convert any datetime objects to ISO strings
        serializable_data = self._make_json_serializable(data)
        
        try:
            response = self.session.post(
                url, 
                json=serializable_data,
                timeout=30
            )
            response.raise_for_status()
            return response.json(), response.status_code
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                return {"error": f"Failed to create patient: {e.response.text}"}, e.response.status_code
            return {"error": f"Failed to create patient: {str(e)}"}, 500
    
    def _make_json_serializable(self, data):
        """Convert datetime objects to ISO format strings for JSON serialization"""
        if isinstance(data, dict):
            return {k: self._make_json_serializable(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._make_json_serializable(item) for item in data]
        elif isinstance(data, datetime):
            return data.isoformat()
        else:
            return data
    
    def get_combined_patients(self, page=None):
        """
        Get patients from both local database and third-party API
        Returns a unified list where all patients have consistent structure
        """
        try:
            # Get patients from local database
            local_patients = Patient.objects.all()
            local_patient_dicts = [patient.to_dict() for patient in local_patients]
            
            # Get patients from third-party API - ALWAYS pass a page number
            api_page = page if page is not None else 1
            third_party_data, status_code = self._make_get_request("patients", {'page': api_page})
            
            third_party_patients = []
            if status_code == 200 and "error" not in third_party_data:
                # Transform third-party patients to match our structure
                for tp_patient in third_party_data.get('patients', []):
                    # Check if this third-party patient exists in our local DB
                    local_match = None
                    for local_patient in local_patients:
                        if (local_patient.third_party_id and 
                            str(local_patient.third_party_id) == str(tp_patient.get('id'))):
                            local_match = local_patient
                            break
                    
                    if local_match:
                        # Skip - we'll use the local version which already has source='both'
                        continue
                    else:
                        # Get the external patient ID - ensure it's not None
                        external_id = tp_patient.get('id')
                        if external_id is None:
                            # If the external API doesn't provide an ID, create a fallback
                            # This shouldn't happen, but let's be safe
                            import uuid
                            external_id = f"ext_fallback_{uuid.uuid4().hex[:8]}"
                        
                        # Create a unified patient object for third-party only patients
                        unified_patient = {
                            'id': external_id,  # Use the external ID directly
                            'third_party_id': external_id,
                            'first_name': tp_patient.get('first_name', ''),
                            'last_name': tp_patient.get('last_name', ''),
                            'dob': tp_patient.get('dob', ''),
                            'sex': tp_patient.get('sex', ''),
                            'ethnic_background': tp_patient.get('ethnic_background', ''),
                            'source': 'third_party',
                            'can_delete': False,  # External patients can't be deleted
                            'created_at': None  # External patients don't have created_at
                        }
                        third_party_patients.append(unified_patient)
            
            # Mark local patients for delete capability and ensure source is correct
            for patient in local_patient_dicts:
                patient['can_delete'] = True
                # Ensure source is accurate - if third_party_id exists, it's 'both', else 'local'
                if patient.get('third_party_id'):
                    patient['source'] = 'both'
                else:
                    patient['source'] = 'local'
            
            # Combine the lists - local patients first, then external
            combined_patients = local_patient_dicts + third_party_patients
            
            return {
                "patients": combined_patients,
                "total": len(combined_patients),
                "page": third_party_data.get('page', 1) if third_party_data else 1,
                "per_page": third_party_data.get('per_page', len(combined_patients)) if third_party_data else len(combined_patients),
                "sources": {
                    "local_count": len(local_patient_dicts),
                    "third_party_count": len(third_party_patients),
                    "third_party_error": status_code != 200 or "error" in third_party_data
                }
            }, 200
            
        except Exception as e:
            return {"error": f"Failed to get combined patients: {str(e)}"}, 500
    def get_patient(self, patient_id):
        """
        Get patient by ID - try local database first, then third-party API
        """
        # Try to get from local database first (by UUID or third_party_id)
        try:
            # Check if it's a UUID (local patient)
            if len(patient_id) == 36:  # UUID length
                patient = Patient.objects.get(id=patient_id)
                return patient.to_dict(), 200
            else:
                # Try to find by third_party_id
                patient = Patient.objects.get(third_party_id=patient_id)
                return patient.to_dict(), 200
        except (Patient.DoesNotExist, ValueError):
            pass
        
        # If not found locally, try third-party API
        data, status_code = self._make_get_request(f"patients/{patient_id}")
        
        # If found in third-party API, create unified response
        if status_code == 200 and "error" not in data:
            unified_patient = {
                'id': data.get('id'),
                'third_party_id': data.get('id'),
                'first_name': data.get('first_name', ''),
                'last_name': data.get('last_name', ''),
                'dob': data.get('dob', ''),
                'sex': data.get('sex', ''),
                'ethnic_background': data.get('ethnic_background', ''),
                'source': 'third_party',
                'can_delete': False,
                'created_at': None
            }
            return unified_patient, 200
        
        return data, status_code
   
    def create_patient(self, patient_data):
            """
            Create a new patient in both local database and third-party API
            """
            # First, save to local database
            try:
                # Parse the dob string to datetime for local storage
                dob_value = patient_data['dob']
                if isinstance(dob_value, str):
                    if dob_value.endswith('Z'):
                        local_dob = datetime.fromisoformat(dob_value.replace('Z', '+00:00'))
                    else:
                        local_dob = parser.parse(dob_value)
                else:
                    local_dob = dob_value
                
                # Create local patient data
                local_patient_data = {
                    'first_name': patient_data['first_name'],
                    'last_name': patient_data['last_name'],
                    'dob': local_dob,
                    'sex': patient_data['sex'],
                    'ethnic_background': patient_data['ethnic_background']
                }
                
                local_patient = Patient.objects.create(**local_patient_data)
                
                # Prepare data for third-party API (ensure dob is string)
                third_party_data = patient_data.copy()
                if not isinstance(third_party_data['dob'], str):
                    third_party_data['dob'] = third_party_data['dob'].isoformat()
                
                # Try to create in third-party API
                third_party_response, status_code = self._make_post_request("patients", third_party_data)
                
                # If successful in third-party API, update local patient with third_party_id
                if status_code == 201 and 'id' in third_party_response:
                    local_patient.third_party_id = third_party_response['id']
                    local_patient.save()
                    
                    # Update the response to include our local ID
                    third_party_response['local_id'] = str(local_patient.id)
                    third_party_response['source'] = 'both'
                    
                    return third_party_response, 201
                else:
                    # Third-party API failed, but we have local copy
                    response_data = local_patient.to_dict()
                    response_data['third_party_sync'] = False
                    response_data['third_party_error'] = third_party_response.get('error', 'Unknown error')
                    return response_data, 201
                    
            except Exception as e:
                return {"error": f"Failed to create patient locally: {str(e)}"}, 500    

    def process_patient(self, patient_id, process_data):
            """Process patient with caching and rate limiting"""
            cache_key = f"patient_process_{patient_id}_{hash(json.dumps(process_data, sort_keys=True))}"
            
            # Check cache first
            cached_result = cache.get(cache_key)
            if cached_result:
                return cached_result, 200
            
            # Rate limiting check
            recent_calls = cache.get('process_calls', [])
            current_time = time.time()
            
            # Remove calls older than 1 minute
            recent_calls = [t for t in recent_calls if current_time - t < 60]
            
            # Check if we're over the limit
            if len(recent_calls) >= settings.RATE_LIMIT_PER_MINUTE:
                return {"error": "Rate limit exceeded. Please try again later."}, 429
            
            # Make the external API call with the process data
            result, status_code = self._make_post_request(f"patients/{patient_id}/process", process_data)
            
            # Cache successful results
            if status_code == 200 and "error" not in result:
                cache.set(cache_key, result, settings.CACHE_TIMEOUT)
                # Update rate limit tracking
                recent_calls.append(current_time)
                cache.set('process_calls', recent_calls, 60)
            
            return result, status_code
        
    def _invalidate_patients_cache(self):
            """Invalidate cache when patients are updated"""
            pass

    def delete_patient(self, patient_id):
        """
        Delete a patient from local database
        Only local patients can be deleted (those with source 'local' or 'both')
        """
        try:
            # Try to delete from local database by UUID
            patient = Patient.objects.get(id=patient_id)
            patient.delete()
            
            return {"success": True, "message": "Patient deleted successfully"}, 200
            
        except Patient.DoesNotExist:
            return {"error": "Patient not found in local database"}, 404
        except Exception as e:
            return {"error": f"Failed to delete patient: {str(e)}"}, 500
    # Create a singleton instance
    def copy_external_patient(self, external_patient_id):
        """
        Create a local copy of an external patient
        """
        try:
            # Get the external patient data
            external_patient_data, status_code = self._make_get_request(f"patients/{external_patient_id}")
            
            if status_code != 200 or "error" in external_patient_data:
                return {"error": "Failed to fetch external patient data"}, 400
            
            # Check if this external patient already exists locally
            existing_patient = Patient.objects.filter(third_party_id=external_patient_id).first()
            if existing_patient:
                return {"error": "This external patient already exists in local database"}, 400
            
            # Create local patient with the external data
            local_patient_data = {
                'first_name': external_patient_data.get('first_name', ''),
                'last_name': external_patient_data.get('last_name', ''),
                'dob': external_patient_data.get('dob', ''),
                'sex': external_patient_data.get('sex', ''),
                'ethnic_background': external_patient_data.get('ethnic_background', ''),
                'third_party_id': external_patient_id  # Link to the external patient
            }
            
            # Parse the date string to datetime for local storage
            if local_patient_data['dob']:
                try:
                    if local_patient_data['dob'].endswith('Z'):
                        local_patient_data['dob'] = datetime.fromisoformat(local_patient_data['dob'].replace('Z', '+00:00'))
                    else:
                        local_patient_data['dob'] = parser.parse(local_patient_data['dob'])
                except (ValueError, TypeError, parser.ParserError) as e:
                    return {"error": f"Invalid date format in external patient data: {str(e)}"}, 400
            
            # Create the local patient
            local_patient = Patient.objects.create(**local_patient_data)
            
            return local_patient.to_dict(), 201
            
        except Exception as e:
            return {"error": f"Failed to create local copy: {str(e)}"}, 500

api_client = PatientAPIClient()