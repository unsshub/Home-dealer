import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd: string | null;
}

export function useSubscription() {
  const { data, isLoading } = useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: () => api.get<Subscription | null>('/subscription').catch(() => null),
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) =>
      api.post<{ url: string }>('/stripe/checkout', { plan }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => api.post<{ url: string }>('/stripe/portal'),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const isFree =
    !isLoading && (!data || data?.status !== 'active');

  return {
    subscription: data ?? null,
    isLoading,
    isFree,
    checkoutMutation,
    portalMutation,
  };
}
