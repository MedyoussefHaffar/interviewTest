'use client';

import { useState } from 'react';
import { Patient, PatientCreate } from '@/types/patient';
import { patientApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface PatientFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPatientCreated: (patient: Patient) => void;
}

export default function PatientForm({ open, onOpenChange, onPatientCreated }: PatientFormProps) {
    const [formData, setFormData] = useState<PatientCreate>({
        first_name: '',
        last_name: '',
        dob: '',
        sex: 'male',
        ethnic_background: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newPatient = await patientApi.createPatient(formData);
            onPatientCreated(newPatient);
            setFormData({
                first_name: '',
                last_name: '',
                dob: '',
                sex: 'male',
                ethnic_background: '',
            });
        } catch (error: any) {
            toast.error(
                error.response?.data?.error || "Failed to create patient"
            )
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Patient</DialogTitle>
                    <DialogDescription>
                        Add a new patient to the system. This will be saved in both local and third-party databases.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    value={formData.first_name}
                                    onChange={(e) => handleChange('first_name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => handleChange('last_name', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="datetime-local"
                                value={formData.dob}
                                onChange={(e) => handleChange('dob', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sex">Sex</Label>
                            <Select value={formData.sex} onValueChange={(value: 'male' | 'female' | 'other') => handleChange('sex', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ethnic_background">Ethnic Background</Label>
                            <Input
                                id="ethnic_background"
                                value={formData.ethnic_background}
                                onChange={(e) => handleChange('ethnic_background', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Patient'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}