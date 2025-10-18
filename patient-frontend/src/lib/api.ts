import axios from 'axios';
import { Patient, PatientCreate, ProcessPatientData, PatientListResponse } from '@/types/patient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

export const patientApi = {
    // Get all patients with pagination - page is required
    getPatients: async (page: number = 1): Promise<PatientListResponse> => {
        const response = await api.get('/patients', {
            params: { page }
        });
        return response.data;
    },

    // Get single patient
    getPatient: async (id: string): Promise<Patient> => {
        const response = await api.get(`/patients/${id}`);
        return response.data;
    },

    // Create patient
    createPatient: async (patient: PatientCreate): Promise<Patient> => {
        const response = await api.post('/patients', patient);
        return response.data;
    },

    // Process patient
    processPatient: async (id: string, data: ProcessPatientData): Promise<any> => {
        const response = await api.post(`/patients/${id}/process`, data);
        return response.data;
    },

    // Delete patient
    deletePatient: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/patients/${id}/delete`);
        return response.data;
    },

    // Copy external patient to local
    copyExternalPatient: async (patient: Patient): Promise<Patient> => {
        const response = await api.post('/patients/copy', patient);
        return response.data;
    },

};