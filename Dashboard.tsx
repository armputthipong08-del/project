import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

// ข้อมูลทั้งหมดในหน้านี้มาจาก MySQL ผ่าน api-dashboard.php (ตั้ง proxy '/Project' ใน vite.config.ts)
const API = '/Project/api-dashboard.php';

interface Task {
    id_task: number;
    title_task: string;
    status_task: string;
    due_task?: string | null;
    username_account?: string | null;
}

const statusLabel: Record<string, string> = { todo: 'รอดำเนินการ', doing: 'กำลังทำ', done: 'เสร็จแล้ว' };
const statusBadge = (s: string) =>
    s === 'done' ? 'bg-emerald-100 text-emerald-800' : s === 'doing' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';

// ---- Timeline: ช่วง 3 เดือน เริ่มจากเดือนปัจจุบัน ----
const monthStart = (offset: number) => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + offset, 1);
};
const WIN_START = monthStart(0);
const WIN_END = monthStart(3);
const MONTHS = [0, 1, 2].map(monthStart);
const monthLabel = (d: Date) => `${d.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${d.getFullYear()}`;

// แถบยาวไปถึงวันกำหนดส่ง (สีตามสถานะ / แดงถ้าเลยกำหนด)
function timelineBar(t: Task) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${t.due_task}T00:00:00`);
    const overdue = due < today && t.status_task !== 'done';
    const span = WIN_END.getTime() - WIN_START.getTime();
    const pct = Math.max(4, Math.min(100, ((due.getTime() - WIN_START.getTime()) / span) * 100));
    const color = overdue ? 'bg-rose-500/80' : t.status_task === 'doing' ? 'bg-amber-400/90' : 'bg-sky-500/70';
    return { pct, color, overdue };
}

const card = 'bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/80';

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        total_accounts: 0, total_admins: 0, total_members: 0,
        total_tasks: 0, completed_tasks: 0, ongoing_tasks: 0, todo_tasks: 0, overdue_tasks: 0,
    });
    const [recentTasks, setRecentTasks] = useState<Task[]>([]);
    const [upcoming, setUpcoming] = useState<Task[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(API, { credentials: 'same-origin' });
                if (res.status === 401) { navigate('/login', { replace: true }); return; }
                const data = await res.json();
                if (data.ok) {
                    setStats((prev) => ({ ...prev, ...data.stats }));
                    setRecentTasks(data.recent_tasks ?? []);
                    setUpcoming(data.upcoming_tasks ?? []);
                } else {
                    setError(data.message || 'โหลดข้อมูลไม่สำเร็จ');
                }
            } catch {
                setError('เชื่อมต่อ API ไม่ได้ ตรวจว่า Apache/MySQL เปิดอยู่ และตั้ง proxy ใน vite.config.ts แล้ว');
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    if (loading) {
        return (
            <Layout>
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/60 w-full text-center py-12 text-gray-700 font-semibold">
                    กำลังโหลดข้อมูล Dashboard...
                </div>
            </Layout>
        );
    }

    const total = stats.total_tasks;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    const progress = [
        { label: 'รอดำเนินการ', n: stats.todo_tasks, bar: 'bg-amber-500', text: 'text-amber-600' },
        { label: 'กำลังทำ', n: stats.ongoing_tasks, bar: 'bg-blue-500', text: 'text-blue-600' },
        { label: 'เสร็จแล้ว', n: stats.completed_tasks, bar: 'bg-emerald-500', text: 'text-emerald-600' },
    ];

    return (
        <Layout>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-white/60 w-full space-y-6">
                {error && <div className="rounded-xl p-3 text-sm font-medium bg-red-100 text-red-800">{error}</div>}

                {/* 1. สถิติภาพรวม (นับจากฐานข้อมูล) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`${card} p-5 space-y-2`}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">งานทั้งหมดในระบบ</p>
                        <h3 className="text-3xl font-extrabold text-[#002046]">{stats.total_tasks}</h3>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#002046] h-full rounded-full" style={{ width: total > 0 ? '100%' : '0%' }} />
                        </div>
                    </div>

                    <div className={`${card} p-5 space-y-2`}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">งานที่กำลังดำเนินการ</p>
                        <h3 className="text-3xl font-extrabold text-amber-600">{stats.ongoing_tasks}</h3>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct(stats.ongoing_tasks)}%` }} />
                        </div>
                    </div>

                    <div className={`${card} p-5 space-y-2`}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">งานที่เสร็จสิ้นแล้ว</p>
                        <h3 className="text-3xl font-extrabold text-emerald-600">{stats.completed_tasks}</h3>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct(stats.completed_tasks)}%` }} />
                        </div>
                    </div>

                    <div className={`${card} p-5 flex justify-between items-center`}>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">บุคลากรในระบบ</p>
                            <h3 className="text-3xl font-extrabold text-[#002046]">{stats.total_accounts}</h3>
                            <div className="text-xs text-gray-500 flex gap-2 pt-1 font-medium">
                                <span className="text-red-600 font-semibold">{stats.total_admins} Admin</span>
                                <span className="text-blue-600 font-semibold">{stats.total_members} Members</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Timeline (ซ้าย) และ ความคืบหน้า (ขวา) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={`lg:col-span-2 ${card} p-6 space-y-4`}>
                        <div className="flex justify-between items-center gap-3">
                            <h2 className="text-base font-bold text-gray-900">
                                กำหนดส่งงาน (Timeline)
                                {stats.overdue_tasks > 0 && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">เลยกำหนด {stats.overdue_tasks} งาน</span>
                                )}
                            </h2>
                            <button onClick={() => navigate('/timeline')} className="text-xs text-blue-600 font-semibold hover:underline shrink-0">
                                ดูทั้งหมด →
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-left text-sm min-w-[520px]">
                                <thead className="text-gray-400 border-b border-gray-200 text-xs uppercase">
                                    <tr>
                                        <th className="pb-3 font-semibold w-1/4">งาน</th>
                                        {MONTHS.map((m) => <th key={m.getTime()} className="pb-3 font-semibold w-1/4">{monthLabel(m)}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {upcoming.length === 0 ? (
                                        <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-sm">ไม่มีงานที่ค้างและมีกำหนดส่ง</td></tr>
                                    ) : upcoming.map((t) => {
                                        const b = timelineBar(t);
                                        return (
                                            <tr key={t.id_task}>
                                                <td className="py-3 pr-2">
                                                    <p className="font-semibold text-gray-900 truncate">{t.title_task}</p>
                                                    <p className="text-xs text-gray-400 truncate">{t.username_account || 'ยังไม่ระบุ'}</p>
                                                </td>
                                                <td colSpan={3} className="py-3">
                                                    <div className="relative h-3 bg-gray-100 rounded-full">
                                                        <div className={`absolute left-0 top-0 h-3 rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                                                    </div>
                                                    <p className={`text-xs mt-1 ${b.overdue ? 'text-rose-600 font-semibold' : 'text-gray-500'}`}>
                                                        ครบกำหนด {t.due_task}{b.overdue ? ' (เลยกำหนด)' : ''}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={`${card} p-6 space-y-4`}>
                        <div className="flex justify-between items-baseline">
                            <h2 className="text-base font-bold text-gray-900">ความคืบหน้างานทั้งหมด</h2>
                            <span className="text-2xl font-extrabold text-emerald-600">{pct(stats.completed_tasks)}%</span>
                        </div>
                        <div className="space-y-4 pt-2">
                            {progress.map((p) => (
                                <div key={p.label} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                                        <span>{p.label} ({p.n})</span>
                                        <span className={p.text}>{pct(p.n)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <div className={`${p.bar} h-full rounded-full`} style={{ width: `${pct(p.n)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. รายการงานล่าสุด (ซ้าย) และเมนูด่วน (ขวา) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={`lg:col-span-2 ${card} p-6 space-y-4`}>
                        <div className="flex justify-between items-center">
                            <h2 className="text-base font-bold text-gray-900">รายการงานล่าสุดในระบบ</h2>
                            <button onClick={() => navigate('/kanban')} className="text-xs text-blue-600 font-semibold hover:underline">
                                ไปหน้า Kanban →
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-400 border-b border-gray-200 text-xs uppercase">
                                    <tr>
                                        <th className="pb-3 font-semibold">ชื่องาน</th>
                                        <th className="pb-3 font-semibold">ผู้รับผิดชอบ</th>
                                        <th className="pb-3 font-semibold">สถานะ</th>
                                        <th className="pb-3 font-semibold">กำหนดส่ง</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {recentTasks.length > 0 ? (
                                        recentTasks.map((t) => (
                                            <tr key={t.id_task} className="hover:bg-gray-50/50 transition">
                                                <td className="py-3 font-semibold text-gray-900">{t.title_task}</td>
                                                <td className="py-3 text-gray-600">{t.username_account || 'ยังไม่ระบุ'}</td>
                                                <td className="py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(t.status_task)}`}>
                                                        {statusLabel[t.status_task] || t.status_task || 'รอดำเนินการ'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-gray-500 text-xs">{t.due_task || '-'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-gray-400 text-sm">ยังไม่มีข้อมูลงานในระบบ</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={`${card} p-6 space-y-4`}>
                        <h2 className="text-base font-bold text-gray-900">เมนูด่วน (Quick Actions)</h2>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => navigate('/admin')} className="w-full py-3 px-4 bg-[#002046] hover:bg-[#001733] text-white font-semibold rounded-xl text-sm transition shadow-md">
                                จัดการระบบ / มอบหมายงาน
                            </button>
                            <button onClick={() => navigate('/kanban')} className="w-full py-3 px-4 bg-white/70 hover:bg-white text-gray-800 font-semibold rounded-xl text-sm transition border border-gray-200 shadow-sm">
                                ดูบอร์ด Kanban
                            </button>
                            <button onClick={() => navigate('/timeline')} className="w-full py-3 px-4 bg-white/70 hover:bg-white text-gray-800 font-semibold rounded-xl text-sm transition border border-gray-200 shadow-sm">
                                ดูไทม์ไลน์โครงการ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}