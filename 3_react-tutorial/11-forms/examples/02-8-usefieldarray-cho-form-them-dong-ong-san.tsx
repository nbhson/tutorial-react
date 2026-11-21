import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema mảng: mỗi dòng có tên + giá dương, ít nhất 1 dòng
const Schema = z.object({
  items: z.array(z.object({
    name: z.string().min(1, "Nhập tên"),
    price: z.coerce.number().positive("Giá phải > 0"),
  })).min(1, "Cần ít nhất 1 dòng"),
});

function OrderForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<{ items: { name: string; price: number }[] }>({
    resolver: zodResolver(Schema), // cắm schema mảng vào RHF
    defaultValues: { items: [{ name: "", price: 0 }] }, // 1 dòng khởi đầu
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" }); // quản mảng động
  return (
    <form onSubmit={handleSubmit((d) => alert(JSON.stringify(d)))}>
      {fields.map((f, i) => (
        <div key={f.id}> {/* key ổn định từ RHF, không dùng index */}
          <input {...register(`items.${i}.name`)} placeholder="Tên SP" />
          <input type="number" {...register(`items.${i}.price`)} placeholder="Giá" />
          <button type="button" onClick={() => remove(i)}>Xóa</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: "", price: 0 })}>Thêm dòng</button>
      <button type="submit">Đặt hàng</button>
    </form>
  );
}
