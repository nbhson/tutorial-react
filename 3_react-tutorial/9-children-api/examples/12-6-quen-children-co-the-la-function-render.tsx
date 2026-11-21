// ✅ ĐÚNG: tách trường hợp — typeof children === "function" thì gọi, không thì map
typeof children === "function" ? (children as any)(data) : Children.map(children, ...)
