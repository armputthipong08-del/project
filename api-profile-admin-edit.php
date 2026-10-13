<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
$open_connect = 1;
require_once('connect.php');

if (!isset($_SESSION['id_account']) || ($_SESSION['role_account'] ?? '') !== 'admin') {
    echo json_encode(['ok' => false, 'message' => 'Unauthorized']);
    exit;
}

$id_account = (int)$_SESSION['id_account'];
$directory = 'images/profile/';

function profile_image_url(string $directory, ?string $file): string {
    $path = 'images/Profile.png';
    if (!empty($file)) {
        foreach ([$directory, 'images/profile/', 'images_account/'] as $d) {
            if (is_file(__DIR__ . '/' . $d . $file)) { $path = $d . $file; break; }
        }
    }
    $v = is_file(__DIR__ . '/' . $path) ? '?' . filemtime(__DIR__ . '/' . $path) : '';
    return $path . $v;
}

$method = $_SERVER['REQUEST_METHOD'];

// ดึงข้อมูลสำหรับแสดงในฟอร์ม (GET)
if ($method === 'GET') {
    $stmt = mysqli_prepare($connect, "SELECT * FROM account WHERE id_account = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 'i', $id_account);
    mysqli_stmt_execute($stmt);
    $result_show = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt)) ?: [];
    mysqli_stmt_close($stmt);

    $image_account = profile_image_url($directory, $result_show['images_account'] ?? '');

    echo json_encode([
        'ok' => true,
        'user' => $result_show,
        'image_account' => $image_account
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ประมวลผลการบันทึกข้อมูล (POST)
if ($method === 'POST') {
    $username = trim($_POST['username_account'] ?? '');
    $department = trim($_POST['department_account'] ?? '');
    $phone = trim($_POST['phone_account'] ?? '');
    $bio = trim($_POST['bio_account'] ?? '');

    // ดึงชื่อไฟล์รูปเดิม
    $stmt = mysqli_prepare($connect, "SELECT images_account FROM account WHERE id_account = ? LIMIT 1");
    mysqli_stmt_bind_param($stmt, 'i', $id_account);
    mysqli_stmt_execute($stmt);
    $current_data = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    mysqli_stmt_close($stmt);

    $new_image_name = $current_data['images_account'] ?? '';
    $error = '';

    // ตรวจสอบความถูกต้อง (Validation)
    if ($username === '') {
        $error = 'กรุณากรอกชื่อผู้ใช้';
    } elseif (mb_strlen($username) > 100 || mb_strlen($department) > 100) {
        $error = 'ชื่อผู้ใช้และคณะ/สาขายาวได้ไม่เกิน 100 ตัวอักษร';
    } elseif (!preg_match('/^[0-9+\-\s]{0,20}$/', $phone)) {
        $error = 'เบอร์โทรศัพท์ใช้ได้เฉพาะตัวเลข เครื่องหมาย + - และช่องว่าง (ไม่เกิน 20 ตัว)';
    } elseif (mb_strlen($bio) > 255) {
        $error = 'Bio ยาวได้ไม่เกิน 255 ตัวอักษร';
    }

    // อัปโหลดรูปภาพใหม่ (ถ้ามี)
    if ($error === '' && isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
        $tmp = $_FILES['profile_image']['tmp_name'];
        $ext = strtolower(pathinfo($_FILES['profile_image']['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true) || @getimagesize($tmp) === false) {
            $error = 'รองรับเฉพาะไฟล์รูปภาพ (jpg, jpeg, png, webp) เท่านั้น';
        } else {
            $target_dir = __DIR__ . '/' . $directory;
            if (!is_dir($target_dir)) {
                mkdir($target_dir, 0755, true);
            }
            $new_image_name = 'profile_' . $id_account . '_' . time() . '.' . $ext;
            if (!move_uploaded_file($tmp, $target_dir . $new_image_name)) {
                $error = 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ';
            }
        }
    }

    if ($error !== '') {
        echo json_encode(['ok' => false, 'message' => $error], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // อัปเดตข้อมูลลงฐานข้อมูล
    $stmt = mysqli_prepare($connect, "UPDATE account SET username_account = ?, department_account = ?, phone_account = ?, bio_account = ?, images_account = ? WHERE id_account = ?");
    mysqli_stmt_bind_param($stmt, 'sssssi', $username, $department, $phone, $bio, $new_image_name, $id_account);
    $ok = mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    if ($ok) {
        $_SESSION['admin_flash'] = 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว';
        echo json_encode(['ok' => true, 'message' => 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว'], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['ok' => false, 'message' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}