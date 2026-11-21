// ❌ SAI: gán lại props trong con
function Greeting({ name }: { name: string }) {
  name = "Khác"; // vi phạm một chiều
  return <p>{name}</p>;
}
