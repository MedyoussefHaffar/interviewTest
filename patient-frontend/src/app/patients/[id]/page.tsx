'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Patient, ProcessPatientData } from '@/types/patient';
import { patientApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, User, Calendar, Activity, ExternalLink, Database, Copy, BarChart3 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import ProcessResultChart from '@/components/process-result-chart';

interface ProcessResult {
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

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processData, setProcessData] = useState<ProcessPatientData>({
    weight: { value: 70, unit: 'kg' },
    height: { value: 1.75, unit: 'm' }
  });
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'results'>('form');
  const [copyingPatientId, setCopyingPatientId] = useState<string | null>(null);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const patientData = await patientApi.getPatient(params.id as string);
      setPatient(patientData);
    } catch (error) {
      toast.error('Failed to load patient');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadPatient();
    }
  }, [params.id]);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    // Only allow processing for local patients
    if (patient.source === 'third_party') {
      toast.error('Processing is only available for local patients');
      return;
    }

    setProcessing(true);
    try {
      const result = await patientApi.processPatient(patient.id, processData);
      setProcessResult(result);
      setActiveTab('results');
      toast.success('Patient processed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to process patient');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyPatient = async (patient: Patient) => {
    if (patient.source !== 'third_party') return;

    setCopyingPatientId(patient.id);
    try {
      const newPatient = await patientApi.copyExternalPatient(patient.id);
      // Redirect to the new local patient detail page
      router.push(`/patients/${newPatient.id}`);
      toast.success('Patient copied to local database successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to copy patient');
    } finally {
      setCopyingPatientId(null);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'local':
        return <Database className="h-5 w-5" />;
      case 'third_party':
        return <ExternalLink className="h-5 w-5" />;
      case 'both':
        return <User className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
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
        return 'External System';
      case 'both':
        return 'Synced (Local + External)';
      default:
        return source;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-muted-foreground">Patient Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">First Name</Label>
                <p className="text-lg">{patient.first_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Name</Label>
                <p className="text-lg">{patient.last_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Date of Birth</Label>
                <p className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(patient.dob)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Sex</Label>
                <Badge variant="outline" className="text-lg capitalize">
                  {patient.sex}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Ethnic Background</Label>
              <p className="text-lg">{patient.ethnic_background}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Data Source</Label>
              <Badge className={`${getSourceColor(patient.source)} text-lg`}>
                <span className="flex items-center gap-1">
                  {getSourceIcon(patient.source)}
                  {getSourceText(patient.source)}
                </span>
              </Badge>
            </div>

            {patient.third_party_id && (
              <div>
                <Label className="text-sm font-medium">External ID</Label>
                <p className="text-lg font-mono">{patient.third_party_id}</p>
              </div>
            )}

            {patient.created_at && (
              <div>
                <Label className="text-sm font-medium">Created At</Label>
                <p className="text-lg">{formatDateTime(patient.created_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Patient */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Patient Analysis
            </CardTitle>
            <CardDescription>
              {patient.source === 'third_party' 
                ? 'Processing is available only for local patients'
                : 'Calculate health metrics and generate analysis'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {patient.source !== 'third_party' ? (
              <>
                {/* Tabs for local patients */}
                <div className="flex border-b mb-4">
                  <button
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'form'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500'
                    }`}
                    onClick={() => setActiveTab('form')}
                  >
                    <Activity className="h-4 w-4 inline mr-2" />
                    Process
                  </button>
                  <button
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'results'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500'
                    }`}
                    onClick={() => setActiveTab('results')}
                    disabled={!processResult}
                  >
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Results
                  </button>
                </div>

                {/* Process Form */}
                {activeTab === 'form' && (
                  <form onSubmit={handleProcess} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight</Label>
                        <div className="flex gap-2">
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            value={processData.weight.value}
                            onChange={(e) => setProcessData({
                              ...processData,
                              weight: { ...processData.weight, value: parseFloat(e.target.value) }
                            })}
                            required
                          />
                          <select
                            value={processData.weight.unit}
                            onChange={(e) => setProcessData({
                              ...processData,
                              weight: { ...processData.weight, unit: e.target.value }
                            })}
                            className="border rounded-md px-3"
                          >
                            <option value="kg">kg</option>
                            <option value="lb">lb</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="height">Height</Label>
                        <div className="flex gap-2">
                          <Input
                            id="height"
                            type="number"
                            step="0.01"
                            value={processData.height.value}
                            onChange={(e) => setProcessData({
                              ...processData,
                              height: { ...processData.height, value: parseFloat(e.target.value) }
                            })}
                            required
                          />
                          <select
                            value={processData.height.unit}
                            onChange={(e) => setProcessData({
                              ...processData,
                              height: { ...processData.height, unit: e.target.value }
                            })}
                            className="border rounded-md px-3"
                          >
                            <option value="m">m</option>
                            <option value="cm">cm</option>
                            <option value="ft">ft</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={processing} className="w-full">
                      {processing ? 'Processing...' : 'Process Patient'}
                    </Button>
                  </form>
                )}

                {/* Results */}
                {activeTab === 'results' && processResult && (
                  <div>
                    {processResult.success ? (
                      <ProcessResultChart data={processResult} />
                    ) : (
                      <div className="text-center py-8 text-red-600">
                        <p>Processing failed. Please try again.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              // External patient message
              <div className="text-center py-8">
                <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">External Patient</p>
                <p className="text-muted-foreground mb-4">
                  This patient is read-only from the external system.
                </p>
                <Button 
                  onClick={() => handleCopyPatient(patient)}
                  disabled={copyingPatientId === patient.id}
                  className="mt-4"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copyingPatientId === patient.id ? 'Copying...' : 'Copy to Local Database'}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Copying will create a local version with full functionality
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}