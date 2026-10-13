import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImg from './assets/bg.jpg';
import kmitlLogo from './assets/KMITL.png';

// ใช้ path สั้นแบบ same-origin ผ่าน proxy ของ Vite (ดู vite.config.ts) ห้ามใช้ http://localhost/Project/... ตรงๆ
// เพราะเบราว์เซอร์จะมองเป็นคนละ origin (พอร์ต 5174 ต่อ 80) ทำให้ถูกบล็อกและคุกกี้ session ไม่ถูกส่งไปด้วย
const API_PROFILE = '/Project/api-profile.php';
const API_EDIT = '/Project/api-profile-edit.php';

// path รูปโปรไฟล์ต้องชี้ไปที่ Apache (/Project/...) ไม่ใช่เซิร์ฟเวอร์ของ Vite
function avatarSrc(u: any): string {
    const p: string = u?.image_account || '';
    if (p) return /^(https?:)?\//.test(p) ? p : `/Project/${p}`;
    const f: string = u?.images_account || '';
    return f ? `/Project/images/profile/${f}` : '/Project/images/Profile.png';
}

export default function ProfileEdit() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [currentImage, setCurrentImage] = useState('');

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    // โหลดข้อมูลปัจจุบันมาใส่ฟอร์ม (เดิมใส่ค่าตัวอย่างตายตัวไว้ในโค้ด)
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(API_PROFILE, { credentials: 'same-origin' });
                if (res.status === 401) { navigate('/login', { replace: true }); return; }
                const data = await res.json();
                const u = data.user ?? data.profile; // api-profile.php อาจส่งข้อมูลมาใน key user หรือ profile
                if (data.ok && u) {
                    setUsername(u.username_account ?? '');
                    setBio(u.bio_account ?? '');
                    setPhone(u.phone_account ?? '');
                    setDepartment(u.department_account ?? '');
                    setCurrentImage(avatarSrc(u));
                } else {
                    setMessage(data.message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
                }
            } catch {
                setMessage('เชื่อมต่อ API ไม่ได้ ตรวจว่า Apache/MySQL เปิดอยู่ และตั้ง proxy ใน vite.config.ts แล้ว');
            } finally {
                setLoaded(true);
            }
        })();
    }, [navigate]);

    // คืนหน่วยความจำของรูปตัวอย่างเมื่อเปลี่ยนรูปหรือออกจากหน้า
    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfileImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (!/^[0-9+\-\s]{0,20}$/.test(phone)) {
            setSuccess(false);
            setMessage('เบอร์โทรศัพท์ใช้ได้เฉพาะตัวเลข เครื่องหมาย + - และช่องว่าง (ไม่เกิน 20 ตัว)');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('username_account', username);
            formData.append('bio_account', bio);
            formData.append('phone_account', phone);
            formData.append('department_account', department);
            if (profileImage) formData.append('profile_image', profileImage);

            const response = await fetch(API_EDIT, { method: 'POST', body: formData, credentials: 'same-origin' });
            if (response.status === 401) { navigate('/login', { replace: true }); return; }

            let data: any;
            try {
                data = await response.json();
            } catch {
                // ได้ HTML กลับมาแทน JSON: มักเกิดจาก proxy ยังไม่ทำงาน หรือ PHP มี error (ดูแท็บ Network > Response)
                throw new Error('เซิร์ฟเวอร์ตอบกลับไม่ใช่ JSON (ตรวจ proxy และดูแท็บ Network > Response)');
            }

            setSuccess(!!data.ok);
            setMessage(data.message || (data.ok ? 'บันทึกเรียบร้อยแล้ว' : 'บันทึกไม่สำเร็จ'));
            if (data.ok) setTimeout(() => navigate('/profile'), 1500);
        } catch (err: any) {
            setSuccess(false);
            setMessage(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            setSaving(false);
        }
    };

    const inputCls =
        'w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent transition text-sm text-gray-800 bg-white/80';

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 font-sans relative"
            style={{ backgroundImage: `url(${bgImg})` }}
        >
            <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl overflow-hidden my-8">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <img src={kmitlLogo} alt="Watermark Logo" className="w-72 h-72 object-contain" />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">แก้ไขข้อมูลโปรไฟล์</h1>
                        <p className="text-sm text-gray-500 font-medium">อัปเดตชื่อ ประวัติ เบอร์โทร และรูปภาพของคุณ</p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm text-center font-medium ${success ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col items-center space-y-3 p-4 bg-gray-50/80 rounded-xl border border-gray-200">
                            <label className="block text-sm font-semibold text-gray-700 self-start">เปลี่ยนรูปโปรไฟล์</label>

                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#002046] shadow-md bg-white flex items-center justify-center">
                                {previewUrl || currentImage ? (
                                    <img src={previewUrl || currentImage} alt="Profile Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-gray-400 font-medium">รูปปัจจุบัน</span>
                                )}
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#002046] file:text-white hover:file:bg-[#001733] cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อผู้ใช้</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้ของคุณ" required maxLength={100} className={inputCls} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">ประวัติย่อ / Bio</label>
                            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="เล่าเกี่ยวกับตัวคุณสั้นๆ..." maxLength={255} className={`${inputCls} resize-none`} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทรศัพท์" className={inputCls} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">แผนก / ภาควิชา</label>
                            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="แผนกหรือภาควิชาของคุณ" maxLength={100} className={inputCls} />
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                            <button
                                type="submit"
                                disabled={!loaded || saving}
                                className="flex-1 py-3 bg-[#002046] text-white font-semibold rounded-lg hover:bg-[#001733] active:scale-[0.99] transition duration-150 shadow-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition text-sm"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}