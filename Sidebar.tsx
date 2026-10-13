import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false); // สำหรับเปิด/ปิดเมนูบนมือถือหรือจอเล็ก
    const [isCollapsed, setIsCollapsed] = useState(false); // สำหรับย่อ/ขยาย Sidebar บนจอใหญ่เมื่อคลิก RIE System
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 950);
    const location = useLocation();
    const navigate = useNavigate();

    // ตรวจสอบขนาดหน้าจอ 950px แบบ Real-time
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 950);
            if (window.innerWidth > 950) {
                setIsOpen(false); 
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ตรวจสอบสิทธิ์ Admin จาก LocalStorage / SessionStorage
    const getUserRole = () => {
        try {
            const savedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
            return (savedUser.role || savedUser.role_account || '').toLowerCase();
        } catch {
            return '';
        }
    };

    const role = getUserRole();
    const isAdmin = role === 'admin';
    const profilePath = isAdmin ? '/admin-profile' : '/profile';

    // รายการเมนูทั้งหมด
    const menuItems = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Profile', path: profilePath },
        { name: 'Members', path: '/members' },
        { name: 'Kanban', path: '/kanban' },
        { name: 'Timeline', path: '/timeline' },
    ];

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + '/');

    const handleLogout = async () => {
        setIsOpen(false);
        try {
            await fetch('/Project/logout.php', { credentials: 'same-origin' });
        } catch {}
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login', { replace: true });
    };

    return (
        <>
            {isMobile ? (
                /* ================= 📱 หน้าจอขนาด <= 950px (ย้ายไปอยู่ด้านบน) ================= */
                <header className="bg-white/80 backdrop-blur-md text-slate-800 px-6 py-4 shadow-md sticky top-0 z-50 border-b border-white/60">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-lg text-[#002046]">
                            RIE System
                        </div>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg hover:bg-slate-200/50 focus:outline-none transition"
                            aria-label="Toggle Menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* เมนูดรอปดาวน์เมื่อกดเปิดบนจอเล็ก */}
                    {isOpen && (
                        <nav className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-2.5 rounded-xl font-medium transition ${
                                        isActive(item.path)
                                            ? 'bg-slate-300 text-slate-900 font-semibold shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <Link
                                to="/settings"
                                onClick={() => setIsOpen(false)}
                                className={`block px-4 py-2.5 rounded-xl font-medium transition ${
                                    isActive('/settings')
                                        ? 'bg-slate-300 text-slate-900 font-semibold shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                Setting ตั้งค่าระบบ
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 rounded-xl font-medium text-red-600 hover:bg-red-500/10 transition"
                            >
                                ออกจากระบบ
                            </button>
                        </nav>
                    )}
                </header>
            ) : (
                /* ================= 💻 หน้าจอขนาด > 950px (อยู่ด้านซ้าย ย่อ/ขยายได้เมื่อคลิก RIE System) ================= */
                <>
                    {/* พื้นที่เว้นว่างด้านข้างตามขนาดของ Sidebar ที่ย่อหรือขยาย */}
                    <div className={`hidden md:block transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} shrink-0`} aria-hidden="true" />

                    <aside
                        className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-20' : 'w-64'} bg-white/70 backdrop-blur-xl text-slate-800 flex flex-col justify-between p-6 transform transition-all duration-300 ease-in-out border-r border-white/80 shadow-xl`}
                    >
                        <div className="space-y-8">
                            {/* คลิกที่ RIE System เพื่อย่อ/ขยาย Sidebar */}
                            <div 
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="hidden md:block text-xl font-extrabold tracking-wider px-3 text-[#002046] cursor-pointer select-none hover:opacity-80 transition truncate"
                                title="คลิกเพื่อย่อ/ขยายเมนู"
                            >
                                {isCollapsed ? 'RIE' : 'RIE System'}
                            </div>

                            <nav className="space-y-2">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        title={isCollapsed ? item.name : ''}
                                        className={`block px-4 py-3 rounded-xl font-medium transition truncate ${
                                            isActive(item.path)
                                                ? 'bg-slate-300 text-slate-900 font-semibold shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                        }`}
                                    >
                                        {isCollapsed ? item.name.charAt(0) : item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <div className="space-y-2 pt-6 border-t border-slate-200/60">
                            <Link
                                to="/settings"
                                title={isCollapsed ? 'Setting' : ''}
                                className={`block px-4 py-3 rounded-xl font-medium transition truncate ${
                                    isActive('/settings')
                                        ? 'bg-slate-300 text-slate-900 font-semibold shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                {isCollapsed ? '⚙️' : 'Setting ตั้งค่าระบบ'}
                            </Link>
                            <button
                                onClick={handleLogout}
                                title={isCollapsed ? 'ออกจากระบบ' : ''}
                                className="w-full text-left px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-500/10 transition truncate"
                            >
                                {isCollapsed ? '🚪' : 'ออกจากระบบ'}
                            </button>
                        </div>
                    </aside>
                </>
            )}
        </>
    );
}