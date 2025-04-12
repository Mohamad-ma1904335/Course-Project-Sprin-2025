function logout() {
  localStorage.removeItem('user');
  window.location.href = '/';
}

window.onload = async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'instructor') {
    window.location.href = '/';
    return;
  }

  document.getElementById('welcomeUser').innerText = `Welcome, ${user.username}`;

  const classes = await fetch('/api/classes').then(res => res.json());
  const users = await fetch('/api/users').then(res => res.json());
  const courses = await fetch('/api/courses').then(res => res.json());

  const myClasses = classes.filter(c => c.instructorId === user.id);

  renderInstructorClassOverview(myClasses, courses);
};



function renderInstructorClassOverview(classList, courses) {
  const container = document.getElementById('myClassList');
  container.innerHTML = '';

  if (classList.length === 0) {
    container.innerHTML = '<div class="empty-state">You are not assigned to any classes.</div>';
    return;
  }

  classList.forEach(cls => {
    const course = courses.find(c => c.id === cls.courseId);
    const div = document.createElement('div');
    div.className = 'class-card';
    div.innerHTML = `
    <h3>${course?.name || 'Unnamed Course'}</h3>
    <p><strong>Class ID:</strong> ${cls.classId}</p>
    <p><strong>Class Time:</strong> ${cls.time}</p>
    <p><strong>Enrolled Students:</strong> ${cls.enrolledStudentIds?.length || 0}</p>
    <a href="/pages/instructor-submit.html" class="view-link">Submit Grades</a>
  `;
  
    container.appendChild(div);
  });
}

