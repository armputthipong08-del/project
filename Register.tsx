import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bgImg from './assets/bg.jpg';
import kmitlLogo from './assets/KMITL.png';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setErrorMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
            return;
        }

        try {
            const response = await fetch('/Project/process-register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    name: name,
                    email: email,
                    password: password,
                }),
            });

            const data = await response.json();

            if (data.ok) {
                setSuccessMessage('ลงทะเบียนสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                setErrorMessage(data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
            }
        } catch (err) {
            setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 font-sans relative"
            style={{ backgroundImage: `url(${bgImg})` }}
        >
            {/* กล่องฟอร์มหลัก */}
            <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl overflow-hidden">
                
                {/* โลโก้พื้นหลังแบบจาง ๆ (Watermark) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <img src={kmitlLogo} alt="Watermark Logo" className="w-72 h-72 object-contain" />
                </div>

                {/* เนื้อหาฟอร์มทั้งหมด */}
                <div className="relative z-10 space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            ลงทะเบียน
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">
                            RIE Task Tracking System
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center font-medium">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg text-center font-medium">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                ชื่อ
                            </label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ระบุชื่อของคุณ"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent transition text-sm text-gray-800 placeholder-gray-400 bg-white/80"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                อีเมล
                            </label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent transition text-sm text-gray-800 placeholder-gray-400 bg-white/80"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="รหัสผ่าน"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent transition text-sm text-gray-800 placeholder-gray-400 bg-white/80 pr-16"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
                                >
                                    {showPassword ? "ซ่อน" : "แสดง"}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                ยืนยันรหัสผ่าน
                            </label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="ยืนยันรหัสผ่าน"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent transition text-sm text-gray-800 placeholder-gray-400 bg-white/80 pr-16"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
                                >
                                    {showConfirmPassword ? "ซ่อน" : "แสดง"}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm pt-1 select-none cursor-pointer">
                            <input 
                                type="checkbox" 
                                required
                                className="w-4 h-4 rounded border-gray-300 text-[#002046] focus:ring-[#002046]" 
                            />
                            <span className="text-gray-600">ยอมรับข้อตกลงการใช้งาน</span>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-3 bg-[#002046] text-white font-semibold rounded-lg hover:bg-[#001733] active:scale-[0.99] transition duration-150 shadow-md text-base mt-2"
                        >
                            สมัครสมาชิก
                        </button>
                    </form>

                    <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-100">
                        มีบัญชีแล้ว?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}