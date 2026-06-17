import { useCallback, useEffect, useState, type DependencyList } from 'react';

interface ApiDataState<T> {
  data: T | null;
  loading: boolean;
  error: string;
  setError: (msg: string) => void;
  refetch: () => Promise<void>;
}

export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = [],
): ApiDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetcher());
      setError('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, setError, refetch };
}
