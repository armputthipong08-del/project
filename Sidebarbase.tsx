import { NavLink, useNavigate } from 'react-router-dom';

export type NavItem = { to: string; label: string };

const base = 'block rounded-lg px-3 py-2.5 text-sm transition';
const idle = 'text-slate-200 hover:bg-slate-700 hover:text-white';
const active = 'bg-slate-700 text-white';

// เมนูซ้าย: ความกว้างคงที่ w-52 + shrink-0 (ถ้าไม่ใส่ เมนูจะขยายเต็มแถวแล้วดันเนื้อหาลงล่าง)
export default function SidebarBase({ items, bottom }: { items: NavItem[]; bottom?: NavItem[] }) {
  const navigate = useNavigate();

  async function logout() {
    try {
      await fetch('/Project/logout.php', { credentials: 'same-origin' }); // ให้ PHP ล้าง session
    } catch {
      /* ไม่เป็นไร ไปหน้าล็อกอินต่อ */
    }
    navigate('/login', { replace: true });
  }

  return (
    <aside className="w-full md:w-52 shrink-0 md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:max-w-xl flex flex-col justify-between rounded-xl bg-slate-800 p-3 font-sans">
      <nav className="flex flex-col gap-1.5">
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
            {i.label}
          </NavLink>
        ))}
      </nav>

      <nav className="flex flex-col gap-1.5 border-t border-slate-700 pt-3 mt-3">
        {(bottom ?? []).map((i) => (
          <NavLink key={i.to} to={i.to} className={({ isActive }) => `${base} ${isActive ? active : idle}`}>
            {i.label}
          </NavLink>
        ))}
        <button type="button" onClick={logout} className={`${base} w-full text-left text-red-300 hover:bg-slate-700`}>
          ออกจากระบบ
        </button>
      </nav>
    </aside>
  );
}