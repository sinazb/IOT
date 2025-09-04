document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = form.username.value;
    const password = form.password.value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        alert('ورود موفق!');
        window.location.href = '/dashboard.html'; // در مرحله بعد می‌سازیمش
      } else {
        alert(data.message || 'نام کاربری یا رمز عبور اشتباه است');
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور');
    }
  });
});
