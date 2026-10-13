<?php
// (ใช้เป็นไฟล์ Index.php) หน้าสมาชิกทั้งหมด: ด้านบน = อาจารย์ (admin) / ด้านล่าง = นักศึกษา (member)
// ล็อกอินแล้วดูได้ทั้ง admin และ member
session_start();
$open_connect = 1;

$connect = $connect ?? null;
foreach ([__DIR__ . '/../connect.php', __DIR__ . '/connect.php'] as $connect_path) {
    if (file_exists($connect_path)) {
        require $connect_path;
        break;
    }
}

if (!isset($connect) && isset($conn)) { $connect = $conn; }
if (!isset($connect) && isset($mysqli)) { $connect = $mysqli; }
if (!isset($connect) && isset($db)) { $connect = $db; }

if (!isset($connect) || !($connect instanceof mysqli)) {
    http_response_code(500);
    die('Database connection is not initialized.');
}

$doc_root = rtrim(str_replace('\\', '/', realpath($_SERVER['DOCUMENT_ROOT'])), '/');
$base_url = substr(str_replace('\\', '/', realpath(__DIR__ . '/..')), strlen($doc_root));

if (!isset($_SESSION['id_account'])) {
    header('Location: ' . $base_url . '/Login-Logout/login.html');
    exit;
}

// สมาชิกทั้งหมด (แสดงชื่อ รูป เบอร์ติดต่อ; ไม่แสดงอีเมล)
$result = mysqli_query($connect,
    "SELECT id_account, username_account, role_account, images_account, phone_account
     FROM account ORDER BY username_account ASC");

$teachers = [];   // role = admin  -> อาจารย์
$students = [];   // role = member -> นักศึกษา
while ($m = mysqli_fetch_assoc($result)) {
    if ($m['role_account'] === 'admin') { $teachers[] = $m; } else { $students[] = $m; }
}

// งานทั้งหมด: จัดกลุ่มตามผู้รับงาน (นักศึกษา) และตามผู้มอบหมาย (อาจารย์)
$assigned = [];   // [id ผู้รับงาน]   => รายการงานที่ได้รับมอบหมาย
$created  = [];   // [id ผู้มอบหมาย] => รายการงานที่ตัวเองมอบหมาย
$tasks_res = mysqli_query($connect,
    "SELECT id_task, title_task, assignee_task, created_by_task, is_leader_task
     FROM task ORDER BY id_task DESC");
while ($t = mysqli_fetch_assoc($tasks_res)) {
    $assigned[(int)$t['assignee_task']][]  = $t;
    $created[(int)$t['created_by_task']][] = $t;
}

// งานที่ถูกเพิ่มเป็นสมาชิกในทีม (ตาราง task_member) นับเป็นงานที่รับผิดชอบด้วย
try {
    $tm = mysqli_query($connect,
        "SELECT m.account_id, t.id_task, t.title_task
         FROM task_member m JOIN task t ON t.id_task = m.task_id ORDER BY t.id_task DESC");
    while ($r = mysqli_fetch_assoc($tm)) {
        $assigned[(int)$r['account_id']][] = ['id_task' => $r['id_task'], 'title_task' => $r['title_task'], 'is_leader_task' => 0];
    }
} catch (Throwable $e) { /* ยังไม่ได้สร้างตาราง task_member */ }

function member_image(string $base_url, ?string $file): string {
    $file = basename((string)$file);
    foreach (['images/profile/', 'images_account/'] as $dir) {
        if ($file !== '' && is_file(__DIR__ . '/../' . $dir . $file)) {
            return $base_url . '/' . $dir . rawurlencode($file);
        }
    }
    return $base_url . '/images/Profile.png';
}

function h($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

// $tasks_by_user = งานของแต่ละคน, $task_header = หัวคอลัมน์งาน, $show_leader = แสดงป้ายหัวหน้างานหรือไม่
function render_members(array $rows, array $tasks_by_user, string $base_url, string $task_header, bool $show_leader): void {
    if (count($rows) === 0) {
        echo '<p class="muted">ยังไม่มีข้อมูล</p>';
        return;
    }
    $kanban = $base_url . '/menubar/' . rawurlencode('Kanban.php');
    echo '<div class="table-scroll"><table style="table-layout:fixed;width:100%"><colgroup><col style="width:56px"><col style="width:24%"><col style="width:18%"><col></colgroup><tr><th></th><th>ชื่อผู้ใช้</th><th>เบอร์ติดต่อ</th><th>' . h($task_header) . '</th></tr>';
    foreach ($rows as $m) {
        $uid   = (int)$m['id_account'];
        $phone = trim((string)$m['phone_account']) !== '' ? h($m['phone_account']) : '-';
        echo '<tr>';
        echo '<td style="width:56px"><img src="' . h(member_image($base_url, $m['images_account'])) . '" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover"></td>';
        echo '<td>' . h($m['username_account']) . '</td>';
        echo '<td>' . $phone . '</td>';
        echo '<td>';
        if (empty($tasks_by_user[$uid])) {
            echo '-';
        } else {
            foreach ($tasks_by_user[$uid] as $t) {
                echo '<div><a class="mt-link" href="' . h($kanban . '?task=' . (int)$t['id_task']) . '">' . h($t['title_task']) . '</a>';
                if ($show_leader && $t['is_leader_task']) {
                    echo ' <span class="badge badge-admin">หัวหน้างาน</span>';
                }
                echo '</div>';
            }
        }
        echo '</td></tr>';
    }
    echo '</table></div>';
}

$active = 'members';
$page_title = 'สมาชิกทั้งหมด';
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo h($page_title); ?></title>
    <link rel="stylesheet" href="<?php echo $base_url; ?>/style.css?v=<?php echo filemtime(__DIR__ . '/../style.css'); ?>">
    <style>
        /* ลิงก์ชื่องาน (a ใน style.css เป็นสีขาว จึงกำหนดสีเอง) */
        .mt-link { color: #1d4ed8; text-decoration: none; }
        .mt-link:hover { text-decoration: underline; }
    </style>
</head>
<body class="admin-body">
    <div class="container admin-shell">
        <div class="admin-layout">
            <?php
            // เลือกไฟล์เมนูตามบทบาท: admin ใช้ Menubar.php / สมาชิกใช้ไฟล์ที่ชื่อ Menubar...member...php
            $menu_path = __DIR__ . '/Menubar.php';
            if (($_SESSION['role_account'] ?? '') !== 'admin') {
                $found = glob(__DIR__ . '/[Mm]enubar*[Mm]ember*.[Pp][Hh][Pp]');
                if (!empty($found)) { $menu_path = $found[0]; }
            }
            require $menu_path;
            ?>
            <main class="admin-main">

                <!-- ด้านบน: อาจารย์ (admin) แสดงงานที่ตัวเองมอบหมาย -->
                <div class="panel" style="margin-top:0">
                    <h2>อาจารย์ (<?php echo count($teachers); ?>)</h2>
                    <?php render_members($teachers, $created, $base_url, 'งานที่มอบหมาย', false); ?>
                </div>

                <!-- ด้านล่าง: นักศึกษา (member) แสดงงานที่รับผิดชอบ -->
                <div class="panel">
                    <h2>นักศึกษา (<?php echo count($students); ?>)</h2>
                    <?php render_members($students, $assigned, $base_url, 'งานที่รับผิดชอบ', true); ?>
                </div>

            </main>
        </div>
    </div>
</body>
</html>