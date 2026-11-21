// ❌ Event (Q27) — không React (Q3)
const emit: EventEmitter<T>;
this.emit(newValue);
onEvent(v: T) { /* callback (Q11, Q27) */ }

// ✅ State (Q9, Q10) — đúng React (Q3)
onChange(v: T) { setValue(v); } // Q11, callback (Q11, Q10)
// setState (Q10) (không event Q27)
