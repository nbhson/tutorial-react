// ❌ Tránh — các pattern lỗi thời/có hại
// import React, { Component } from 'react';
// class UserCard extends Component { ... }        // class (chỉ còn cho Error Boundary)
// UserCard.defaultProps = { tone: 'info' };       // bỏ từ React 19 với function component
// items.push(newItem);                            // mutate state → React không re-render/Compiler skip
// function Component() { if (x) useMemo(...) }    // hook có điều kiện — vi phạm rules-of-hooks
