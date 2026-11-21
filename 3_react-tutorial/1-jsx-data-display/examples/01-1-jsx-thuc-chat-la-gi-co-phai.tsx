// Bạn viết:
<h3>Your name: {name}</h3>
// Compiler hiểu gần như:
jsx("h3", { children: ["Your name: ", name] });
