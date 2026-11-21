// ✅ ĐÚNG: Partial<Form> + coerce cho input number
const Schema = z.object({ age: z.coerce.number() });
useForm({ defaultValues: { age: 20 } });
