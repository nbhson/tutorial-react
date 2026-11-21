applyCoupon: async (code) => {
  const prev = get().discount;       // rollback point
  set({ discount: code, checking: true }); // optimistic
  try {
    const res = await checkCoupon(code);
    if (!res.valid) set({ discount: prev, couponError: res.reason });
  } catch {
    set({ discount: prev, couponError: "mạng lỗi" });
  } finally {
    set({ checking: false });
  }
},
