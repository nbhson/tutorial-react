// example.tsx: 4 events + 1 state là đủ demo
<li draggable // bật kéo
  onDragStart={() => setDragId(it.id)} // ghi nguồn (id, không index)
  onDragOver={(e) => e.preventDefault()} // CHO PHÉP drop (quên là onDrop không chạy)
  onDrop={() => dropOn(it.id)} // setState mảng mới bất biến
  onDragEnd={reset} // thả ra ngoài cũng reset
>
