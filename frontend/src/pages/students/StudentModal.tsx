import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { studentsApi } from '../../api/services';
import { Student, CreateStudentRequest, UpdateStudentRequest } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { getErrorMessage } from '../../api/client';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!studentToEdit;

  const [studentNumber, setStudentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (studentToEdit) {
      setStudentNumber(studentToEdit.studentNumber);
      setFirstName(studentToEdit.firstName);
      setLastName(studentToEdit.lastName);
      setEmail(studentToEdit.email || '');
      setPhone(studentToEdit.phone || '');
      setDepartment(studentToEdit.department || '');
      setYear(studentToEdit.year || '');
      setIsActive(studentToEdit.isActive);
    } else {
      setStudentNumber('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setDepartment('');
      setYear(1);
      setIsActive(true);
    }
  }, [studentToEdit, isOpen]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStudentRequest) => studentsApi.createStudent(data),
    onSuccess: () => {
      toast.success('Student registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      onClose();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateStudentRequest) =>
      studentsApi.updateStudent(studentToEdit!.studentId, data),
    onSuccess: () => {
      toast.success('Student updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['studentDetail'] });
      onClose();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      updateMutation.mutate({
        studentNumber: studentNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        year: year ? Number(year) : undefined,
        isActive,
      });
    } else {
      createMutation.mutate({
        studentNumber: studentNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        year: year ? Number(year) : undefined,
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Student Patron' : 'Register New Student'}
      subtitle={isEditing ? `ID: ${studentToEdit?.studentNumber}` : 'Add a student to permit library circulation'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Student Number / ID"
            required
            placeholder="e.g. STU-2024-001"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            required
            placeholder="e.g. Alex"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Last Name"
            required
            placeholder="e.g. Mercer"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email Address"
            type="email"
            placeholder="alex.m@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Phone Number"
            placeholder="+1 555-0192"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Department"
            placeholder="Computer Science"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <Input
            label="Academic Year"
            type="number"
            min={1}
            max={6}
            placeholder="e.g. 2"
            value={year}
            onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
          />
        </div>

        {isEditing && (
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Active Patron (Allowed to borrow books)
              </span>
            </label>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            {isEditing ? 'Save Changes' : 'Register Student'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
