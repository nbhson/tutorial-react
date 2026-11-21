export function useLoginViewModel() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit() {
    setPending(true); setError(null);
    try {
      const r = await fetch('/api/login', {
        method: 'POST', body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error('Sai email');   // lỗi nghiệp vụ → hiện cho user
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return { email, setEmail, error, pending, submit };
}
