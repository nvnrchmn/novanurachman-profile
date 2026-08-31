import { useEffect, useState } from 'react';
import { apiData } from '@/lib/api';

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    apiData<{ total_visitors: number; total_visits: number }>('/visitors', { skipCSRF: true })
      .then((d) => setCount(d.total_visits))
      .catch(() => setCount(null));
  }, []);

  if (count === null) return null;

  return (
    <span className="font-mono text-xs text-mist-600">
      {count.toLocaleString()} visitors
    </span>
  );
}
