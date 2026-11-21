// ✅ ĐÚNG: coerce tự đổi trước khi check
z.object({ age: z.coerce.number().min(0, "Tuổi không âm") })
