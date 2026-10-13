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

if ($method !== 'POST') {
    echo json_encode(['ok' => false, 'message' => 'Invalid request method']);
    exit;
}

$username = trim($_POST['username_account'] ?? '');
$bio = trim($_POST['bio_account'] ?? '');
$phone = trim($_POST['phone_account'] ?? '');
$department = trim($_POST['department_account'] ?? '');

if (empty($username)) {
    echo json_encode(['ok' => false, 'message' => 'กรุณากรอกชื่อผู้ใช้']);
    exit;
}

$imageQueryPart = "";
$params = [$username, $bio, $phone, $department];
$types = "ssss";

// จัดการอัปโหลดรูปภาพโปรไฟล์ใหม่
if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['profile_image']['tmp_name'];
    $fileName = $_FILES['profile_image']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (in_array($fileExtension, $allowedExtensions)) {
        $newFileName = 'user_' . $id_account . '_' . time() . '.' . $fileExtension;
        $uploadFileDir = __DIR__ . '/images/profile/';
        
        if (!is_dir($uploadFileDir)) {
            mkdir($uploadFileDir, 0777, true);
        }
        
        $dest_path = $uploadFileDir . $newFileName;
        if (move_uploaded_file($fileTmpPath, $dest_path)) {
            $imageQueryPart = ", images_account = ?";
            $params[] = $newFileName;
            $types .= "s";
        }
    }
}

$params[] = $id_account;
$types .= "i";

// อัปเดตข้อมูลลงตาราง account
$sql = "UPDATE account SET username_account = ?, bio_account = ?, phone_account = ?, department_account = ? {$imageQueryPart} WHERE id_account = ?";

$stmt = mysqli_prepare($connect, $sql);
if ($stmt) {
    mysqli_stmt_bind_param($stmt, $types, ...$params);
    if (mysqli_stmt_execute($stmt)) {
        // อัปเดตชื่อใน Session ให้เป็นปัจจุบันด้วย
        $_SESSION['username_account'] = $username;
        
        echo json_encode(['ok' => true, 'message' => 'บันทึกข้อมูลเรียบร้อยแล้ว']);
    } else {
        echo json_encode(['ok' => false, 'message' => 'ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้']);
    }
    mysqli_stmt_close($stmt);
} else {
    echo json_encode(['ok' => false, 'message' => 'SQL Prepare Error']);
}