// Đo chiều cao tooltip ĐÚNG (không nháy): useLayoutEffect
useLayoutEffect(() => { setTop(ref.current!.getBoundingClientRect().height); }, []);
// Vẽ lần đầu đã đúng vị trí — useEffect thì thấy "nhảy 1 frame" (vẽ trước, đo sau)
