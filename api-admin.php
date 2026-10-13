<?php
session_start();
ini_set('display_errors', 0);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

$open_connect = 1;
require_once __DIR__ . '/connect.php';

if (!$connect) {
    echo json_encode(['ok' => false, 'message' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// จัดการคำขอแบบ POST (อัปเดต, ลบ, เพิ่มงาน, รีเซ็ตรหัสผ่าน)
if ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'delete_task') {
        $del_id = (int)($_POST['id_task'] ?? 0);
        if ($del_id > 0) {
            $stmt = mysqli_prepare($connect, "DELETE FROM task WHERE id_task = ?");
            mysqli_stmt_bind_param($stmt, 'i', $del_id);
            if (mysqli_stmt_execute($stmt)) {
                echo json_encode(['ok' => true, 'message' => 'ลบงานสำเร็จ']);
            } else {
                echo json_encode(['ok' => false, 'message' => 'ไม่สามารถลบงานได้']);
            }
        } else {
            echo json_encode(['ok' => false, 'message' => 'ID งานไม่ถูกต้อง']);
        }
        exit;
    }

    if ($action === 'update_account') {
        $id = (int)($_POST['id_account'] ?? 0);
        $username = $_POST['username_account'] ?? '';
        $email = $_POST['email_account'] ?? '';
        $role = $_POST['role_account'] ?? 'member';

        if ($id > 0) {
            $stmt = mysqli_prepare($connect, "UPDATE account SET username_account = ?, email_account = ?, role_account = ? WHERE id_account = ?");
            mysqli_stmt_bind_param($stmt, 'sssi', $username, $email, $role, $id);
            if (mysqli_stmt_execute($stmt)) {
                echo json_encode(['ok' => true, 'message' => 'อัปเดตข้อมูลบัญชีสำเร็จ']);
            } else {
                echo json_encode(['ok' => false, 'message' => 'ไม่สามารถอัปเดตข้อมูลได้']);
            }
        } else {
            echo json_encode(['ok' => false, 'message' => 'ID บัญชีไม่ถูกต้อง']);
        }
        exit;
    }

    if ($action === 'delete_account') {
        $id = (int)($_POST['id_account'] ?? 0);
        if ($id > 0) {
            $stmt = mysqli_prepare($connect, "DELETE FROM account WHERE id_account = ?");
            mysqli_stmt_bind_param($stmt, 'i', $id);
            if (mysqli_stmt_execute($stmt)) {
                echo json_encode(['ok' => true, 'message' => 'ลบบัญชีผู้ใช้สำเร็จ']);
            } else {
                echo json_encode(['ok' => false, 'message' => 'ไม่สามารถลบบัญชีได้']);
            }
        } else {
            echo json_encode(['ok' => false, 'message' => 'ID บัญชีไม่ถูกต้อง']);
        }
        exit;
    }

    if ($action === 'reset_password') {
        $id = (int)($_POST['id_account'] ?? 0);
        $new_pass = $_POST['new_password'] ?? '';
        if ($id > 0 && strlen($new_pass) >= 6) {
            $hashed = password_hash($new_pass, PASSWORD_DEFAULT);
            $stmt = mysqli_prepare($connect, "UPDATE account SET password_account = ? WHERE id_account = ?");
            mysqli_stmt_bind_param($stmt, 'si', $hashed, $id);
            if (mysqli_stmt_execute($stmt)) {
                echo json_encode(['ok' => true, 'message' => 'รีเซ็ตรหัสผ่านสำเร็จ']);
            } else {
                echo json_encode(['ok' => false, 'message' => 'ไม่สามารถรีเซ็ตรหัสผ่านได้']);
            }
        } else {
            echo json_encode(['ok' => false, 'message' => 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร']);
        }
        exit;
    }

    if ($action === 'assign_task') {
        $title = $_POST['title_task'] ?? '';
        $detail = $_POST['detail_task'] ?? '';
        $assignee = (int)($_POST['assignee_task'] ?? 0);
        $due = $_POST['due_task'] ?? null;
        $is_leader = isset($_POST['is_leader_task']) ? 1 : 0;

        if (!empty($title) && $assignee > 0) {
            // [แก้ไขจุดที่ 3] ตรวจสอบความปลอดภัย: ห้ามมอบหมายงานให้ Admin ด้วยกันเอง
            $check_stmt = mysqli_prepare($connect, "SELECT role_account FROM account WHERE id_account = ? LIMIT 1");
            mysqli_stmt_bind_param($check_stmt, 'i', $assignee);
            mysqli_stmt_execute($check_stmt);
            $check_res = mysqli_stmt_get_result($check_stmt);
            $check_row = mysqli_fetch_assoc($check_res);
            mysqli_stmt_close($check_stmt);

            if (!$check_row || strtolower($check_row['role_account']) !== 'member') {
                echo json_encode(['ok' => false, 'message' => 'ไม่สามารถมอบหมายงานให้ Admin ได้ มอบหมายได้เฉพาะ Member เท่านั้น']);
                exit;
            }

            $stmt = mysqli_prepare($connect, "INSERT INTO task (title_task, detail_task, assignee_task, due_task, is_leader_task) VALUES (?, ?, ?, ?, ?)");
            mysqli_stmt_bind_param($stmt, 'ssisi', $title, $detail, $assignee, $due, $is_leader);
            if (mysqli_stmt_execute($stmt)) {
                echo json_encode(['ok' => true, 'message' => 'มอบหมายงานสำเร็จ']);
            } else {
                echo json_encode(['ok' => false, 'message' => 'ไม่สามารถบันทึกงานได้']);
            }
            mysqli_stmt_close($stmt);
        } else {
            echo json_encode(['ok' => false, 'message' => 'กรุณากรอกชื่องานและเลือกผู้รับงาน']);
        }
        exit;
    }

    echo json_encode(['ok' => false, 'message' => 'Action ไม่ถูกต้อง']);
    exit;
}

// จัดการคำขอแบบ GET (ดึงข้อมูลสถิติ โปรไฟล์ Admin และรายการผู้ใช้)
$admin_query = mysqli_query($connect, "SELECT * FROM account WHERE role_account = 'admin' LIMIT 1");
$admin = mysqli_fetch_assoc($admin_query);
if (!$admin) {
    $admin = [
        'id_account' => 1,
        'username_account' => 'Admin',
        'email_account' => 'admin@kmitl.ac.th',
        'role_account' => 'admin',
        'department_account' => 'วิศวะหุ่นยนต์',
        'phone_account' => '-',
        'bio_account' => '-',
        'images_account' => ''
    ];
}

// นับสถิติภาพรวม
$stats_res = mysqli_query($connect, "SELECT 
    COUNT(*) as total_accounts,
    SUM(CASE WHEN LOWER(role_account) = 'admin' THEN 1 ELSE 0 END) as total_admins,
    SUM(CASE WHEN LOWER(role_account) != 'admin' THEN 1 ELSE 0 END) as total_members
    FROM account");
$stats = mysqli_fetch_assoc($stats_res);

// ค้นหาและแบ่งหน้า
$search = $_GET['search'] ?? '';
$role = $_GET['role'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = 10;
// [แก้ไขจุดที่ 1] แก้ไข Syntax Error ตรงการคำนวณ offset
$offset = ($page - 1) * $limit;

$where = "WHERE 1=1";
if (!empty($search)) {
    $s = mysqli_real_escape_string($connect, $search);
    $where .= " AND (username_account LIKE '%$s%' OR email_account LIKE '%$s%' OR phone_account LIKE '%$s%')";
}
if (!empty($role)) {
    $r = mysqli_real_escape_string($connect, $role);
    $where .= " AND role_account = '$r'";
}

$count_res = mysqli_query($connect, "SELECT COUNT(*) as cnt FROM account $where");
$count_row = mysqli_fetch_assoc($count_res);
$total_filtered = (int)$count_row['cnt'];
$total_pages = max(1, ceil($total_filtered / $limit));

$accounts_res = mysqli_query($connect, "SELECT id_account, username_account, email_account, phone_account, role_account, images_account, department_account, bio_account FROM account $where LIMIT $limit OFFSET $offset");
$accounts = [];
while ($row = mysqli_fetch_assoc($accounts_res)) {
    $accounts[] = $row;
}

// [แก้ไขจุดที่ 2] ดึงรายชื่อสำหรับช่องมอบหมายงาน ให้ดึงเฉพาะ role_account = 'member' เท่านั้น
$users_task_res = mysqli_query($connect, "SELECT id_account, username_account FROM account WHERE role_account = 'member' ORDER BY username_account ASC");
$users_task = [];
while ($row = mysqli_fetch_assoc($users_task_res)) {
    $users_task[] = $row;
}

$recent_tasks = [];
$task_check = mysqli_query($connect, "SHOW TABLES LIKE 'task'");
if (mysqli_num_rows($task_check) > 0) {
    $tasks_res = mysqli_query($connect, "SELECT t.id_task, t.title_task, t.due_task, t.is_leader_task, a.username_account FROM task t LEFT JOIN account a ON t.assignee_task = a.id_account ORDER BY t.id_task DESC LIMIT 5");
    while ($row = mysqli_fetch_assoc($tasks_res)) {
        $recent_tasks[] = $row;
    }
}

echo json_encode([
    'ok' => true,
    'admin' => $admin,
    'stats' => [
        'total_accounts' => (int)($stats['total_accounts'] ?? 0),
        'total_admins' => (int)($stats['total_admins'] ?? 0),
        'total_members' => (int)($stats['total_members'] ?? 0)
    ],
    'accounts' => $accounts,
    'pagination' => [
        'current_page' => $page,
        'total_pages' => $total_pages,
        'total_filtered' => $total_filtered
    ],
    'users_task' => $users_task,
    'recent_tasks' => $recent_tasks
], JSON_UNESCAPED_UNICODE);