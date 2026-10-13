<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

// ปิดการแสดง Error ออกหน้าจอโดยตรง เพื่อไม่ให้ไฟล์ JSON พัง
error_reporting(0);
ini_set('display_errors', 0);

$open_connect = 1;
require_once __DIR__ . '/connect.php';

try {
    $users = [];

    // ตรวจสอบว่าระบบใช้ตัวเชื่อมต่อแบบ mysqli ($connect) หรือ PDO ($pdo)
    if (isset($connect)) {
        $query = "SELECT id_account, username_account, email_account, role_account FROM account";
        $result = mysqli_query($connect, $query);
        if ($result) {
            while ($row = mysqli_fetch_assoc($result)) {
                $users[] = [
                    'id_account' => (int)$row['id_account'],
                    'username_account' => $row['username_account'] ?? 'ไม่ระบุชื่อ',
                    'email_account' => $row['email_account'] ?? '-',
                    'role_account' => $row['role_account'] ?? 'member'
                ];
            }
        }
    } elseif (isset($pdo)) {
        $stmt = $pdo->prepare("SELECT id_account, username_account, email_account, role_account FROM account");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        'ok' => true,
        'users' => $users
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    echo json_encode([
        'ok' => false,
        'message' => $e->getMessage(),
        'users' => []
    ], JSON_UNESCAPED_UNICODE);
}
?>