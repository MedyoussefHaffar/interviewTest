'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '@/lib/api';
import { ProcessPatientData } from '@/types/patient';

// Cache keys
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: string) => [...patientKeys.lists(), { filters }] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  process: (id: string, data: ProcessPatientData) => [...patientKeys.detail(id), 'process', data] as const,
};

// Optimized hooks
export function usePatients(page: number = 1) {
  return useQuery({
    queryKey: patientKeys.list(`page-${page}`),
    queryFn: () => patientApi.getPatients(page),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientApi.getPatient(id),
    enabled: !!id, // Only run if ID exists
    staleTime: 5 * 60 * 1000, // 5 minutes for individual patients
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: patientApi.createPatient,
    onSuccess: (newPatient) => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      
      // Pre-cache the new patient
      queryClient.setQueryData(
        patientKeys.detail(newPatient.id),
        newPatient
      );
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: patientApi.deletePatient,
    onSuccess: (_, deletedPatientId) => {
      // Invalidate patients list
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      
      // Remove patient from cache
      queryClient.removeQueries({ queryKey: patientKeys.detail(deletedPatientId) });
    },
  });
}

export function useCopyPatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: patientApi.copyExternalPatient,
    onSuccess: (newPatient) => {
      // Invalidate patients list
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      
      // Pre-cache the new patient
      queryClient.setQueryData(
        patientKeys.detail(newPatient.id),
        newPatient
      );
    },
  });
}

export function useProcessPatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProcessPatientData }) =>
      patientApi.processPatient(id, data),
    onSuccess: (result, variables) => {
      // Cache the process result
      queryClient.setQueryData(
        patientKeys.process(variables.id, variables.data),
        result
      );
    },
  });
}

// Hook to get cached process result
export function useCachedProcessResult(patientId: string, processData: ProcessPatientData) {
  return useQuery({
    queryKey: patientKeys.process(patientId, processData),
    queryFn: () => patientApi.processPatient(patientId, processData),
    enabled: false, // Don't run automatically
    staleTime: 10 * 60 * 1000, // 10 minutes for process results
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
  });
}