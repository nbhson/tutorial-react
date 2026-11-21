// npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function Item({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      {id} <button>Theo handle dưới sẽ kéo từ tay cầm</button>
    </li>
  );
}
// Cha: sensors (pointer + keyboard) + onDragEnd arrayMove + DragOverlay + SortableContext strategy
