// ❌ SAI: schema number nhưng default string -> runtime fail validate ngay mở form
const Schema = z.object({ age: z.number() });
useForm({ defaultValues: { age: "20" as any } });
