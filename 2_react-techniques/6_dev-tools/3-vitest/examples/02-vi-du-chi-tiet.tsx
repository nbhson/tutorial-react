// Counter.test.tsx — test theo hành vi người dùng
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { CounterView } from './example';

test('tăng giá trị khi click nút "+"', async () => {
  const user = userEvent.setup();
  render(<CounterView />);

  // Trước: giá trị ban đầu
  expect(screen.getByText('Giá trị: 0')).toBeInTheDocument();

  // Như user thật bấm — trigger click + bỏ qua microtask
  await user.click(screen.getByRole('button', { name: '+' }));

  // Sau: hiển thị 1
  expect(screen.getByText('Giá trị: 1')).toBeInTheDocument();
});
