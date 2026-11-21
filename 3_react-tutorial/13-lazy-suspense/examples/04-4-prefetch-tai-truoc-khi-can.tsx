// example.tsx: helper + 2 trigger (chuột + bàn phím)
const preloadChart = () => import("./example"); // thật: import("./HeavyChart")
const HeavyChart = lazy(() => import("./HeavyChart")); // cùng URL -> cùng cache
<button onMouseEnter={preloadChart} onFocus={preloadChart} onClick={() => setShow(true)}>
