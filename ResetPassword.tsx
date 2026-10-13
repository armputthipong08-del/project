import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import bgImg from './assets/bg.jpg';
import kmitlLogo from './assets/KMITL.png';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    // State สำหรับควบคุมการแสดงผลของรหัสผ่าน
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        try {
            const formData = new URLSearchParams();
            if (token) {
                formData.append('action', 'reset');
                formData.append('token', token);
                formData.append('password_account1', password);
                formData.append('password_account2', confirmPassword);
            } else {
                formData.append('action', 'request');
                formData.append('email_account', email);
            }

            const response = await fetch('/Project/reset-password.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            const data = await response.json();
            setSuccess(data.ok);
            setMessage(data.message);

            if (data.ok) {
                if (!token && data.token) {
                    setTimeout(() => {
                        navigate(`/reset-password?token=${data.token}`);
                    }, 1000);
                } else if (token) {
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                }
            }
        } catch (err) {
            setSuccess(false);
            setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 font-sans relative"
            style={{ backgroundImage: `url(${bgImg})` }}
        >
            <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                    <img src={kmitlLogo} alt="Watermark Logo" className="w-72 h-72 object-contain" />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {token ? 'สร้างรหัสผ่านใหม่' : 'ลืมรหัสผ่าน'}
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">
                            {token ? 'กรอกรหัสผ่านใหม่ของคุณ' : 'RIE Task Tracking System'}
                        </p>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm text-center font-medium ${success ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!token ? (
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
                        ) : (
                            <>
                                {/* ช่องรหัสผ่านใหม่ */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        รหัสผ่านใหม่
                                    </label>
                                    <div className="relative">
                                        <input 
                                            // เปลี่ยน type ตาม state showPassword
                                            type={showPassword ? 'text' : 'password'} 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="อย่างน้อย 8 ตัวอักษร"
                                            required
                                            className="w-full px-4 py-3 pr-16 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent transition text-sm text-gray-800 placeholder-gray-400 bg-white/80"
                                        />
                                        {/* ปุ่มแสดง/ซ่อนรหัสผ่าน */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 px-4 flex items-center text-sm font-semibold text-[#002046] hover:text-[#001733] focus:outline-none"
                                        >
                                            {showPassword ? 'ซ่อน' : 'แสดง'}
                                        </button>
                                    </div>
                                </div>

                                {/* ช่องยืนยันรหัสผ่านใหม่ */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        ยืนยันรหัสผ่านใหม่
                                    </label>
                                    <div className="relative">
                                        <input 
                                            // เปลี่ยน type ตาม state showConfirmPassword
                                            type={showConfirmPassword ? 'text' : 'password'} 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="ยืนยันรหัสผ่านใหม่"
                                            required
                                            className="w-full px-4 py-3 pr-16 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent transition text-sm text-gray-800 placeholder-gray-400 bg-white/80"
                                        />
                                        {/* ปุ่มแสดง/ซ่อนรหัสผ่าน */}
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 px-4 flex items-center text-sm font-semibold text-[#002046] hover:text-[#001733] focus:outline-none"
                                        >
                                            {showConfirmPassword ? 'ซ่อน' : 'แสดง'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <button 
                            type="submit" 
                            className="w-full py-3 bg-[#002046] text-white font-semibold rounded-lg hover:bg-[#001733] active:scale-[0.99] transition duration-150 shadow-md text-base mt-2"
                        >
                            {token ? 'บันทึกรหัสผ่านใหม่' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                        </button>
                    </form>

                    <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-100">
                        <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                            กลับไปหน้าเข้าสู่ระบบ
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}