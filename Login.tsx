import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bgImg from './assets/bg.jpg';
import kmitlLogo from './assets/KMITL.png';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('email_account', email);
            formData.append('password_account', password);

            // แก้ไขตรงนี้: ใส่ URL เต็มของ XAMPP Apache เพื่อป้องกันปัญหา 404 จาก Vite
            const response = await fetch('http://localhost/Project/process-login.php', {
                method: 'POST',
                body: formData,
                credentials: 'include' // สำคัญเพื่อให้ส่ง Session ข้ามพอร์ตได้
            });

            const data = await response.json();
            setSuccess(data.ok);
            setMessage(data.message);

            if (data.ok) {
                // บันทึกข้อมูลลง localStorage เพื่อให้ Sidebar และระบบอื่นอ่านค่าสิทธิ์ได้
                localStorage.setItem('user', JSON.stringify(data));

                setTimeout(() => {
                    const role = data.role_account ? data.role_account.toLowerCase() : '';
                    
                    // ตรวจสอบสิทธิ์เพื่อแยกเส้นทาง
                    if (role === 'admin') {
                        navigate('/admin-profile', { replace: true }); // เด้งไปหน้าแอดมิน
                    } else {
                        navigate('/profile', { replace: true }); // เด้งไปหน้าโปรไฟล์สมาชิกทั่วไป
                    }
                }, 1000);
            }
        } catch (err) {
            setSuccess(false);
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        'w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent transition text-sm text-gray-800 bg-white/80';

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 font-sans relative"
            style={{ backgroundImage: `url(${bgImg})` }}
        >
            <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl overflow-hidden my-8">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <img src={kmitlLogo} alt="Watermark Logo" className="w-64 h-64 object-contain" />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">เข้าสู่ระบบ</h1>
                        <p className="text-sm text-gray-500 font-medium">RIE Task Tracking System</p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm text-center font-medium ${success ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">อีเมล</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">รหัสผ่าน</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="รหัสผ่าน"
                                    required
                                    className={inputCls}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-800"
                                >
                                    {showPassword ? 'ซ่อน' : 'แสดง'}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <Link to="/reset-password" className="text-blue-600 hover:underline">ลืมรหัสผ่าน?</Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#002046] text-white font-semibold rounded-lg hover:bg-[#001733] active:scale-[0.99] transition duration-150 shadow-md text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                        </button>

                        <div className="text-center pt-2 text-xs text-gray-500">
                            ยังไม่มีบัญชี? <Link to="/register" className="text-blue-600 font-semibold hover:underline">ลงทะเบียน</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}