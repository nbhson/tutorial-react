// Library: BẠN gọi nó, trong THỜI ĐIỂM BẠN muốn.
// lodash là library — không có vòng đời, không hook vào app của bạn.
import { debounce } from "lodash-es";
const onSearch = debounce((q) => fetch(q), 300); // bạn quyết khi nào gọi
