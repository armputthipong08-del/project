<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
$open_connect = 1;
require_once('connect.php');

if (!isset($_SESSION['id_account'])) {
    echo json_encode(['ok' => false, 'message' => 'Unauthorized']);
    exit;
}

$id_account = (int)$_SESSION['id_account'];
$method = $_SERVER['REQUEST_METHOD'];

// ฟังก์ชันจัดการรูปโปรไฟล์
function get_profile_image($connect, $id_account) {
    $res = mysqli_query($connect, "SELECT images_account FROM account WHERE id_account = '$id_account'");
    $row = mysqli_fetch_assoc($res);
    $file = $row['images_account'] ?? '';
    $default_image = 'images/Profile.png';
    $profile_dir = 'images/profile/';

    if (!empty($file) && is_file(__DIR__ . '/' . $profile_dir . $file)) {
        $path = $profile_dir . $file;
    } else {
        $path = $default_image;
    }
    return is_file(__DIR__ . '/' . $path) ? $path . '?' . filemtime(__DIR__ . '/' . $path) : $path;
}

// ตรวจสอบตาราง task_member
$team_enabled = true;
try {
    mysqli_query($connect, "SELECT 1 FROM task_member LIMIT 1");
} catch (Throwable $e) {
    $team_enabled = false;
}

// จัดการคำขอแบบ POST (เพิ่มสมาชิกในทีม)
if ($method === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'add_team_member' && $team_enabled) {
        $task_id = (int)($_POST['task_id'] ?? 0);
        $member_id = (int)($_POST['member_id'] ?? 0);

        // เช็กว่าเป็นหัวหน้างานจริงไหม
        $stmt = mysqli_prepare($connect, "SELECT 1 FROM task WHERE id_task = ? AND assignee_task = ? AND is_leader_task = 1");
        mysqli_stmt_bind_param($stmt, 'ii', $task_id, $id_account);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_store_result($stmt);
        $is_task_leader = mysqli_stmt_num_rows($stmt) > 0;
        mysqli_stmt_close($stmt);

        // เช็กว่าเป็นสมาชิกทั่วไปจริงไหม
        $stmt = mysqli_prepare($connect, "SELECT 1 FROM account WHERE id_account = ? AND role_account = 'member'");
        mysqli_stmt_bind_param($stmt, 'i', $member_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_store_result($stmt);
        $member_ok = mysqli_stmt_num_rows($stmt) > 0;
        mysqli_stmt_close($stmt);

        if ($is_task_leader && $member_ok && $member_id !== $id_account) {
            $stmt = mysqli_prepare($connect, "INSERT IGNORE INTO task_member (task_id, account_id, added_by) VALUES (?, ?, ?)");
            mysqli_stmt_bind_param($stmt, 'iii', $task_id, $member_id, $id_account);
            mysqli_stmt_execute($stmt);
            $added = mysqli_stmt_affected_rows($stmt) > 0;
            mysqli_stmt_close($stmt);

            echo json_encode(['ok' => true, 'message' => $added ? 'เพิ่มสมาชิกในทีมเรียบร้อยแล้ว' : 'สมาชิกคนนี้อยู่ในทีมแล้ว']);
        } else {
            echo json_encode(['ok' => false, 'message' => 'ไม่สามารถเพิ่มสมาชิกได้']);
        }
        exit;
    }
}

// จัดการคำขอแบบ GET (ดึงข้อมูลโปรไฟล์และงาน)
if ($method === 'GET') {
    $res = mysqli_query($connect, "SELECT * FROM account WHERE id_account = '$id_account'");
    $user = mysqli_fetch_assoc($res);
    $user['image_account'] = get_profile_image($connect, $id_account);

    // ดึงงานของฉัน
    $sql = "SELECT id_task, title_task, detail_task, due_task, is_leader_task, status_task, 0 AS via_team FROM task WHERE assignee_task = ?";
    $types = 'i';
    $params = [$id_account];
    if ($team_enabled) {
        $sql .= " UNION ALL SELECT t.id_task, t.title_task, t.detail_task, t.due_task, 0, t.status_task, 1 FROM task t JOIN task_member m ON m.task_id = t.id_task WHERE m.account_id = ?";
        $types .= 'i';
        $params[] = $id_account;
    }
    $sql .= " ORDER BY id_task DESC";
    $stmt = mysqli_prepare($connect, $sql);
    mysqli_stmt_bind_param($stmt, $types, ...$params);
    mysqli_stmt_execute($stmt);
    $my_tasks = mysqli_fetch_all(mysqli_stmt_get_result($stmt), MYSQLI_ASSOC);
    mysqli_stmt_close($stmt);

    $team_by_task = [];
    $team_candidates = [];
    $leader_ids = [];
    foreach ($my_tasks as $t) {
        if ($t['is_leader_task']) { $leader_ids[] = (int)$t['id_task']; }
    }

    $is_leader = false;
    foreach ($my_tasks as $t) {
        if ($t['is_leader_task']) { $is_leader = true; break; }
    }

    if ($team_enabled && $leader_ids) {
        $in = implode(',', $leader_ids);
        $res = mysqli_query($connect, "SELECT m.task_id, a.username_account, a.id_account FROM task_member m JOIN account a ON a.id_account = m.account_id WHERE m.task_id IN ($in) ORDER BY a.username_account");
        while ($r = mysqli_fetch_assoc($res)) {
            $team_by_task[(int)$r['task_id']][] = $r;
        }
        $res = mysqli_query($connect, "SELECT id_account, username_account FROM account WHERE role_account = 'member' AND id_account <> $id_account ORDER BY username_account");
        $team_candidates = mysqli_fetch_all($res, MYSQLI_ASSOC);
    }

    echo json_encode([
        'ok' => true,
        'profile' => $user, // <-- แก้จาก 'user' เป็น 'profile' ให้ตรงกับฝั่ง React
        'my_tasks' => $my_tasks,
        'task_count' => count($my_tasks),
        'is_leader' => $is_leader,
        'team_enabled' => $team_enabled,
        'team_by_task' => $team_by_task,
        'team_candidates' => $team_candidates
    ], JSON_UNESCAPED_UNICODE);
    exit;
}