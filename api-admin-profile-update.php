<?php
session_start();
ini_set('display_errors', 0);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

$open_connect = 1;
require_once __DIR__ . '/connect.php';

if (!$connect) {
    echo json_encode(['ok' => false, 'message' => 'Database connection failed']);
    exit;
}

try {
    $email = $_POST['email_account'] ?? '';
    $username = $_POST['username_account'] ?? '';
    $bio = $_POST['bio_account'] ?? '';
    $phone = $_POST['phone_account'] ?? '';
    $department = $_POST['department_account'] ?? '';

    if (empty($email)) {
        echo json_encode(['ok' => false, 'message' => 'ไม่พบข้อมูลอีเมลสำหรับอัปเดต']);
        exit;
    }

    $imageQueryPart = "";
    $params = [$username, $bio, $phone, $department];
    $types = "ssss";

    // จัดการอัปโหลดไฟล์รูปภาพไปยังโฟลเดอร์ images/profile/
    if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
        $fileTmpName = $_FILES['profile_image']['tmp_name'];
        $fileName = $_FILES['profile_image']['name'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];
        if (in_array($fileExtension, $allowed)) {
            $newFileName = 'admin_' . time() . '.' . $fileExtension;
            $uploadDir = __DIR__ . '/images/profile/';
            
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            if (move_uploaded_file($fileTmpName, $uploadDir . $newFileName)) {
                $imageQueryPart = ", images_account = ?";
                $params[] = $newFileName;
                $types .= "s";
            }
        }
    }

    $params[] = $email;
    $types .= "s";

    $sql = "UPDATE account SET username_account = ?, bio_account = ?, phone_account = ?, department_account = ? {$imageQueryPart} WHERE email_account = ?";
    
    $stmt = mysqli_prepare($connect, $sql);
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['ok' => true, 'message' => 'บันทึกข้อมูลและอัปเดตรูปภาพสำเร็จ']);
        } else {
            echo json_encode(['ok' => false, 'message' => 'ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้']);
        }
    } else {
        echo json_encode(['ok' => false, 'message' => 'SQL Prepare Error']);
    }

} catch (Throwable $e) {
    echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
}