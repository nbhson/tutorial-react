// ❌ SAI: tin id là number — fetch /users/abc, crash
const { id } = useParams(); fetch(`/api/users/${id}`);
