// ❌ SAI: login cũng lazy — màn hình đầu trắng chờ chunk
const Login = lazy(() => import('./Login'));
// ✅ ĐÚNG: giữ critical route tĩnh, lazy route sau login
import Login from './Login';
const Dashboard = lazy(() => import('./Dashboard'));
