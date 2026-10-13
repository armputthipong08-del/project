
import Layout from './Layout'; // ปรับ path ตามตำแหน่งของไฟล์ Layout.tsx จริง

export default function Timeline() {
    return (
        <Layout>
            {/* ใส่เนื้อหาเฉพาะสำหรับหน้า Timeline ตรงนี้ */}
            <div className="space-y-4">
                <p className="text-gray-600">ระบบแสดงไทม์ไลน์และประวัติการดำเนินงาน</p>
                
                <div className="bg-white p-6 rounded-xl shadow border">
                    <h3 className="font-bold text-gray-700 mb-2">กิจกรรมล่าสุด</h3>
                    <p className="text-sm text-gray-400">ยังไม่มีรายการไทม์ไลน์ในระบบ</p>
                </div>
            </div>
        </Layout>
    );
}