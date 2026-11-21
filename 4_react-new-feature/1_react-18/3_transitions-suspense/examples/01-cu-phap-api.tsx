import { startTransition, useTransition, useDeferredValue, Suspense, lazy } from 'react';

// 1. startTransition đơn lẻ (ngoài hook)
startTransition(() => setQuery(value)); // non-urgent update

// 2. Hook form
const [isPending, startTransition] = useTransition();

// 3. Deferred value
const deferredQuery = useDeferredValue(query); // trễ hơn query 1 nhịp

// 4. Suspense
<Suspense fallback={<Spinner />}>
  <Results query={deferredQuery} />
</Suspense>

// 5. Lazy + Suspense
const Chart = lazy(() => import('./Chart'));
