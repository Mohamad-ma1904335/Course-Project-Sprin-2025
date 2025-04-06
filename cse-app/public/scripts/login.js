document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      const dashboard = {
        student: '/pages/student-dashboard.html',
        instructor: '/pages/instructor-dashboard.html',
        admin: '/pages/admin-dashboard.html'
      }[data.user.role];
      window.location.href = dashboard;
    } else {
      document.getElementById('error').innerText = data.message;
    }
  } catch (err) {
    document.getElementById('error').innerText = 'Server error';
  }
});
