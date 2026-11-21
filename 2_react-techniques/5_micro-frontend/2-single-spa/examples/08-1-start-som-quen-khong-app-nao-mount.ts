// ❌ SAI: start trước khi đăng ký/layout xong
start(); apps.forEach(registerApplication);
// ✅ ĐÚNG: đăng ký + layout xong mới start (như root-config trên)
