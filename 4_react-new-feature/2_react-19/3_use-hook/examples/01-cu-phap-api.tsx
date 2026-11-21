import { use, Suspense, createContext } from 'react';

// Đọc Context có điều kiện — useContext KHÔNG cho phép:
const theme = cond ? use(ThemeContext) : 'light';

// Unwrap Promise (bắt buộc bọc Suspense):
function Profile({ promise }: { promise: Promise<User> }) {
  const user = use(promise); // suspend tới khi resolve
  return <p>{user.name}</p>;
}
<Suspense fallback="Loading...">
  <Profile promise={fetchUser()} />
</Suspense>;
