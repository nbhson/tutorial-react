// 1. View Transition (bọc trong Transition mới animate)
<ViewTransition enter="fade-in" exit="fade-out"><Page /></ViewTransition>;
startTransition(() => { addTransitionType('next'); setSlide((s) => s + 1); });

// 2. Fragment Ref (không dùng <>...</>)
const ref = useRef(null);
<Fragment ref={ref}>{items.map((i) => <Card key={i.id} />)}</Fragment>;
ref.current?.focus();

// 3. browser() — opt-out SSR, PHẢI trong <Suspense> và Client Component
'use client';
use(browser('Cần API của browser.'));
