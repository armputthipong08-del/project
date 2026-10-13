import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './Errorboundary'; // ชื่อไฟล์ตรงกับของคุณ (Errorboundary.tsx) ถ้าเปลี่ยนชื่อไฟล์เป็น ErrorBoundary.tsx ให้แก้ตรงนี้ด้วย

import Login from './Login';
import Register from './Register';
import ResetPassword from './ResetPassword';

import Dashboard from './Dashboard';
import Kanban from './Kanban';
import Timeline from './Timeline';
import Placeholder from './Placeholder';

import ProfileMember from './ProfileMember';
import ProfileEdit from './ProfileEdit';

import ProfileAdminEdit from './ProfileAdminEdit';
import AdminProfile from './AdminProfile.tsx';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/members" element={<Placeholder title="สมาชิกทั้งหมด" />} />
          <Route path="/settings" element={<Placeholder title="Setting ของระบบ" />} />

          <Route path="/profile" element={<ProfileMember />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />

          <Route path="/admin-profile" element={<AdminProfile />} />
          <Route path="/admin/profile-edit" element={<ProfileAdminEdit />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;