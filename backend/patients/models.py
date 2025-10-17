from django.db import models
import uuid

class Patient(models.Model):
    SEX_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    third_party_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateTimeField()
    sex = models.CharField(max_length=10, choices=SEX_CHOICES)
    ethnic_background = models.CharField(max_length=100)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patients'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.third_party_id or 'local'})"
    
    def to_dict(self):
        """Convert model instance to dictionary for API response"""
        return {
            'id': str(self.id),  # This is our local UUID
            'third_party_id': self.third_party_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'dob': self.dob.isoformat() if self.dob else None,
            'sex': self.sex,
            'ethnic_background': self.ethnic_background,
            'source': 'both' if self.third_party_id else 'local',  # More accurate source
            'can_delete': True,  # All local patients can be deleted
            'created_at': self.created_at.isoformat() if self.created_at else None
        }