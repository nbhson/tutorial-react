// ✅ ĐÚNG: ternary / && / .map() — đều là expression trả giá trị
return <p>{age > 18 ? "lớn" : "nhỏ"}</p>;
return <ul>{list.map((x) => <li key={x}>{x}</li>)}</ul>;
