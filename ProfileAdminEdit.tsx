import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import kmitlLogo from './assets/KMITL.png';

export default function ProfileAdminEdit() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('66200188@kmitl.ac.th');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [currentImage, setCurrentImage] = useState('');
    
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    // ดึงข้อมูลโปรไฟล์แอดมินปัจจุบันมาแสดงในฟอร์ม
    useEffect(() => {
        fetch('/Project/api-admin.php')
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.admin) {
                    setUsername(data.admin.username_account || '');
                    setEmail(data.admin.email_account || '66200188@kmitl.ac.th');
                    setBio(data.admin.bio_account || '');
                    setPhone(data.admin.phone_account || '');
                    setDepartment(data.admin.department_account || '');
                    setCurrentImage(data.admin.images_account || '');
                }
            })
            .catch(() => console.log('ไม่สามารถโหลดข้อมูลโปรไฟล์เดิมได้'));
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('email_account', email);
            formData.append('username_account', username);
            formData.append('bio_account', bio);
            formData.append('phone_account', phone);
            formData.append('department_account', department);
            
            if (profileImage) {
                formData.append('profile_image', profileImage);
            }

            const response = await fetch('/Project/api-admin-profile-update.php', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setSuccess(data.ok);
            setMessage(data.message);

            if (data.ok) {
                setTimeout(() => {
                    navigate('/admin');
                }, 1200);
            }
        } catch (err) {
            setSuccess(false);
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        }
    };

    const displayImg = previewUrl || (currentImage ? `/Project/images/profile/${currentImage}` : null);

    return (
        <Layout>
            <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-white/60 space-y-6">
                
                <div className="border-b border-gray-200/60 pb-4">
                    <h1 className="text-xl font-bold text-gray-900">แก้ไขโปรไฟล์ Admin</h1>
                    <p className="text-sm text-gray-500">อัปเดตข้อมูลส่วนตัวและรูปโปรไฟล์ผู้ดูแลระบบ</p>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm font-medium text-center ${success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-gray-200/60">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#002046] bg-white flex-shrink-0">
                            {displayImg ? (
                                <img src={displayImg} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = kmitlLogo; }} />
                            ) : (
                                <img src={kmitlLogo} alt="Default" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-400">อีเมล (ไม่สามารถเปลี่ยนได้)</p>
                            <p className="text-sm font-bold text-gray-800">{email}</p>
                            <div className="mt-2">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#002046] file:text-white hover:file:bg-[#001733] cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อผู้ใช้</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] text-sm bg-white/80"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">คณะ / สาขา</label>
                        <input 
                            type="text" 
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] text-sm bg-white/80"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                        <input 
                            type="text" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] text-sm bg-white/80"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Bio / ประวัติย่อ</label>
                        <textarea 
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] text-sm bg-white/80 resize-none"
                        />
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                        <button 
                            type="submit"
                            className="flex-1 py-2.5 bg-[#002046] text-white font-semibold rounded-lg hover:bg-[#001733] transition text-sm shadow-md"
                        >
                            บันทึก
                        </button>
                        <button 
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition text-sm"
                        >
                            ยกเลิก
                        </button>
                    </div>

                </form>

            </div>
        </Layout>
    );
}