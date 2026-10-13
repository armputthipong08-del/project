import Sidebarbase from './Sidebarbase';

// เมนูของสมาชิก: เหมือนของ admin แต่มี "สมาชิกทั้งหมด" เพิ่ม
export default function SidebarMember() {
  return (
    <Sidebarbase
      items={[
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/profile', label: 'Profile' },
        { to: '/members', label: 'สมาชิกทั้งหมด' },
        { to: '/kanban', label: 'Kanban' },
        { to: '/timeline', label: 'Timeline' },
      ]}
      bottom={[{ to: '/settings', label: 'Setting ของระบบ' }]}
    />
  );
}