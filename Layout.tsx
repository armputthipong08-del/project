// src/Layout.tsx
import React from 'react';
import Sidebar from './Sidebar';
import bgImg from './assets/bg.jpg';
import kmitlLogo from './assets/KMITL.png';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div 
            className="min-h-screen w-full flex bg-cover bg-center bg-fixed font-sans relative overflow-x-hidden"
            style={{ backgroundImage: `url(${bgImg})` }}
        >
            {/* ฉากหลังหลัก (Background) อยู่หลังสุด */}

            {/* โลโก้ลายน้ำ KMITL ตรงกลางหน้าจอ - เพิ่ม z-index และ opacity */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-1">
                <img src={kmitlLogo} alt="Watermark Logo" className="w-96 h-96 object-contain opacity-25" />
            </div>

            {/* 1. แถบ Sidebar ด้านซ้าย - เอา z-index ออก */}
            <Sidebar />

            {/* 2. พื้นที่แสดงเนื้อหาฝั่งขวา (ปรับขนาดพอดีหน้าจออัตโนมัติ) - เปลี่ยน z-index */}
            <main className="flex-1 w-full min-h-screen p-4 md:p-8 relative z-2 overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}