import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

// 1. วางฟังก์ชัน avatarUrl ไว้ด้านนอกคอมโพเนนต์
function avatarUrl(p: any): string | null {
    const raw = String(p?.images_account || p?.image_account || p?.profile_image || p?.image || '');
    if (!raw) return null;
    if (/^(https?:)?\/\//.test(raw) || raw.startsWith('/')) return raw;
    if (raw.startsWith('images/')) return `/Project/${raw}`;
    return `/Project/images/profile/${raw}`;
}

export default function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>({});
    const [userTasks, setUserTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // State สำหรับจัดการสมาชิกในแต่ละงาน
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<any>(null);
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [selectedMember, setSelectedMember] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/Project/api-profile.php', { credentials: 'include' }).then(res => {
                if (res.status === 401) {
                    navigate('/login', { replace: true });
                    return null;
                }
                return res.json().catch(() => ({}));
            }),
            fetch('/Project/api-dashboard.php', { credentials: 'include' }).then(res => res.json().catch(() => ({})))
        ])
        .then(([profileRes, dashboardRes]) => {
            if (profileRes) {
                const profileData = profileRes.profile || profileRes.user || profileRes;
                setProfile(profileData || {});
                
                const tasks = (profileRes.tasks || dashboardRes?.recent_tasks || dashboardRes?.tasks || []).map((t: any) => ({
                    ...t,
                    members: t.members || [] 
                }));
                setUserTasks(tasks);
            }
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, [navigate]);

    // เปิด Modal จัดการสมาชิกของงานนั้นๆ พร้อมกรองเอา Admin ออก
    const handleOpenTaskModal = (task: any) => {
        setCurrentTask(task);
        setIsTaskModalOpen(true);
        fetch('/Project/api-get-users.php', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    const rawMembers = Array.isArray(data) ? data : data.users || [];
                    const filteredMembers = rawMembers.filter((m: any) => {
                        const role = (m.role_account || m.role || '').toLowerCase();
                        return role !== 'admin';
                    });
                    setAllMembers(filteredMembers);
                }
            })
            .catch(err => console.error('Failed to fetch members', err));
    };

    // เพิ่มสมาชิกเข้างาน
    const handleAddMemberToTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember || !currentTask) return;

        if (currentTask.members.includes(selectedMember)) {
            alert('สมาชิกนี้อยู่ในงานนี้แล้ว');
            return;
        }

        const updatedTasks = userTasks.map(t => {
            if ((t.id_task && t.id_task === currentTask.id_task) || t === currentTask) {
                return { ...t, members: [...t.members, selectedMember] };
            }
            return t;
        });

        setUserTasks(updatedTasks);
        setCurrentTask({ ...currentTask, members: [...currentTask.members, selectedMember] });
        setSelectedMember('');
    };

    // ลบสมาชิกออกจากงาน
    const handleRemoveMemberFromTask = (memberName: string) => {
        if (!currentTask) return;
        const updatedMembers = currentTask.members.filter((m: string) => m !== memberName);
        
        const updatedTasks = userTasks.map(t => {
            if ((t.id_task && t.id_task === currentTask.id_task) || t === currentTask) {
                return { ...t, members: updatedMembers };
            }
            return t;
        });

        setUserTasks(updatedTasks);
        setCurrentTask({ ...currentTask, members: updatedMembers });
    };

    if (loading) {
        return (
            <Layout>
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/65 w-full text-center py-12 text-gray-700 font-semibold">
                    กำลังโหลดข้อมูลโปรไฟล์...
                </div>
            </Layout>
        );
    }

    const username = profile.username || profile.username_account || profile.name || 'ผู้ใช้งานระบบ';
    const email = profile.email || profile.email_account || 'ยังไม่ได้ระบุอีเมล';
    const role = profile.role || profile.role_account || 'MEMBER';
    const faculty = profile.faculty || profile.faculty_account || 'วิศวกรรมหุ่นยนต์';
    const phone = profile.phone || profile.phone_account || 'ยังไม่ได้ระบุเบอร์โทรศัพท์';
    const bio = profile.bio || profile.bio_account || '';
    
    // 2. เรียกใช้งานฟังก์ชัน avatarUrl เพื่อแปลง path รูปภาพ
    const img = avatarUrl(profile);

    return (
        <Layout>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-white/65 w-full space-y-6 relative">
                
                {/* 1. ส่วนข้อมูลโปรไฟล์หลัก */}
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-100/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-md flex items-center justify-center text-xl font-bold text-slate-600">
                            {/* 3. นำตัวแปร img มาตรวจสอบและแสดงผล */}
                            {img ? (
                                <img 
                                    src={img} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => (e.currentTarget.style.display = 'none')} 
                                />
                            ) : (
                                username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-extrabold text-gray-900">{username}</h2>
                            <p className="text-sm text-gray-500">{email}</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    role.toLowerCase() === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {role.toUpperCase()}
                                </span>
                                {bio && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        {bio}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/profile/edit')}
                        className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-md"
                    >
                        แก้ไขโปรไฟล์
                    </button>
                </div>

                {/* 2. ข้อมูลคณะและเบอร์โทรศัพท์ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-gray-100/80 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase">คณะ / สาขา</p>
                        <p className="text-base font-bold text-gray-800">{faculty}</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-gray-100/80 space-y-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase">เบอร์โทรศัพท์</p>
                        <p className="text-base font-bold text-gray-800">{phone}</p>
                    </div>
                </div>

                {/* 3. งานที่ได้รับมอบหมาย (สรุปจำนวน) */}
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-sm border border-gray-100/80 space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">งานที่ได้รับมอบหมายทั้งหมด</p>
                    <h3 className="text-3xl font-extrabold text-[#002046]">{userTasks.length}</h3>
                </div>

                {/* 4. รายการงานของฉัน */}
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-100/80 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-base font-bold text-gray-900">รายการงานของฉัน</h2>
                        <button onClick={() => navigate('/kanban')} className="text-xs text-blue-600 font-semibold hover:underline">
                            ไปหน้า Kanban →
                        </button>
                    </div>

                    <div className="space-y-4">
                        {userTasks.length > 0 ? (
                            userTasks.map((task, index) => (
                                <div key={task.id_task || index} className="p-4 rounded-xl bg-white/60 border border-gray-200 space-y-3 shadow-xs">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900">{task.title_task || task.title}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            task.status_task === 'Completed' || task.status_task === 'เสร็จสิ้น'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {task.status_task || task.status || 'รอดำเนินการ'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{task.detail_task || task.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
                                    
                                    {/* แสดงรายชื่อสมาชิกในงานนี้ */}
                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                                        <span className="text-xs font-semibold text-gray-500">สมาชิกในงาน:</span>
                                        {task.members && task.members.length > 0 ? (
                                            task.members.map((m: string, i: number) => (
                                                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                                                    {m}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400">ยังไม่มีสมาชิก</span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-1 text-xs text-gray-500">
                                        <span>กำหนดส่ง: {task.due_task || task.due_date || '-'}</span>
                                        <button 
                                            onClick={() => handleOpenTaskModal(task)}
                                            className="py-1.5 px-3 bg-[#002046] hover:bg-[#001733] text-white font-semibold rounded-lg text-xs transition shadow-sm"
                                        >
                                            + / - สมาชิกในงาน
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">
                                ยังไม่มีรายการงานที่ได้รับมอบหมาย
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal จัดการสมาชิกประจำงาน */}
            {isTaskModalOpen && currentTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-900">
                                จัดการสมาชิก: {currentTask.title_task || currentTask.title}
                            </h3>
                            <button 
                                onClick={() => setIsTaskModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* ฟอร์มเลือกและเพิ่มสมาชิก (กรอง Admin ออกแล้ว) */}
                        <form onSubmit={handleAddMemberToTask} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">เพิ่มสมาชิกเข้างานนี้ (เฉพาะ Member)</label>
                                <div className="flex gap-2">
                                    <select 
                                        value={selectedMember} 
                                        onChange={(e) => setSelectedMember(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] text-sm bg-gray-50 text-gray-800"
                                    >
                                        <option value="">-- เลือกสมาชิก --</option>
                                        {allMembers.length > 0 ? (
                                            allMembers.map((m: any, idx: number) => {
                                                const memberName = m.username_account || m.username;
                                                return (
                                                    <option key={m.id_account || idx} value={memberName}>
                                                        {memberName}
                                                    </option>
                                                );
                                            })
                                        ) : (
                                            <option value="" disabled>ไม่พบสมาชิกทั่วไปในระบบ...</option>
                                        )}
                                    </select>
                                    <button 
                                        type="submit"
                                        className="py-2 px-4 bg-[#002046] hover:bg-[#001733] text-white font-semibold rounded-xl text-sm transition shadow-md whitespace-nowrap"
                                    >
                                        เพิ่ม
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* รายชื่อสมาชิกที่มีอยู่ในงานนี้ (กดลบออกได้) */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <label className="block text-xs font-semibold text-gray-600 uppercase">สมาชิกในงานปัจจุบัน</label>
                            <div className="max-h-40 overflow-y-auto space-y-1.5">
                                {currentTask.members && currentTask.members.length > 0 ? (
                                    currentTask.members.map((memberName: string, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                                            <span className="font-medium text-gray-800">{memberName}</span>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveMemberFromTask(memberName)}
                                                className="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2 py-1 bg-rose-50 rounded-lg transition"
                                            >
                                                ลบออก
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-3">ยังไม่มีสมาชิกในงานนี้</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                type="button"
                                onClick={() => setIsTaskModalOpen(false)}
                                className="py-2 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition"
                            >
                                เสร็จสิ้น
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}