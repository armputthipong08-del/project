<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['id_account'])) {
    echo json_encode(['ok' => false, 'message' => 'Unauthorized']);
    exit;
}

echo json_encode([
    'ok' => true,
    'user' => [
        'id_account' => $_SESSION['id_account'],
        'username_account' => $_SESSION['username_account'] ?? '',
        'role_account' => $_SESSION['role_account'] ?? 'member'
    ]
], JSON_UNESCAPED_UNICODE);