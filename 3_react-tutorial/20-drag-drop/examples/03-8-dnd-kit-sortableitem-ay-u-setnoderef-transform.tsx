import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

function SortableItem({ id }: { id: string }) {
  // Lấy đủ 4 nguyên liệu hành vi từ hook headless
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id });
  return (
    <li
      ref={setNodeRef} // bắt buộc: để dnd-kit đo vị trí, thiếu là kéo chết
      style={{ transform: CSS.Transform.toString(transform) }} // item "nhấc lên" theo chuột
      {...attributes} // ARIA + role cho screen reader/keyboard
      {...listeners} // handler kéo (chuột + bàn phím Space/mũi tên)
    >
      {id}
    </li>
  );
}
