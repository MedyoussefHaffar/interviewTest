'use client';

import { useState } from 'react';
import { Patient } from '@/types/patient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Eye, Trash2, Copy, User, Database, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { patientApi } from '@/lib/api';

interface PatientListProps {
  patients: Patient[];
  loading: boolean;
  onPatientCreated: (patient: Patient) => void;
  onPatientDeleted: (patientId: string) => void;
  onPatientCopied: (newPatient: Patient) => void;
}

export default function PatientList({ patients, loading, onPatientCreated, onPatientDeleted, onPatientCopied }: PatientListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [copyingPatientId, setCopyingPatientId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'local':
        return <Database className="h-4 w-4" />;
      case 'third_party':
        return <ExternalLink className="h-4 w-4" />;
      case 'both':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'local':
        return 'bg-blue-100 text-blue-800';
      case 'third_party':
        return 'bg-green-100 text-green-800';
      case 'both':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'local':
        return 'Local Only';
      case 'third_party':
        return 'External';
      case 'both':
        return 'Synced';
      default:
        return source;
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;

    setDeleting(true);
    try {
      await patientApi.deletePatient(patientToDelete.id);
      onPatientDeleted(patientToDelete.id);
      toast.success('Patient deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete patient');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleCopyPatient = async (patient: Patient) => {
    if (patient.source !== 'third_party') return;

    setCopyingPatientId(patient.id);
    try {
      const newPatient = await patientApi.copyExternalPatient(patient.id);
      onPatientCopied(newPatient);
      toast.success('Patient copied to local database successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to copy patient');
    } finally {
      setCopyingPatientId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient Name</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>Sex</TableHead>
            <TableHead>Ethnic Background</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No patients found. Create your first patient.
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div>
                    {patient.first_name} {patient.last_name}
                  </div>
                  {patient.source === 'third_party' && (
                    <div className="text-xs text-muted-foreground">
                      Read-only from external system
                    </div>
                  )}
                </TableCell>
                <TableCell>{formatDate(patient.dob)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {patient.sex}
                  </Badge>
                </TableCell>
                <TableCell>{patient.ethnic_background}</TableCell>
                <TableCell>
                  <Badge className={getSourceColor(patient.source)}>
                    <span className="flex items-center gap-1">
                      {getSourceIcon(patient.source)}
                      {getSourceText(patient.source)}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/patients/${patient.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    
                    {/* Copy button for external patients */}
                    {patient.source === 'third_party' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyPatient(patient)}
                        disabled={copyingPatientId === patient.id}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {copyingPatientId === patient.id ? 'Copying...' : 'Copy to Local'}
                      </Button>
                    )}
                    
                    {/* Delete button for local patients */}
                    {patient.can_delete && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClick(patient)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patient
              <span className="font-semibold"> {patientToDelete?.first_name} {patientToDelete?.last_name}</span>
              from the local database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}