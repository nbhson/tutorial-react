// ❌ SAI: string "Hello" không có .props -> crash
Children.map(children, (c) => cloneElement(c as any, { onClick: fn }));
