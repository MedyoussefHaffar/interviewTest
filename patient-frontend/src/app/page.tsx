'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/types/patient';
import { patientApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Database, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import PatientForm from '@/components/patient-form';
import PatientList from '@/components/patient-list';

export default function HomePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPatients = async (page: number = 1) => {
    try {
      setLoading(true);
      const patientsData = await patientApi.getPatients(page);
      setPatients(patientsData.patients);
      setCurrentPage(patientsData.page || 1);
      setTotalPages(Math.ceil(patientsData.total / patientsData.per_page) || 1);
      
      if (patientsData.sources.third_party_error) {
        toast.error('Some external patients may not be loaded due to connection issues');
      }
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(currentPage);
  }, [currentPage]);

  const stats = {
    total_patients: patients.length,
    local_count: patients.filter(p => p.source === 'local' || p.source === 'both').length,
    third_party_count: patients.filter(p => p.source === 'third_party').length,
    local_only_count: patients.filter(p => p.source === 'local').length,
    synced_count: patients.filter(p => p.source === 'both').length,
  };

  const handlePatientCreated = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);
    setShowForm(false);
    loadPatients(1);
    toast.success('Patient created successfully');
  };

  const handlePatientDeleted = (patientId: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    toast.success('Patient deleted successfully');
  };

  const handlePatientCopied = (newPatient: Patient) => {
    setPatients(prev => prev.map(p => 
      p.id === newPatient.third_party_id ? newPatient : p
    ));
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground">Manage your patients efficiently</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Patient
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
            loading={loading}
            onPatientCreated={handlePatientCreated}
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