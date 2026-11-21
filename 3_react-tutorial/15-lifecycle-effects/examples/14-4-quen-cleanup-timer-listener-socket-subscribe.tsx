// ❌ SAI: unmount vẫn tick/socket/message — rò + setState unmounted
useEffect(() => { window.addEventListener("resize", onResize); }, []);
