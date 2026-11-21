// ❌ SAI: sửa props trong con
function Greeting(props: { name: string }) {
  props.name = "Hacked"; // TS có thể không chặn nếu không Readonly, nhưng runtime sai
  return <p>{props.name}</p>;
}
