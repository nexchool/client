import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService } from '../services/teacherService';
import { Teacher, CreateTeacherDTO, UpdateTeacherDTO, CreateTeacherResponse } from '../types';

export const useTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(
    async (params?: { search?: string; status?: string; department?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await teacherService.getTeachers(params);
        setTeachers(data.items);
        setDepartments(data.departments);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch teachers');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchTeacher = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherService.getTeacher(id);
      setCurrentTeacher(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch teacher details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTeacher = useCallback(async (data: CreateTeacherDTO): Promise<CreateTeacherResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await teacherService.createTeacher(data);
      setTeachers(prev => [...prev, response.teacher]);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to create teacher');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTeacher = useCallback(async (id: string, data: UpdateTeacherDTO): Promise<Teacher> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await teacherService.updateTeacher(id, data);
      setTeachers(prev => prev.map(t => t.id === id ? updated : t));
      if (currentTeacher?.id === id) {
        setCurrentTeacher(updated);
      }
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update teacher');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentTeacher]);

  const deleteTeacher = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await teacherService.deleteTeacher(id);
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete teacher');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    teachers,
    departments,
    currentTeacher,
    loading,
    error,
    fetchTeachers,
    fetchTeacher,
    createTeacher,
    updateTeacher,
    deleteTeacher,
  };
};

export const teachersKeys = {
  all: ['teachers'] as const,
  list: () => ['teachers', 'list'] as const,
  detail: (id: string) => ['teachers', 'detail', id] as const,
};

// TanStack Query hooks for teacher detail + mutations.
// These coexist with the useState-based useTeachers above.

export function useTeacher(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: teachersKeys.detail(id ?? ''),
    queryFn: () => teacherService.getTeacher(id!),
    enabled: enabled && !!id,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeacherDTO): Promise<CreateTeacherResponse> =>
      teacherService.createTeacher(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teachersKeys.list() });
    },
  });
}

export function useUpdateTeacher(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTeacherDTO): Promise<Teacher> =>
      teacherService.updateTeacher(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teachersKeys.list() });
      qc.invalidateQueries({ queryKey: teachersKeys.detail(id) });
    },
  });
}
