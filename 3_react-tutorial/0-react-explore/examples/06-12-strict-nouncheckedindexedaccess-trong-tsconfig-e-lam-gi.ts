const list = ["a", "b"];
// strict: string[] ; strict + noUncheckedIndexedAccess: (string | undefined)[]
const first = list[0];      // type: string | undefined → buộc xử lý
if (first !== undefined) {
  console.log(first.toUpperCase()); // an toàn
}
// hoặc: const first = list[0] ?? "fallback";
