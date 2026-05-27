import { apiGet } from '@/common/services/api';
import type { StudentTransport } from '../types';

export const transportService = {
  getStudentMyTransport: async () => {
    return await apiGet<StudentTransport>('/api/transport/students/me');
  },
};
