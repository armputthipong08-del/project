<?php
// เพิ่ม CORS Headers เพื่อให้ React (พอร์ต 5173) เรียกใช้งานได้
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
$open_connect = 1;
$dev_mode = true;

ob_start();

function respond(bool $ok, string $message = '', array $data = []): void
{
    if (ob_get_length()) {
        ob_clean();
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['ok' => $ok, 'message' => $message], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    require_once __DIR__ . '/connect.php';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(false, 'วิธีส่งข้อมูลไม่ถูกต้อง');
    }

    $email_account = trim($_POST['email_account'] ?? '');
    $password_input = $_POST['password_account'] ?? '';

    if ($email_account === '') {
        respond(false, 'กรุณากรอกอีเมล');
    }
    if ($password_input === '') {
        respond(false, 'กรุณากรอกรหัสผ่าน');
    }

    $stmt = mysqli_prepare($connect, "SELECT id_account, username_account, email_account, password_account, salt_account, role_account, login_count_account FROM account WHERE email_account = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 's', $email_account);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if (!$row) {
        respond(false, 'ไม่พบอีเมลนี้ในระบบ');
    }

    $id_account = $row['id_account'];
    $current_fail_count = (int)($row['login_count_account'] ?? 0);

    if ($current_fail_count >= 4) {
        respond(false, 'คุณกรอกรหัสผ่านผิดเกิน 4 ครั้ง กรุณาดำเนินการรีเซ็ตรหัสผ่านใหม่', [
            'force_reset' => true
        ]);
    }

    $password_to_verify = $password_input . $row['salt_account'];
    if (!password_verify($password_to_verify, $row['password_account'])) {
        $new_fail_count = $current_fail_count + 1;
        $update_stmt = mysqli_prepare($connect, "UPDATE account SET login_count_account = ? WHERE id_account = ?");
        mysqli_stmt_bind_param($update_stmt, 'ii', $new_fail_count, $id_account);
        mysqli_stmt_execute($update_stmt);
        mysqli_stmt_close($update_stmt);

        // แก้ไขบรรทัดนี้ให้ถูกต้อง
        $remaining = 4 - $new_fail_count;

        if ($remaining > 0) {
            respond(false, "รหัสผ่านไม่ถูกต้อง (คุณเหลือโอกาสอีก $remaining ครั้งก่อนถูกบังคับรีเซ็ตรหัสผ่าน)");
        } else {
            respond(false, 'รหัสผ่านไม่ถูกต้องครบ 4 ครั้งแล้ว ระบบบังคับให้รีเซ็ตรหัสผ่านใหม่', [
                'force_reset' => true
            ]);
        }
    }

    $reset_stmt = mysqli_prepare($connect, "UPDATE account SET login_count_account = 0 WHERE id_account = ?");
    mysqli_stmt_bind_param($reset_stmt, 'i', $id_account);
    mysqli_stmt_execute($reset_stmt);
    mysqli_stmt_close($reset_stmt);

    // เริ่ม Session สำหรับเข้าสู่ระบบ
    $_SESSION['id_account'] = $row['id_account'];
    $_SESSION['username_account'] = $row['username_account'];
    $_SESSION['role_account'] = $row['role_account'];
    $_SESSION['email_account'] = $row['email_account'];

    // ส่ง role_account กลับไปให้ฝั่ง React ทราบเพื่อแยกหน้าพาไป
    respond(true, 'เข้าสู่ระบบสำเร็จ', [
        'role_account' => $row['role_account']
    ]);
} catch (Throwable $e) {
    error_log('process-login error: ' . $e->getMessage());
    respond(false, $dev_mode ? 'เกิดข้อผิดพลาด: ' . $e->getMessage() : 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่');
}
?>