import { ViewTransition, startTransition, addTransitionType } from 'react';

// 1. Cách dùng cơ bản — đặt TRƯỚC mọi DOM node trong subtree
<ViewTransition>
  <Component />
</ViewTransition>

// 2. Class riêng cho từng loại (tắt hết, chỉ bật enter/exit)
<ViewTransition default="none" enter="slide-in" exit="slide-out">
  <Page />
</ViewTransition>

// 3. Class theo Transition Type
<ViewTransition
  enter={{ next: 'from-right', previous: 'from-left' }}
  exit={{ next: 'to-left', previous: 'to-right' }}
>
  <Page />
</ViewTransition>

// 4. Điều khiển bằng JS + cleanup
<ViewTransition
  onEnter={(instance) => {
    const anim = instance.new.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 300 },
    );
    return () => anim.cancel();
  }}
>
  <div>...</div>
</ViewTransition>

// 5. Ghi nguyên nhân để chọn animation
startTransition(() => {
  addTransitionType('next');
  setSlide((s) => s + 1);
});
