// Bạn viết:
<Card><p>Hi</p></Card>

// React hiểu gần tương đương:
Card({ children: jsx("p", { children: "Hi" }) });
// Card nhận object props, trong đó children là element <p>
