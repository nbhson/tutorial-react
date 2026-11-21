// dnd-kit sortable (npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities):
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function Item({ id }: { id: string }) {
  // useSortable tách behavior (ref/listeners/attributes/transform) khỏi UI — bạn tự render
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <li ref={setNodeRef} // BẮT BUỘC: không gắn là không đo vị trí, kéo không chạy
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes} {...listeners}> {/* a11y + handle kéo */}
      {id}
    </li>
  );
}
// Cha:
<DndContext collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
  if (!over || active.id === over.id) return; // thả ra ngoài/về chỗ cũ -> no-op
  setItems((xs) => arrayMove(xs, xs.findIndex((x) => x.id === active.id), xs.findIndex((x) => x.id === over.id)));
}}>
  <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
    {items.map((x) => <Item key={x.id} id={x.id} />)}
  </SortableContext>
</DndContext>
