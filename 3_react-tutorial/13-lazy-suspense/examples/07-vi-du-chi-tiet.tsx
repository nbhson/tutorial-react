const loadChart = () => import("./HeavyChart"); // 1 URL duy nhất
const HeavyChart = lazy(loadChart); // lazy dùng cùng promise/cache
// <button onMouseEnter={loadChart} onClick={open}> — hover tải, click dùng lại
