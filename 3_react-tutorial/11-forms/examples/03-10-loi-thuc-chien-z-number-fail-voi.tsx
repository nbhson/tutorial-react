import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// coerce: ép string từ input thành number rồi mới check positive
const Schema = z.object({ qty: z.coerce.number().positive("Số lượng phải > 0") });

function BuyForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ qty: number }>({
    resolver: zodResolver(Schema),
  });
  return (
    <form onSubmit={handleSubmit(async (d) => {
      await fetch("/api/order", { method: "POST", body: JSON.stringify(d) }); // gọi API thật
    })}>
      <input type="number" {...register("qty")} placeholder="Số lượng" />
      {errors.qty && <small>{errors.qty.message}</small>}
      {/* Khóa nút khi đang gửi: chống double submit */}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang lưu..." : "Mua"}</button>
    </form>
  );
}
