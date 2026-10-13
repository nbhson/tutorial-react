# Q44: Review code React của người khác, dấu hiệu nào cho thấy code chưa đúng chất React?

## Câu hỏi

> Review code React của team (đặc biệt người chuyển từ Angular hoặc JS thuần) — có những dấu hiệu nào cho thấy code đang "không React" (ngon từ Angular/JS)?
> Ví dụ: dùng `Class component` thay vì hook, dùng `Service` (DI) thay vì Context/prop, dùng `Subject`/`Observable` thay vì state, hay "viết React như Angular" (template-style, hai chiều binding, event-driven).

## Trả lời ngắn (elevator pitch, 30 giây)
- Code React "đúng chất" = **state-driven**: UI là hàm của state/props, mọi thay đổi đi qua `setState`, data chảy xuống — sự kiện chảy lên.
- **5 dấu hiệu review**: (1) Chọc DOM trực tiếp (`getElementById`, `innerHTML`) thay vì state/ref. (2) Class component còn sót trong codebase đã hooks. (3) Hai nguồn sự thật — DOM và state lệch nhau. (4) Effect làm việc của render: tính data từ props/state rồi `setState` trong effect. (5) Logic copy-paste giữa component thay vì tách custom hook.
- **Nguyên tắc một câu**: đọc code mà không chỉ ra được "state nào điều khiển UI này" thì có mùi.

## Trả lời chi tiết

### 1. 5 "dấu hiệu code không React" (Q3, Q15, Q27)

| Dấu hiệu | Code không React | Code React đúng (Q3, Q15, Q27) | Vì sao sai (Q3, Q15) |
|---|---|---|---|
| **Class component (Q3)** | `class MyComponent` + `constructor` + `state = {}` (Q3) | `function MyComponent(props)` + `useState` (Q3, Q10) | Class deprecated (Q3), hook là chuẩn (Q5) |
| **Service (DI) (Q1, Q15)** | `@Injectable` + `inject(Service)` (Q1) | `useContext` (Q13) hoặc props (Q9) | DI không tồn tại trong React (Q1), dùng Context/props (Q9, Q13) |
| **`Subject`/`Observable` (Q1, Q15)** | `subject: Subject<T>` + `subscribe()` (Q1) | `useState` (Q10) | RxJS là Angular (Q1, Q15), state là React (Q10) |
| **"Template-style" (Q6)** | `*ngIf`, `*ngFor` (Q3) | `condition ? A : B` (Q6) hoặc `items.map(...)` (Q6, Q8) | Template là Angular (Q3), JSX là React (Q6) |
| **Event-driven (Q27)** | `emit()`, `EventEmitter` (Q3) | Callback (Q11) hoặc state (Q9, Q10) | Event-driven là Angular (Q27), state-driven là React (Q9) |

### 2. "Class component (Q3, Q5)" — thay bằng function hook (Q3, Q10)

```tsx
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
```

**Điểm ăn điểm (Q3, Q5, Q10)**: Class component (Q3) deprecated (Q3, Q5); hook (Q3) đúng (Q3, Q10).

### 3. "Service (DI) (Q1, Q15)" — thay bằng Context (Q13) hoặc props (Q9)

```tsx
// ❌ Service (DI) (Q1, Q15) — không React (Q3)
class DataService {
  data$ = new Subject<T>();
  getData() { return this.data$; }
}

// ✅ Context (Q13) — đúng React (Q3)
const data = useContext(DataContext); // Q13, Q9 (thay DI Q1, Q15)
// Hoặc props (Q9) nếu chỉ cha truyền (Q9)
```

**Điểm ăn điểm (Q1, Q15, Q13)**: Service (DI) (Q1, Q15) không tồn tại trong React (Q3); Context (Q13) đúng (Q3).

### 4. "RxJS (Subject/Observable) (Q1, Q15)" — thay bằng state (Q10)

```tsx
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
```

