// Nếu cần theo dõi ngoài DevTools: console.timeStamp đánh dấu trong timeline
performance.timeStamp('list-rendered');
// UI ngoài production: chỉ chạy khi import.meta.env.DEV
if (import.meta.env.DEV) console.profile('filter-interaction');
