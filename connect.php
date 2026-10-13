<?php

// ไฟล์นี้ต้องถูก require จากหน้าอื่นเท่านั้น (หน้านั้นต้องตั้ง $open_connect = 1 ก่อน)
if (!isset($open_connect) || $open_connect !== 1) {
    // เปิดไฟล์ตรงๆ -> ส่งไปหน้าล็อกอิน (ใช้ path เต็ม เพราะไฟล์นี้ถูกเรียกจากหลายโฟลเดอร์)
    $doc_root = rtrim(str_replace('\\', '/', realpath($_SERVER['DOCUMENT_ROOT'])), '/');
    $base_url = substr(str_replace('\\', '/', realpath(__DIR__)), strlen($doc_root));
    header('Location: ' . $base_url . '/Login-Logout/login.html');
    exit;
}

$hostname = 'localhost';
$username = 'root';
$password = '';
$database = 'programming_world';

$connect = mysqli_connect($hostname, $username, $password, $database);

if (!$connect) {
    die("การเชื่อมต่อฐานข้อมูลล้มเหลว: " . mysqli_connect_error());
}

mysqli_set_charset($connect, 'utf8mb4');

// หมายเหตุ: ไม่ใส่ ?>