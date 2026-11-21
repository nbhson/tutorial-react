const root = createRoot(el);                 // thay ReactDOM.render
root.render(<StrictMode><App /></StrictMode>);

import { flushSync } from 'react-dom';       // phá batching
const [isPending, startTransition] = useTransition();
const deferred = useDeferredValue(value);
const id = useId();
const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);
