import { ViewTransition, startViewTransition, useState } from 'react';

const PHOTOS = [
  { id: 'a', thumb: 'https://picsum.photos/id/1015/200/150', full: 'https://picsum.photos/id/1015/600/400' },
  { id: 'b', thumb: 'https://picsum.photos/id/1016/200/150', full: 'https://picsum.photos/id/1016/600/400' },
];

export default function GalleryTransition() {
  const [selected, setSelected] = useState<string | null>(null);
  const photo = PHOTOS.find((p) => p.id === selected);

  return (
    <div>
      <h2>View Transitions (React 19.3)</h2>
      {!photo ? (
        <div style={{ display: 'flex', gap: 12 }}>
          {PHOTOS.map((p) => (
            // Mỗi ảnh là shared element đặt tên riêng
            <ViewTransition key={p.id} name={`photo-${p.id}`}>
              <img
                src={p.thumb}
                alt={p.id}
                style={{ cursor: 'pointer' }}
                onClick={() => startViewTransition(() => setSelected(p.id))}
              />
            </ViewTransition>
          ))}
        </div>
      ) : (
        <ViewTransition name={`photo-${photo.id}`}>
          <img
            src={photo.full}
            alt={photo.id}
            style={{ cursor: 'zoom-out' }}
            onClick={() => startViewTransition(() => setSelected(null))}
          />
        </ViewTransition>
      )}
      <p><small>Browser hỗ trợ View Transitions sẽ thấy ảnh morph to/nhỏ dần.</small></p>
    </div>
  );
}
