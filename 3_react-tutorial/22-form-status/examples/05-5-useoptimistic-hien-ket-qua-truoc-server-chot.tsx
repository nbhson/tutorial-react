const [optimisticComments, addOptimistic] = useOptimistic(comments, (cur, c: Comment) => [...cur, c]);
// trong action: addOptimistic(newComment) — chạy NGAY, không đợi await
// server reject => React trả list về như cũ; accept => replace bằng data thật
