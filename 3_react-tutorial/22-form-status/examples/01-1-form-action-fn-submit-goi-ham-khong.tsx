//Thuần React (client): action nhận FormData, async OK
async function submit(fd: FormData) {
  await saveName(String(fd.get("name")));
}
<form action={submit}>...</form>
// Không cần onSubmit + preventDefault — React lo
