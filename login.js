const $ = id => document.getElementById(id);
const form = $('loginForm'), result = $('result');
const email = $('email'), password = $('password');
const fields = { email, password };

// ปุ่ม แสดง/ซ่อน รหัสผ่าน
const toggle = $('toggle');
toggle.addEventListener('click', () => {
  const show = password.type === 'password';
  password.type = show ? 'text' : 'password';
  toggle.textContent = show ? 'ซ่อน' : 'แสดง';
});

// แสดง/ล้างข้อความ error ใต้ช่องกรอก เป็นตัวอักษรสีแดง
function setError(input, text) {
  const field = input.closest('.field');
  const msg = field.querySelector('.msg');
  field.classList.toggle('error', !!text);
  msg.textContent = text;
  msg.style.color = text ? '#ef4444' : '';
  return !text;
}

// พิมพ์แก้ไขแล้วให้ข้อความ error ของช่องนั้นหายไป
[email, password].forEach(input => input.addEventListener('input', () => setError(input, '')));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.textContent = '';

  const ok = [
    setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? '' : 'อีเมลไม่ถูกต้อง'),
    setError(password, password.value ? '' : 'กรุณากรอกรหัสผ่าน'),
  ].every(Boolean);
  if (!ok) return;

  const btn = form.querySelector('.submit');
  btn.disabled = true;
  btn.textContent = 'กำลังเข้าสู่ระบบ...';
  let redirecting = false;

  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ');
    }

    if (data.ok) {
      redirecting = true;
      window.location.href = data.redirect;
      return;
    }

    // แสดงข้อความใต้ช่องที่ผิด (email หรือ password)
    setError(fields[data.field] || password, data.message || 'เข้าสู่ระบบไม่สำเร็จ');

    // ผิดครบกำหนด -> รอให้อ่านข้อความแล้วค่อยไปหน้าสร้างรหัสใหม่
    if (data.redirect) {
      redirecting = true;
      setTimeout(() => { window.location.href = data.redirect; }, 1500);
    }
  } catch (err) {
    result.style.color = '#ef4444';
    result.textContent = err.message;
  } finally {
    if (!redirecting) {
      btn.disabled = false;
      btn.textContent = 'เข้าสู่ระบบ';
    }
  }
});