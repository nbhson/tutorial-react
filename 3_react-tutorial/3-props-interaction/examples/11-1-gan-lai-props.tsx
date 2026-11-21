// ✅ ĐÚNG: con báo cha, cha truyền giá trị mới
function Greeting({ name }: { name: string }) {
  return <p>{name}</p>;
}
// Cha: const [name, setName] = useState("Son"); <Greeting name={name} />
// Muốn đổi: setName("Linh") ở cha (qua callback từ con nếu cần)
