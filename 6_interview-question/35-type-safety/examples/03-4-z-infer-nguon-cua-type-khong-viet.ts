// 1 schema -> 1 type (đổi 1 nơi, mọi chỗ dùng tự cập nhật)
const UserSchema = z.object({ id: z.string(), name: z.string() });
type User = z.infer<typeof UserSchema>; // type suy ra từ schema, không viết interface thứ 2

// API raw (string, không tin) -> parse (runtime) -> type đúng
const user: User = UserSchema.parse(rawJsonFromApi); // parse chặn shape sai ngay ở biên
