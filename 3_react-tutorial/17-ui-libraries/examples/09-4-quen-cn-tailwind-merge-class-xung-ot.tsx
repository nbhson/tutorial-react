// ❌ SAI: px-2 và px-4 cùng trong DOM — kết quả theo thứ tự CSS (may rủi)
<button className={`px-4 ${className}`}>Hi</button> // className="px-8" -> "px-4 px-8"
