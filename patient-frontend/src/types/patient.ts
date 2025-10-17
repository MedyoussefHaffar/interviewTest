export interface Patient {
  id: string;
  third_party_id?: string;
  first_name: string;
  last_name: string;
  dob: string;
  sex: 'male' | 'female' | 'other';
  ethnic_background: string;
  source: 'local' | 'third_party' | 'both';
  can_delete: boolean;
  created_at?: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  dob: string;
  sex: 'male' | 'female' | 'other';
  ethnic_background: string;
}

export interface ProcessPatientData {
  weight: {
    value: number;
    unit: string;
  };
  height: {
    value: number;
    unit: string;
  };
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  page: number;
  per_page: number;
  sources: {
    local_count: number;
    third_party_count: number;
    third_party_error: boolean;
  };
}

export interface ProcessResult {
  success: boolean;
  patient: {
    weight: {
      value: number;
      unit: string;
    };
    height: {
      value: number;
      unit: string;
    };
  };
  results: [number, number][];
}
