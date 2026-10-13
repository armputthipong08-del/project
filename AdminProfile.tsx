import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import kmitlLogo from './assets/KMITL.png';

const API = '/Project/api-admin.php';

interface UserAccount {
    id_account: number;
    username_account: string;
    email_account: string;
    phone_account?: string | null;
    role_account: string;
    images_account?: string | null;
    department_account?: string | null;
    bio_account?: string | null;
}

interface RecentTask {
    id_task: number;
    title_task: string;
    due_task?: string | null;
    is_leader_task: number | string;
    username_account: string;
}

const box = 'bg-white/70 rounded-xl shadow-sm border border-gray-100';
const field = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#002046]';

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

    const [admin, setAdmin] = useState<UserAccount | null>(null);
    const [stats, setStats] = useState({ total_accounts: 0, total_admins: 0, total_members: 0 });
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_filtered: 0 });
    const [assignees, setAssignees] = useState<{ id_account: number; username_account: string }[]>([]);
    const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState({ username: '', email: '', role: 'member' });
    const [newPassword, setNewPassword] = useState('');

    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [assignee, setAssignee] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isHeadTask, setIsHeadTask] = useState(false);

    const fetchData = useCallback(async (page = 1, search = searchTerm, role = roleFilter) => {
        try {
            const res = await fetch(`${API}?page=${page}&search=${encodeURIComponent(search)}&role=${encodeURIComponent(role)}`, { credentials: 'same-origin' });
            if (res.status === 401) { navigate('/login', { replace: true }); return; }
            if (res.status === 403) { navigate('/profile', { replace: true }); return; }
            const data = await res.json();
            if (data.ok) {
                setAdmin(data.admin);
                setStats(data.stats);
                setUsers(data.accounts ?? []);
                setPagination(data.pagination);
                setAssignees(data.users_task ?? []);
                setRecentTasks(data.recent_tasks ?? []);
                setError('');
            } else {
                setError(data.message || 'โหลดข้อมูลไม่สำเร็จ');
            }
        } catch {
            setError('เชื่อมต่อ API ไม่ได้ ตรวจว่า Apache/MySQL เปิดอยู่ และตั้ง proxy ใน vite.config.ts แล้ว');
        } finally {
            setLoading(false);
        }
    }, [navigate, searchTerm, roleFilter]);

    useEffect(() => { fetchData(); }, []);

    async function send(fields: Record<string, string>): Promise<boolean> {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
        try {
            const res = await fetch(API, { method: 'POST', body: fd, credentials: 'same-origin' });
            if (res.status === 401) { navigate('/login', { replace: true }); return false; }
            const data = await res.json();
            setMessage({ text: data.message || '', ok: !!data.ok });
            return !!data.ok;
        } catch {
            setMessage({ text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', ok: false });
            return false;
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(1, searchTerm, roleFilter);
    };

    const startEdit = (u: UserAccount) => {
        setEditingId(u.id_account);
        setDraft({ username: u.username_account, email: u.email_account, role: u.role_account });
        setNewPassword('');
    };

    const saveEdit = async (id: number) => {
        const ok = await send({ action: 'update_account', id_account: String(id), username_account: draft.username, email_account: draft.email, role_account: draft.role });
        if (ok) setEditingId(null);
        fetchData(pagination.current_page);
    };

    const deleteUser = async (id: number) => {
        if (!confirm('คุณต้องการลบบัญชีนี้จริงหรือไม่?')) return;
        await send({ action: 'delete_account', id_account: String(id) });
        setEditingId(null);
        fetchData(pagination.current_page);
    };

    const resetPassword = async (id: number) => {
        if (newPassword.length < 6) { setMessage({ text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', ok: false }); return; }
        if (await send({ action: 'reset_password', id_account: String(id), new_password: newPassword })) setNewPassword('');
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const fields: Record<string, string> = { action: 'assign_task', title_task: taskTitle, detail_task: taskDesc, assignee_task: assignee };
        if (dueDate) fields.due_task = dueDate;
        if (isHeadTask) fields.is_leader_task = '1';
        if (await send(fields)) {
            setTaskTitle(''); setTaskDesc(''); setAssignee(''); setDueDate(''); setIsHeadTask(false);
        }
        fetchData(pagination.current_page);
    };

    const deleteTask = async (id: number) => {
        if (!confirm('ลบงานนี้ใช่หรือไม่?')) return;
        await send({ action: 'delete_task', id_task: String(id) });
        fetchData(pagination.current_page);
    };

    if (loading) return <Layout><div className="p-6 text-center">กำลังโหลดข้อมูลแดชบอร์ด...</div></Layout>;
    if (!admin) return <Layout><div className="p-6 text-center text-red-600">{error || 'ไม่พบข้อมูล'}</div></Layout>;

    const adminImg = admin.images_account ? `/Project/images/profile/${admin.images_account}` : kmitlLogo;
    const csvHref = `${API}?action=export_csv&search=${encodeURIComponent(searchTerm)}&role=${encodeURIComponent(roleFilter)}`;
    const roleBadge = (r: string) => (r.toLowerCase() === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700');

    return (
        <Layout>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-white/60 space-y-6 w-full">
                {(message || error) && (
                    <div className={`rounded-xl p-3 text-sm font-medium ${message?.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message?.text || error}
                    </div>
                )}

                {/* 1. โปรไฟล์ Admin */}
                <div className="bg-white/80 p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full border-2 border-[#002046] overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                                src={adminImg}
                                alt="Admin Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.src = kmitlLogo; }}
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{admin.username_account} (Admin)</h2>
                            <p className="text-sm text-gray-500">{admin.email_account}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 uppercase rounded-full">{admin.role_account}</span>
                                {admin.department_account && (
                                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">{admin.department_account}</span>
                                )}
                                {admin.phone_account && (
                                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">โทร {admin.phone_account}</span>
                                )}
                            </div>
                            {admin.bio_account && <p className="text-xs text-gray-500 mt-2">{admin.bio_account}</p>}
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin/profile-edit')}
                        className="px-5 py-2.5 bg-[#002046] text-white text-sm font-semibold rounded-lg hover:bg-[#001733] transition shadow-md whitespace-nowrap"
                    >
                        แก้ไขโปรไฟล์ Admin
                    </button>
                </div>

                {/* 2. สถิติ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        ['สมาชิกทั้งหมด', stats.total_accounts],
                        ['Admin', stats.total_admins],
                        ['Member', stats.total_members],
                    ].map(([label, value]) => (
                        <div key={label as string} className={`${box} p-5 text-center`}>
                            <p className="text-xs font-semibold text-gray-500">{label}</p>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-[#002046] mt-1">{value}</h3>
                        </div>
                    ))}
                </div>

                {/* 3. รายการบัญชี + เมนูงาน */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4 min-w-0">
                        <div className={`${box} p-5 space-y-4`}>
                            <h2 className="text-lg font-bold text-gray-900">รายการบัญชีผู้ใช้</h2>

                            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-[#002046] bg-white/80"
                                    />
                                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white/80">
                                        <option value="">ทั้งหมด</option>
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
                                    </select>
                                    <button type="submit" className="px-4 py-2 bg-[#002046] text-white rounded-lg text-sm font-semibold hover:bg-[#001733] transition">ค้นหา</button>
                                </div>
                                <a href={csvHref} className="text-blue-600 hover:underline text-sm font-semibold self-end sm:self-auto">ดาวน์โหลด CSV</a>
                            </form>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[640px]">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                                            <th className="py-3 px-3">ชื่อผู้ใช้</th>
                                            <th className="py-3 px-3">อีเมล</th>
                                            <th className="py-3 px-3">เบอร์โทร</th>
                                            <th className="py-3 px-3">บทบาท</th>
                                            <th className="py-3 px-3">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {users.length === 0 ? (
                                            <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">ไม่พบรายการบัญชีผู้ใช้</td></tr>
                                        ) : users.map((u) => {
                                            const editing = editingId === u.id_account;
                                            return (
                                                <React.Fragment key={u.id_account}>
                                                    <tr className="hover:bg-white/50 transition align-top">
                                                        <td className="py-3 px-3 font-semibold text-gray-900">
                                                            {editing ? <input className={field} value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} /> : u.username_account}
                                                        </td>
                                                        <td className="py-3 px-3 text-gray-600">
                                                            {editing ? <input className={field} type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /> : u.email_account}
                                                        </td>
                                                        <td className="py-3 px-3 text-gray-600">{u.phone_account || '-'}</td>
                                                        <td className="py-3 px-3">
                                                            {editing ? (
                                                                <select className={field} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
                                                                    <option value="member">member</option>
                                                                    <option value="admin">admin</option>
                                                                </select>
                                                            ) : (
                                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${roleBadge(u.role_account)}`}>{u.role_account}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            {editing ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    <button onClick={() => saveEdit(u.id_account)} className="text-xs bg-green-600 text-white px-3 py-1 rounded">บันทึก</button>
                                                                    {u.id_account !== admin.id_account && (
                                                                        <button onClick={() => deleteUser(u.id_account)} className="text-xs bg-red-600 text-white px-3 py-1 rounded">ลบ</button>
                                                                    )}
                                                                    <button onClick={() => setEditingId(null)} className="text-xs bg-gray-200 text-gray-800 px-3 py-1 rounded">ยกเลิก</button>
                                                                </div>
                                                            ) : (
                                                                <button onClick={() => startEdit(u)} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded transition">แก้ไข</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {editing && (
                                                        <tr className="bg-gray-50/80">
                                                            <td colSpan={5} className="py-2 px-3">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <input type="password" minLength={6} placeholder="รหัสผ่านใหม่" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`${field} !w-44`} />
                                                                    <button onClick={() => resetPassword(u.id_account)} className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded">รีเซ็ตรหัสผ่าน</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2">
                                {pagination.current_page > 1 && <button onClick={() => fetchData(pagination.current_page - 1)} className="text-blue-600">ก่อนหน้า</button>}
                                <span>หน้า {pagination.current_page} จาก {pagination.total_pages} ({pagination.total_filtered} รายการ)</span>
                                {pagination.current_page < pagination.total_pages && <button onClick={() => fetchData(pagination.current_page + 1)} className="text-blue-600">ถัดไป</button>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`${box} p-5 space-y-4`}>
                            <h2 className="text-lg font-bold text-gray-900">เมนูงาน</h2>
                            <form onSubmit={handleCreateTask} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่องาน</label>
                                    <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className={field} placeholder="กรอกชื่องาน..." required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">รายละเอียด</label>
                                    <textarea rows={3} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className={`${field} resize-none`} placeholder="รายละเอียดงาน..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">มอบหมายให้</label>
                                    <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={field} required>
                                        <option value="">เลือกผู้รับงาน</option>
                                        {assignees.map((u) => (<option key={u.id_account} value={u.id_account}>{u.username_account}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">กำหนดส่ง</label>
                                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} />
                                </div>
                                <div className="flex items-center space-x-2 pt-1">
                                    <input type="checkbox" id="headTask" checked={isHeadTask} onChange={(e) => setIsHeadTask(e.target.checked)} className="w-4 h-4" />
                                    <label htmlFor="headTask" className="text-xs text-gray-700 select-none">ตั้งเป็นหัวหน้างาน</label>
                                </div>
                                <button type="submit" className="w-full py-2.5 bg-[#002046] text-white font-semibold rounded-lg hover:bg-[#001733] transition text-sm shadow-md mt-2">มอบหมายงาน</button>
                            </form>
                        </div>

                        <div className={`${box} p-5 space-y-2`}>
                            <h2 className="text-base font-bold text-gray-900">งานล่าสุด</h2>
                            {recentTasks.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีรายการงานล่าสุด</p>
                            ) : (
                                <ul className="space-y-2">
                                    {recentTasks.map((t) => (
                                        <li key={t.id_task} className="border border-gray-200 rounded-lg p-2 text-sm flex justify-between items-start gap-2 bg-white/80">
                                            <Link to={`/kanban?task=${t.id_task}`} className="min-w-0 hover:text-blue-700">
                                                <p className="font-semibold truncate">{t.title_task}</p>
                                                <p className="text-xs text-gray-500">
                                                    {t.username_account} {Number(t.is_leader_task) === 1 ? '(หัวหน้างาน)' : ''}
                                                    {t.due_task ? ` · ส่ง ${t.due_task}` : ''}
                                                </p>
                                            </Link>
                                            <button onClick={() => deleteTask(t.id_task)} className="shrink-0 bg-red-500 text-white px-2 py-1 rounded text-xs">ลบ</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}