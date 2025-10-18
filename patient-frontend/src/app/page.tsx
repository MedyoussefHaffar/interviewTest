'use client';

import { useState } from 'react';
import { Patient, PatientCreate } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Database, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import PatientForm from '@/components/patient-form';
import PatientList from '@/components/patient-list';
import { usePatients, useCreatePatient } from '@/hooks/usePatients';

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  
  const { data: patientsData, isLoading, error } = usePatients(currentPage);
  const createMutation = useCreatePatient();

  const patients = patientsData?.patients || [];
  const totalPages = patientsData ? Math.ceil(patientsData.total / patientsData.per_page) : 1;

  // Calculate stats directly from patients data
  const stats = {
    total_patients: patients.length,
    local_count: patients.filter(p => p.source === 'local' || p.source === 'both').length,
    third_party_count: patients.filter(p => p.source === 'third_party').length,
    local_only_count: patients.filter(p => p.source === 'local').length,
    synced_count: patients.filter(p => p.source === 'both').length,
  };

  const handlePatientCreated = async (patientData: PatientCreate) => {
    try {
      await createMutation.mutateAsync(patientData);
      setShowForm(false);
      toast.success('Patient created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create patient');
    }
  };

  const handlePatientDeleted = (patientId: string) => {
    toast.success('Patient deleted successfully');
  };

  const handlePatientCopied = (newPatient: Patient) => {
    toast.success('Patient copied to local database');
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (error) {
    toast.error('Failed to load patients');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patient Management System</h1>
          <p className="text-muted-foreground">Manage your patients efficiently</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={createMutation.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          {createMutation.isPending ? 'Creating...' : 'New Patient'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_patients}</div>
            <p className="text-xs text-muted-foreground">
              Current page
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Patients</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.local_count}</div>
            <p className="text-xs text-muted-foreground">
              {stats.synced_count} synced, {stats.local_only_count} local only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">External Patients</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.third_party_count}</div>
            <p className="text-xs text-muted-foreground">
              Read-only from external system
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Patients</CardTitle>
              <CardDescription>
                All patients from local database and third-party API. Copy external patients to enable full functionality.
              </CardDescription>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PatientList 
            patients={patients} 
            isLoading={isLoading}
            onPatientDeleted={handlePatientDeleted}
            onPatientCopied={handlePatientCopied}
          />
        </CardContent>
      </Card>

      {/* Patient Form Dialog */}
      <PatientForm
        open={showForm}
        onOpenChange={setShowForm}
        onPatientCreated={handlePatientCreated}
      />
    </div>
  );
}