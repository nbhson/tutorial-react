// ❌ Thiếu: title kẹt user cũ
useEffect(() => { document.title = `User ${userId}`; }, []); // userId đổi không chạy lại

// ✅ Đủ:
useEffect(() => { document.title = `User ${userId}`; }, [userId]);

// ❌ Thừa: options mới mỗi render -> fetch mỗi render
useEffect(() => { fetch(url, { headers: {} }); }, [{ headers: {} }]); // object mới mỗi lần

// ✅ Gọn: deps nguyên thủy ổn định
const token = auth.token;
useEffect(() => { fetch(url, { headers: { token } }); }, [url, token]);
