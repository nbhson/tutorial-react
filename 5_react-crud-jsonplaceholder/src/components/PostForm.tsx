import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postSchema } from "../lib/postSchema";
import type { PostFormValues } from "../lib/postSchema";
import type { PostInput } from "../types";

interface PostFormProps {
  initial: PostInput;
  heading: string;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (input: PostInput) => void;
  onCancel?: () => void;
}

// Form dùng chung Create/Edit — react-hook-form + Zod (DAY 11).
// - defaultValues từ initial; useEffect reset khi chuyển Create <-> Edit.
// - Lỗi validate hiện dưới field; nút submit disable khi submitting.
export default function PostForm({
  initial,
  heading,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: PostFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    mode: "onChange",
    defaultValues: { title: initial.title, body: initial.body },
  });

  useEffect(() => {
    reset({ title: initial.title, body: initial.body });
  }, [initial.title, initial.body, reset]);

  return (
    <form
      className="card form"
      onSubmit={handleSubmit((values) =>
        onSubmit({ title: values.title, body: values.body, userId: initial.userId }),
      )}
    >
      <h2>{heading}</h2>

      <label className="field">
        <span>Tiêu đề *</span>
        <input
          {...register("title")}
          placeholder="VD: Học React CRUD với JSONPlaceholder"
          disabled={submitting}
        />
        {errors.title && <small className="error">{errors.title.message}</small>}
      </label>

      <label className="field">
        <span>Nội dung *</span>
        <textarea
          {...register("body")}
          rows={4}
          placeholder="Nhập nội dung bài viết (tối thiểu 10 ký tự)..."
          disabled={submitting}
        />
        {errors.body && <small className="error">{errors.body.message}</small>}
      </label>

      <div className="row">
        <button type="submit" disabled={submitting || !isValid}>
          {submitting ? "Đang lưu..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel} disabled={submitting}>
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
