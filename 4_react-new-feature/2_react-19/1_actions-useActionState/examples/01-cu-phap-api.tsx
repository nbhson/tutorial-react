import { useActionState } from 'react';

const [state, formAction, isPending] = useActionState(
  async (prevState: State, formData: FormData) => nextState, // action
  initialState,                                               // state ban đầu
);

// Dùng trong JSX:
<form action={formAction}>
  <input name="email" />
  <button disabled={isPending}>Gửi</button>
</form>

// Trong con của form:
import { useFormStatus } from 'react-dom';
const { pending } = useFormStatus(); // đọc pending của form cha
