// ❌ SAI: file export default nhưng import kiểu named (hoặc ngược lại)
// App.tsx: export default function App() {...}
import { App } from "./App"; // undefined — crash "Element type is invalid"
