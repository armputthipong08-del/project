<?php
session_start();
$open_connect = 1;
require_once __DIR__ . '/connect.php';

ob_start();
$dev_mode = true;       // true = ส่ง token กลับไปที่หน้าบ้านเพื่อเด้งไปหน้าตั้งรหัสใหม่ทันที
$token_minutes = 30;    // อายุของลิงก์ (นาที)

function respond(bool $ok, string $message = '', array $data = []): void {
    if (ob_get_length()) { ob_clean(); }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['ok' => $ok, 'message' => $message], $data), JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_POST['action'] ?? ($_GET['action'] ?? '');
$token  = $_POST['token'] ?? ($_GET['token'] ?? '');

function find_account_by_token(mysqli $connect, string $token): ?array {
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    $hash = hash('sha256', $token);
    $stmt = mysqli_prepare($connect,
        "SELECT id_account FROM account
         WHERE reset_token_account = ? AND reset_expire_account > NOW() LIMIT 1");
    mysqli_stmt_bind_param($stmt, 's', $hash);
    mysqli_stmt_execute($stmt);
    $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);
    return $row ?: null;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if ($action === 'request') {
            // ===== ขั้นที่ 1: รับอีเมลเพื่อขอลิงก์รีเซ็ต =====
            $email_account = trim($_POST['email_account'] ?? '');

            if (!filter_var($email_account, FILTER_VALIDATE_EMAIL)) {
                respond(false, 'อีเมลไม่ถูกต้อง');
            }

            $stmt = mysqli_prepare($connect, "SELECT id_account FROM account WHERE email_account = ? LIMIT 1");
            mysqli_stmt_bind_param($stmt, 's', $email_account);
            mysqli_stmt_execute($stmt);
            $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
            mysqli_stmt_close($stmt);

            $new_token_raw = '';
            if ($row) {
                $new_token_raw  = bin2hex(random_bytes(32));
                $token_hash = hash('sha256', $new_token_raw);

                $stmt = mysqli_prepare($connect,
                    "UPDATE account
                     SET reset_token_account = ?, reset_expire_account = DATE_ADD(NOW(), INTERVAL ? MINUTE)
                     WHERE id_account = ?");
                mysqli_stmt_bind_param($stmt, 'sii', $token_hash, $token_minutes, $row['id_account']);
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }

            // ตอบกลับ JSON พร้อมส่ง token ดิบไปให้หน้าบ้านเด้งเปลี่ยนหน้าทันที
            respond(true, "ถ้าอีเมลนี้มีในระบบ กำลังพานำไปหน้าตั้งรหัสผ่านใหม่...", [
                'token' => $dev_mode ? $new_token_raw : ''
            ]);

        } elseif ($action === 'reset') {
            // ===== ขั้นที่ 2: บันทึกรหัสผ่านใหม่ =====
            $account = find_account_by_token($connect, $token);
            $pw1 = $_POST['password_account1'] ?? $_POST['password'] ?? '';
            $pw2 = $_POST['password_account2'] ?? $_POST['confirmPassword'] ?? '';

            if (!$account) {
                respond(false, 'ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่');
            } elseif (strlen($pw1) < 8) {
                respond(false, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
            } elseif ($pw1 !== $pw2) {
                respond(false, 'รหัสผ่านไม่ตรงกัน');
            } else {
                $salt_account     = bin2hex(random_bytes(32));
                $password_account = password_hash($pw1 . $salt_account, PASSWORD_ARGON2ID);

                $stmt = mysqli_prepare($connect,
                    "UPDATE account
                     SET password_account = ?, salt_account = ?, login_count_account = 0,
                         reset_token_account = NULL, reset_expire_account = NULL
                     WHERE id_account = ?");
                mysqli_stmt_bind_param($stmt, 'ssi', $password_account, $salt_account, $account['id_account']);

                if (mysqli_stmt_execute($stmt)) {
                    respond(true, 'ตั้งรหัสผ่านใหม่สำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...');
                } else {
                    respond(false, 'เกิดข้อผิดพลาด กรุณาลองใหม่');
                }
                mysqli_stmt_close($stmt);
            }
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // ===== ตรวจสอบความถูกต้องของ Token เมื่อเปิดหน้าเว็บ =====
        if ($token !== '') {
            $account = find_account_by_token($connect, $token);
            if ($account) {
                respond(true, 'Token ถูกต้อง');
            } else {
                respond(false, 'ลิงก์ไม่ถูกต้องหรือหมดอายุ');
            }
        }
    }

    respond(false, 'คำขอไม่ถูกต้อง');

} catch (Throwable $e) {
    respond(false, 'เกิดข้อผิดพลาดในระบบ: ' . $e->getMessage());
}