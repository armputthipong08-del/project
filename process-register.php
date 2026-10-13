<?php
// 1. ต้องประกาศตัวแปรปลดล็อกก่อนเรียก connect.php เสมอ
$open_connect = 1;
$dev_mode = true; // true = แสดง Error จริงเพื่อช่วยในการดีบัก

ob_start(); 

function respond(bool $ok, string $message = ''): void {
    if (ob_get_length()) { ob_clean(); }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // 2. เรียกไฟล์ connect.php ในโฟลเดอร์เดียวกัน (ไม่ต้องมี /../ เพราะย้ายมาข้างนอกแล้ว)
    require_once __DIR__ . '/connect.php';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(false, 'วิธีส่งข้อมูลไม่ถูกต้อง');
    }

    // 3. รองรับชื่อฟิลด์ทั้งแบบเก่าและแบบที่ส่งมาจาก React เพื่อป้องกันค่าว่าง
    $username_account  = trim($_POST['username_account'] ?? $_POST['name'] ?? '');
    $email_account     = trim($_POST['email_account'] ?? $_POST['email'] ?? '');
    $password_account1 = $_POST['password_account1'] ?? $_POST['password'] ?? '';
    $password_account2 = $_POST['password_account2'] ?? $_POST['password'] ?? $_POST['password_account1'] ?? '';

    // ตรวจสอบข้อมูลฝั่งเซิร์ฟเวอร์
    if ($username_account === '') {
        respond(false, 'กรุณากรอกชื่อผู้ใช้');
    }
    if ($email_account === '' || !filter_var($email_account, FILTER_VALIDATE_EMAIL)) {
        respond(false, 'อีเมลไม่ถูกต้อง');
    }
    if (strlen($password_account1) < 8) {
        respond(false, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    }
    if ($password_account1 !== $password_account2) {
        respond(false, 'รหัสผ่านไม่ตรงกัน');
    }

    // เช็กอีเมลซ้ำ
    $stmt = mysqli_prepare($connect, "SELECT 1 FROM account WHERE email_account = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 's', $email_account);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);
    $exists = mysqli_stmt_num_rows($stmt) > 0;
    mysqli_stmt_close($stmt);

    if ($exists) {
        respond(false, 'อีเมลนี้ถูกใช้แล้ว');
    }

    // สร้าง salt + hash รหัสผ่าน
    $salt_account     = bin2hex(random_bytes(32));
    $password_account = password_hash($password_account1 . $salt_account, PASSWORD_ARGON2ID);

    // ตรวจสอบคอลัมน์ที่มีจริงในฐานข้อมูลเพื่อความปลอดภัย
    $existing_cols = [];
    $res = mysqli_query($connect, "SHOW COLUMNS FROM account");
    while ($col = mysqli_fetch_assoc($res)) {
        $existing_cols[$col['Field']] = true;
    }

    $columns = "username_account, email_account, password_account, salt_account, role_account, images_account";
    $values  = "?, ?, ?, ?, 'member', 'default_images_account.jpg'";
    if (isset($existing_cols['login_count_account'])) { $columns .= ", login_count_account"; $values .= ", 0"; }
    if (isset($existing_cols['lock_account']))        { $columns .= ", lock_account";        $values .= ", 0"; }

    $stmt = mysqli_prepare($connect, "INSERT INTO account ($columns) VALUES ($values)");
    mysqli_stmt_bind_param($stmt, 'ssss', $username_account, $email_account, $password_account, $salt_account);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    respond(true);

} catch (Throwable $e) {
    error_log('process-register error: ' . $e->getMessage());
    respond(false, $dev_mode ? 'เกิดข้อผิดพลาด: ' . $e->getMessage() : 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่');
}