const $ = id => document.getElementById(id);
const form = $('regForm'), result = $('result');
// แก้: เปลี่ยนชื่อจาก name เป็น nameInput ไม่ให้ชนกับ window.name
const nameInput = $('name'), email = $('email'), password = $('password'),
      confirmPw = $('confirm'), terms = $('terms'), bar = $('bar');

function setError(input, text) {
  const field = input.closest('.field');
  field.classList.toggle('error', !!text);
  field.querySelector('.msg').textContent = text;
  return !text;
}

password.addEventListener('input', () => {
  const p = password.value;
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  bar.style.width = (score * 25) + '%';
  bar.style.background = ['#ef4444', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'][score];
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.textContent = '';

  const ok = [
    setError(nameInput, nameInput.value.trim() ? '' : 'กรุณากรอกชื่อ'),
    setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? '' : 'อีเมลไม่ถูกต้อง'),
    setError(password, password.value.length >= 8 ? '' : 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
    setError(confirmPw, confirmPw.value === password.value ? '' : 'รหัสผ่านไม่ตรงกัน'),
    setError(terms, terms.checked ? '' : 'กรุณายอมรับข้อตกลง'),
  ].every(Boolean);
  if (!ok) return;

  const btn = form.querySelector('.submit');
  btn.disabled = true;
  btn.textContent = 'กำลังสมัคร...';

  try {
    // แก้: ส่งข้อมูลจริงไปที่ process-register.php (แทน setTimeout จำลอง)
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ');
    }
    if (!data.ok) throw new Error(data.message || 'สมัครไม่สำเร็จ');

    result.style.color = '#16a34a';
    result.textContent = 'สมัครสำเร็จ';
    // แก้: ไปหน้าล็อกอิน (เดิมไป profile.html ทั้งที่ยังไม่ได้ล็อกอิน)
    window.location.href = 'login.html';   // อยู่โฟลเดอร์เดียวกับ register.html
  } catch (err) {
    result.style.color = '#ef4444';
    result.textContent = err.message;
    btn.disabled = false;
    btn.textContent = 'สมัครสมาชิก';
  }
});