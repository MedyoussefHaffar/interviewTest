'use client';

import { useState } from 'react';
import { PatientCreate } from '@/types/patient';
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
    onPatientCreated: (patientData: PatientCreate) => void;
}

interface FormErrors {
    first_name?: string;
    last_name?: string;
    dob?: string;
    ethnic_background?: string;
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
    const [errors, setErrors] = useState<FormErrors>({});

    // Validation functions
    const validateName = (name: string): boolean => {
        const nameRegex = /^[A-Za-z\s]+$/;
        return nameRegex.test(name.trim());
    };

    const validateDateOfBirth = (dob: string): boolean => {
        if (!dob) return false;
        
        const selectedDate = new Date(dob);
        const today = new Date();
        
        // Set both dates to midnight for accurate comparison
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        return selectedDate <= today;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // First name validation
        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        } else if (!validateName(formData.first_name)) {
            newErrors.first_name = 'First name can only contain letters and spaces';
        }

        // Last name validation
        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        } else if (!validateName(formData.last_name)) {
            newErrors.last_name = 'Last name can only contain letters and spaces';
        }

        // Date of birth validation
        if (!formData.dob) {
            newErrors.dob = 'Date of birth is required';
        } else if (!validateDateOfBirth(formData.dob)) {
            newErrors.dob = 'Date of birth cannot be in the future';
        }

        // Ethnic background validation
        if (!formData.ethnic_background.trim()) {
            newErrors.ethnic_background = 'Ethnic background is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Please fix the form errors');
            return;
        }

        setLoading(true);

        try {
            // Format the date to include time with zeros
            const formattedData: PatientCreate = {
                ...formData,
                dob: `${formData.dob}T00:00:00.000Z` // Add time part with zeros
            };
            
            await onPatientCreated(formattedData);
            setFormData({
                first_name: '',
                last_name: '',
                dob: '',
                sex: 'male',
                ethnic_background: '',
            });
            setErrors({});
        } catch (error) {
            // Error is handled in parent component
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Reset form when dialog is closed
            setFormData({
                first_name: '',
                last_name: '',
                dob: '',
                sex: 'male',
                ethnic_background: '',
            });
            setErrors({});
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                                    className={errors.first_name ? 'border-red-500' : ''}
                                />
                                {errors.first_name && (
                                    <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => handleChange('last_name', e.target.value)}
                                    required
                                    className={errors.last_name ? 'border-red-500' : ''}
                                />
                                {errors.last_name && (
                                    <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={formData.dob}
                                onChange={(e) => handleChange('dob', e.target.value)}
                                required
                                className={errors.dob ? 'border-red-500' : ''}
                                max={new Date().toISOString().split('T')[0]} // Set max to today
                            />
                            {errors.dob && (
                                <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
                            )}
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
                                className={errors.ethnic_background ? 'border-red-500' : ''}
                            />
                            {errors.ethnic_background && (
                                <p className="text-red-500 text-xs mt-1">{errors.ethnic_background}</p>
                            )}
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