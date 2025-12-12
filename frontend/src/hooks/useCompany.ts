import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, type UpdateCompanyData } from '../services';

export const companyKeys = {
  all: ['company'] as const,
  current: () => [...companyKeys.all, 'current'] as const,
};

export function useCompany() {
  return useQuery({
    queryKey: companyKeys.current(),
    queryFn: () => companyService.get(),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyData) => companyService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.current() });
    },
  });
}
