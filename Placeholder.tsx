import Layout from './Layout';

// หน้าเปล่าชั่วคราว (ใช้กับเมนูที่ยังไม่ได้ทำหน้าจริง เช่น สมาชิกทั้งหมด, Setting)
export default function Placeholder({ title }: { title: string }) {
  return (
    <Layout>
      <div className="rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">หน้านี้ยังไม่ได้ทำ</p>
      </div>
    </Layout>
  );
}