import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for polling data at regular intervals
 * @param fetchFunction The function to call to fetch data
 * @param initialData Initial data to use
 * @param interval Polling interval in milliseconds (default: 10000ms = 10s)
 * @param enabled Whether polling is enabled (default: true)
 * @param allowManualUpdates Whether to allow manual updates to the data state (default: false)
 * @returns [data, isLoading, error, manualRefetch, setData]
 */
export function usePolling<T>(
  fetchFunction: () => Promise<T>,
  initialData: T,
  interval: number = 10000,
  enabled: boolean = true,
  allowManualUpdates: boolean = false
): [T, boolean, Error | null, () => void, (newData: T) => void] {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to track the latest fetch function to avoid stale closures
  const fetchFunctionRef = useRef(fetchFunction);
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  // Function to fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await fetchFunctionRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Set up polling
  useEffect(() => {
    // Initial fetch
    if (enabled) {
      fetchData();
    }

    // Set up interval if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (enabled && interval > 0) {
      intervalId = setInterval(fetchData, interval);
    }

    // Clean up interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [interval, enabled]);

  // Manual refetch function
  const manualRefetch = () => {
    fetchData();
  };

  // Return the setter function only if manual updates are allowed
  return allowManualUpdates
    ? [data, isLoading, error, manualRefetch, setData]
    : [data, isLoading, error, manualRefetch, () => {}] as [T, boolean, Error | null, () => void, (newData: T) => void];
}
