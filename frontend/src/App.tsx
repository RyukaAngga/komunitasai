import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import { ChatUser } from '@/pages/ChatUser';
import { AboutPage } from '@/pages/AboutPage';
import { AllReports } from '@/pages/AllReports';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminGuard } from '@/components/AdminGuard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ToastProvider } from '@/components/ui/toast';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/konsultasi" element={
            <ProtectedRoute>
              <ChatUser />
            </ProtectedRoute>
          } />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/all-reports" element={
            <ProtectedRoute>
              <AllReports />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/admin" element={
            <AdminGuard>
              <AdminDashboard />
            </AdminGuard>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;

