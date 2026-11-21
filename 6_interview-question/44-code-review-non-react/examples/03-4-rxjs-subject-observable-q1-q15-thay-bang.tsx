// ❌ RxJS (Q1, Q15) — không React (Q3)
const subject = new Subject<T>();
useEffect(() => {
  subject.subscribe(setValue); // Q15, Q10
  subject.emit(newValue);
  return () => subject.unsubscribe();
}, [subject]);

// ✅ State (Q10) — đúng React (Q3)
const [value, setValue] = useState<T>(null);
// setState (Q10) (không RxJS Q1, Q15)
