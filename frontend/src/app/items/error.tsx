'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ItemsError({ error, reset }: {
  error: Error & { digest?: string }; reset: () => void
}) {
  return <ErrorBoundary error={error} reset={reset} type="items" />;
} 