import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth, homeFor } from './lib/auth.jsx';
import { AppShell } from './components/Shell.jsx';
import { Spinner } from './components/ui.jsx';
import Landing from './pages/Landing.jsx';
import { SignIn, SignUp } from './pages/Auth.jsx';
import Chat from './pages/Chat.jsx';
import Result from './pages/Result.jsx';
import Booking from './pages/Booking.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DoctorQueue from './pages/DoctorQueue.jsx';
import Admin from './pages/Admin.jsx';

function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/signin" state={{ from: loc.pathname }} replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <AppShell>{children}</AppShell>;
}
const NotFound = () => (
  <div className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="text-4xl">Page not found</h1><a className="btn mt-6" href="/">Go home</a></div></div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />
      <Route path="/app" element={<Guard roles={['patient']}><Dashboard /></Guard>} />
      <Route path="/app/check" element={<Guard roles={['patient']}><Chat /></Guard>} />
      <Route path="/app/result/:id" element={<Guard roles={['patient']}><Result /></Guard>} />
      <Route path="/app/book/:triageId?" element={<Guard roles={['patient']}><Booking /></Guard>} />
      <Route path="/doctor" element={<Guard roles={['doctor', 'admin']}><DoctorQueue /></Guard>} />
      <Route path="/admin" element={<Guard roles={['admin']}><Admin /></Guard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
