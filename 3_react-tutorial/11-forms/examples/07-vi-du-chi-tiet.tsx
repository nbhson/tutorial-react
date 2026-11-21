// useFieldArray cho dòng sản phẩm động — schema mảng validate theo
import { useFieldArray } from "react-hook-form";
const { fields, append, remove } = useFieldArray({ control, name: "items" });
// fields.map((f, i) => <input {...register(`items.${i}.name`)} />) + nút append({ name: "", price: 0 })

// Controller cho component ngoài không phải input (select shadcn, datepicker):
import { Controller } from "react-hook-form";
<Controller control={control} name="country" render={({ field }) => (
  <Select value={field.value} onValueChange={field.onChange} />
)} />
