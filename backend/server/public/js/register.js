document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = form.username.value;
    const password = form.password.value;
    const ip = form.arduinoIp.value;
    const mac = form.arduinoMac.value;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, arduinoIP: ip, arduinoMAC: mac }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('ثبت‌نام موفق بود! حالا وارد شوید.');
        window.location.href = '/login.html';
      } else {
        alert(data.message || 'خطا در ثبت‌نام');
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور');
    }
  });
});
