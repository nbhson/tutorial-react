// ❌ SAI: userId đổi nhưng title kẹt user 1 (effect không chạy lại)
useEffect(() => { document.title = `User ${userId}`; }, []);
