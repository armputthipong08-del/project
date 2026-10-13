<?php
session_start();
ini_set('display_errors', '0');          // กัน warning ปนเข้าไปใน JSON
$open_connect = 1;
require_once __DIR__ . '/connect.php';

function out(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// ยังไม่ล็อกอิน = 401 (ฝั่ง React ใช้พาไปหน้า /login) — ไม่ต้องใส่ CORS เพราะเรียกผ่าน proxy ของ Vite (origin เดียวกัน)
if (!isset($_SESSION['id_account'])) {
    out(['ok' => false, 'message' => 'กรุณาเข้าสู่ระบบ'], 401);
}

try {
    // 1) จำนวนบัญชี
    $acc = mysqli_fetch_assoc(mysqli_query($connect,
        "SELECT COUNT(*) AS total,
                COALESCE(SUM(role_account = 'admin'), 0)  AS admins,
                COALESCE(SUM(role_account <> 'admin'), 0) AS members
         FROM account"));

    // 2) จำนวนงานตามสถานะ — ค่าในตาราง task คือ todo / doing / done
    //    (โค้ดเดิมเทียบกับ 'Completed' / 'เสร็จสิ้น' ซึ่งไม่มีในตาราง จึงนับงานที่เสร็จได้ 0 เสมอ)
    $t = mysqli_fetch_assoc(mysqli_query($connect,
        "SELECT COUNT(*) AS total,
                COALESCE(SUM(status_task = 'done'), 0)  AS done,
                COALESCE(SUM(status_task = 'doing'), 0) AS doing,
                COALESCE(SUM(due_task IS NOT NULL AND due_task < CURDATE() AND status_task <> 'done'), 0) AS overdue
         FROM task"));
    $total = (int)$t['total'];
    $done  = (int)$t['done'];
    $doing = (int)$t['doing'];
    $todo  = max(0, $total - $done - $doing);

    // 3) งานล่าสุด 5 รายการ
    $recent = mysqli_fetch_all(mysqli_query($connect,
        "SELECT t.id_task, t.title_task, t.status_task, t.due_task, a.username_account
         FROM task t LEFT JOIN account a ON a.id_account = t.assignee_task
         ORDER BY t.id_task DESC LIMIT 5"), MYSQLI_ASSOC);

    // 4) งานที่ยังไม่เสร็จและมีกำหนดส่ง เรียงตามวันที่ใกล้ถึงก่อน (ใช้วาด Timeline)
    $upcoming = mysqli_fetch_all(mysqli_query($connect,
        "SELECT t.id_task, t.title_task, t.status_task, t.due_task, a.username_account
         FROM task t LEFT JOIN account a ON a.id_account = t.assignee_task
         WHERE t.due_task IS NOT NULL AND t.status_task <> 'done'
         ORDER BY t.due_task ASC LIMIT 6"), MYSQLI_ASSOC);

    out([
        'ok' => true,
        'stats' => [
            'total_accounts'  => (int)$acc['total'],
            'total_admins'    => (int)$acc['admins'],
            'total_members'   => (int)$acc['members'],
            'total_tasks'     => $total,
            'completed_tasks' => $done,
            'ongoing_tasks'   => $doing,
            'todo_tasks'      => $todo,
            'overdue_tasks'   => (int)$t['overdue'],
        ],
        'recent_tasks'   => $recent,
        'upcoming_tasks' => $upcoming,
    ]);
} catch (Throwable $e) {
    error_log('api-dashboard error: ' . $e->getMessage());
    out(['ok' => false, 'message' => 'เกิดข้อผิดพลาดในการอ่านข้อมูลจากฐานข้อมูล'], 500);
}