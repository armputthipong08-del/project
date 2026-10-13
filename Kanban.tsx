import Layout from './Layout'; // ปรับ path ตามตำแหน่งของไฟล์ Layout.tsx จริง

export default function Kanban() {
    return (
        <Layout>
            {/* ใส่เนื้อหาเฉพาะสำหรับหน้า Kanban ตรงนี้ */}
            <div className="space-y-4">
                <p className="text-gray-600">ระบบจัดการงานรูปแบบ Kanban Board</p>
                
                {/* โครงสร้างบอร์ด Kanban เบื้องต้น */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow border">
                        <h3 className="font-bold text-gray-700 mb-2">To Do</h3>
                        <p className="text-sm text-gray-400">ยังไม่เริ่มดำเนินการ</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow border">
                        <h3 className="font-bold text-gray-700 mb-2">In Progress</h3>
                        <p className="text-sm text-gray-400">กำลังดำเนินการ</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow border">
                        <h3 className="font-bold text-gray-700 mb-2">Done</h3>
                        <p className="text-sm text-gray-400">เสร็จสิ้นแล้ว</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}