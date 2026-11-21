// ❌ Template (Q3) — không React (Q3)
// {ngIf} data {render(A)} {ngIf} {render(B)}
// {ngFor} items {item} {render(item)} {ngFor}

// ✅ JSX (Q6) — đúng React (Q3)
{data ? <A data={data} /> : <B />} // Q6, conditional rendering (Q6)
{items.map(item => <Item key={item.id} item={item} />)} // Q6, Q8 (key Q8)
