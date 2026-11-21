// example.tsx dùng pattern này cho dòng đếm:
{pending.length > 0 && <li>Bạn còn {pending.length} việc</li>}
// pending.length = 2 -> 2 > 0 là true -> vẽ <li>
// pending.length = 0 -> 0 > 0 là false -> React bỏ qua, không vẽ gì
