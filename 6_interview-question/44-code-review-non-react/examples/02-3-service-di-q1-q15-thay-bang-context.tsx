// ❌ Service (DI) (Q1, Q15) — không React (Q3)
class DataService {
  data$ = new Subject<T>();
  getData() { return this.data$; }
}

// ✅ Context (Q13) — đúng React (Q3)
const data = useContext(DataContext); // Q13, Q9 (thay DI Q1, Q15)
// Hoặc props (Q9) nếu chỉ cha truyền (Q9)