**Điểm ăn điểm (Q1, Q15, Q10)**: RxJS (Q1, Q15) không phù hợp; state (Q10) đúng (Q3).

### 5. "Template-style (Q6)" — thay bằng conditional rendering (Q6)

```tsx
// ❌ Template (Q3) — không React (Q3)
// {ngIf} data {render(A)} {ngIf} {render(B)}
// {ngFor} items {item} {render(item)} {ngFor}

// ✅ JSX (Q6) — đúng React (Q3)
{data ? <A data={data} /> : <B />} // Q6, conditional rendering (Q6)
{items.map(item => <Item key={item.id} item={item} />)} // Q6, Q8 (key Q8)
```

**Điểm ăn điểm (Q6, Q8)**: Template (Q3, Angular); JSX (Q6, React).

### 6. "Event-driven (Q27)" — thay bằng state (Q9, Q10)

```tsx
// ❌ Event (Q27) — không React (Q3)
const emit: EventEmitter<T>;
this.emit(newValue);
onEvent(v: T) { /* callback (Q11, Q27) */ }

// ✅ State (Q9, Q10) — đúng React (Q3)
onChange(v: T) { setValue(v); } // Q11, callback (Q11, Q10)
// setState (Q10) (không event Q27)
```

**Điểm ăn điểm (Q9, Q10, Q11)**: Event-driven (Q27); state-driven (Q9, Q10) đúng (Q3).

## Bẫy khi phỏng vấn

1. **"Class component (Q3, deprecated Q3); hook (Q3 đúng, Q10)"** → **Sai (Q3, Q5)**: hook (Q3) đúng (Q3, Q10).
2. **"Service (DI) (Q1, Q15); Context (Q13 đúng)"** → **Sai (Q1, Q15)**: Context (Q13) đúng (Q3).
3. **"RxJS (Subject) (Q1, Q15); state (Q10 đúng)"** → **Sai (Q1, Q15)**: state (Q10) đúng (Q3).
4. **"Template (Q3, Angular); JSX (Q6, React)"** → **Sai (Q6)**: JSX (Q6) đúng (Q3).

## Gợi ý câu chốt

> "Code không React (Q3, Q15, Q27) — 5 dấu hiệu (Q3, Q15): (1) **Class component (Q3, Q5)** (deprecated, hook đúng, Q10); (2) **Service (DI) (Q1, Q15)** (Q1, Context đúng, Q13); (3) **RxJS (Subject/Observable) (Q1, Q15)** (Q1, state đúng, Q10); (4) **Template (Q3, Q6)** (Angular-style, JSX đúng, Q6); (5) **Event-driven (Q27)** (Q27, state đúng, Q9). **Nguyên tắc (Q3, Q15, Q27)**: Code React = state-driven (Q9, Q10, Q13, Q27), không event-driven (Q27, Q3).

## Reference

- [`03-strictmode`](../03-strictmode/README.md) — "Class component (deprecated, function hook Q3, Q5)"
- [`15-external-stores`](../15-external-stores/README.md) — "Service (DI) (Q1, Q15); Context (Q13 đúng)"
- [`10-useref-vs-usestate`](../10-useref-vs-usestate/README.md) — "RxJS (Q1, Q15); state (Q10 đúng)"
- [`06-jsx`](../06-jsx/README.md) — "Template (Q3, Angular); JSX (Q6, React)"
- [`09-lifting-state-up`](../09-lifting-state-up/README.md) — "Event-driven (Q27); state (Q9 đúng)"

## Câu hỏi liên quan

- **Hỏi tiếp (liên tục)**: [Q3 — StrictMode (Q3, Q5)?](../03-strictmode/README.md) · [Q15 — External stores (Q1, Q15)?](../15-external-stores/README.md)
- **Đào sâu (xuyên nhóm)**: [Q10 — useRef vs useState (Q1, Q15)?](../10-useref-vs-usestate/README.md) · [Q6 — JSX (Q3, Q6)?](../06-jsx/README.md)
