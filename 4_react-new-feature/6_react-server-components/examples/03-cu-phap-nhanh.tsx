// Server Action
'use server';
export async function createItem(formData: FormData) {
  await db.item.create({ /* ... */ });
  revalidatePath('/items');
}
