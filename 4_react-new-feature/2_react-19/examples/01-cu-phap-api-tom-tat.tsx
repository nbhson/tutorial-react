const [state, formAction, isPending] = useActionState(action, initial);
const [optimistic, addOptimistic] = useOptimistic(state, updater);
const value = use(promiseOrContext);           // có điều kiện được
function Input({ ref, ...p }: { ref?: React.Ref<HTMLInputElement> }) { /* ... */ }
<article><title>{t}</title><meta name="description" content={d} /></article>
<ThemeContext value="dark">{children}</ThemeContext>   // context-as-provider
