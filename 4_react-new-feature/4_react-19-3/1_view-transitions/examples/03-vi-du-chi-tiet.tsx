// example.tsx — gallery thumbnail ↔ ảnh lớn bằng shared element transition
import { ViewTransition, startTransition, useState } from 'react';

const PHOTOS = [
  { id: 'a', thumb: '/a-thumb.jpg', full: '/a-full.jpg' },
  { id: 'b', thumb: '/b-thumb.jpg', full: '/b-full.jpg' },
];

export default function Gallery() {
  const [selected, setSelected] = useState<string | null>(null);
  const photo = PHOTOS.find((p) => p.id === selected);

  return (
    <div>
      <h2>View Transitions (React 19.3)</h2>
      {!photo ? (
        // Grid: mỗi thumbnail là một ViewTransition có name riêng
        <div style={{ display: 'flex', gap: 12 }}>
          {PHOTOS.map((p) => (
            <ViewTransition key={p.id} name={`photo-${p.id}`}>
              <img
                src={p.thumb}
                alt={p.id}
                style={{ cursor: 'zoom-in' }}
                // BẮT BUỘC đổi state trong startTransition mới animate
                onClick={() => startTransition(() => setSelected(p.id))}
              />
            </ViewTransition>
          ))}
        </div>
      ) : (
        // Ảnh lớn dùng CÙNG name → React ghép thành shared element transition
        <ViewTransition name={`photo-${photo.id}`}>
          <img
            src={photo.full}
            alt={photo.id}
            style={{ cursor: 'zoom-out' }}
            onClick={() => startTransition(() => setSelected(null))}
          />
        </ViewTransition>
      )}
      <p><small>Browser hỗ trợ View Transitions sẽ thấy ảnh morph to/nhỏ dần.</small></p>
    </div>
  );
}
