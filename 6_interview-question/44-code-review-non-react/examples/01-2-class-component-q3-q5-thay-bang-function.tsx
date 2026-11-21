// ❌ Class component (Q3, Q5) — không React (Q3)
class MyComponent {
  data;
  constructor(service) { this.service = service; }
  ngOnInit() { this.service.data$.subscribe(v => this.data = v); }
}

// ✅ Function hook (Q3) — đúng React (Q3)
function MyComponent({ data }) {
  const service = useContext(ServiceContext); // Q13, Q9 (thay DI Q1, Q15)
  useEffect(() => {
    service.data$.subscribe(setData); // Q10, state (Q10)
    return () => service.data$.unsubscribe();
  }, [service]);
  return <div>{render(data)}</div>;
}
