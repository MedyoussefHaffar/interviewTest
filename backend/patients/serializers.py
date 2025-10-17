from rest_framework import serializers
from datetime import datetime
from .models import Patient
from dateutil import parser
import re


class MeasurementSerializer(serializers.Serializer):
    value = serializers.FloatField(required=True)
    unit = serializers.CharField(required=True, max_length=10)

class ProcessPatientSerializer(serializers.Serializer):
    weight = MeasurementSerializer(required=True)
    height = MeasurementSerializer(required=True)

class CreatePatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['first_name', 'last_name', 'dob', 'sex', 'ethnic_background']
    
    def validate_dob(self, value):
        """Validate and parse various datetime formats"""
        if not value:
            raise serializers.ValidationError("Date of birth is required")
        
        try:
            # Handle different datetime formats
            if isinstance(value, str):
                # Clean the string
                value = value.strip()
                
                # Handle ISO format with 'Z' timezone
                if value.endswith('Z'):
                    parsed_dob = datetime.fromisoformat(value.replace('Z', '+00:00'))
                else:
                    # Use dateutil.parser for more flexible parsing
                    parsed_dob = parser.parse(value)
            elif isinstance(value, datetime):
                parsed_dob = value
            else:
                raise serializers.ValidationError("Invalid date format")
            
            # Validate it's not in the future
            if parsed_dob > datetime.now().replace(tzinfo=parsed_dob.tzinfo):
                raise serializers.ValidationError("Date of birth cannot be in the future")
            
            # Return the original value for API call, we'll handle conversion in service
            return value
            
        except (ValueError, TypeError, parser.ParserError) as e:
            raise serializers.ValidationError(
                f"Invalid date format. Use ISO format like: 1990-05-15T00:00:00.000Z. Error: {str(e)}"
            )
    
    def validate_first_name(self, value):
        """Validate first name contains only letters and spaces"""
        if not value:
            raise serializers.ValidationError("First name is required")
        
        value = value.strip()
        if not value.replace(' ', '').isalpha():
            raise serializers.ValidationError("First name can only contain letters and spaces")
        return value
    
    def validate_last_name(self, value):
        """Validate last name contains only letters and spaces"""
        if not value:
            raise serializers.ValidationError("Last name is required")
        
        value = value.strip()
        if not value.replace(' ', '').isalpha():
            raise serializers.ValidationError("Last name can only contain letters and spaces")
        return value
class PatientSerializer(serializers.ModelSerializer):
    source = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = ['id', 'third_party_id', 'first_name', 'last_name', 'dob', 'sex', 'ethnic_background', 'source']
    
    def get_source(self, obj):
        return 'local' if not obj.third_party_id else 'third_party'