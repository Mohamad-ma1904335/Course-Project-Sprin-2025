function logout() {
  localStorage.removeItem('user');
  window.location.href = '/';
}

async function loadLearningPath() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'student') {
    window.location.href = '/';
    return;
  }

  document.getElementById('welcomeUser').innerText = `Welcome, ${user.username}`;

  const res = await fetch(`http://localhost:3000/api/learning-path/${user.id}`);
  const path = await res.json();

  const classData = await fetch('http://localhost:3000/api/classes');
  const allClasses = await classData.json();

  const instructorData = await fetch('http://localhost:3000/api/users');
  const allUsers = await instructorData.json();
  const instructors = allUsers.filter(u => u.role === 'instructor');

  renderList('completedList', path.completed, 'completed');
  renderList('inProgressList', path.inProgress, 'inProgress', allClasses, instructors);
  renderList('pendingList', path.pending, 'pending', allClasses, instructors);
}

function renderList(containerId, items, status, classList = [], instructors = []) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = '<p>None yet.</p>';
    return;
  }

  items.forEach(course => {
    const card = document.createElement('div');
    card.className = 'course-card';

    let info = '';
    if (status === 'completed') {
      info = `<div class="status status-${status}">✅ Completed</div>
              <h4>${course.name}</h4>
              <p>Grade: ${course.grade}</p>`;
    } else {
      const classInfo = classList.find(cls => cls.courseId === course.id && cls.enrolledStudentIds.includes(JSON.parse(localStorage.getItem('user')).id));
      const instructor = instructors.find(i => i.id === classInfo?.instructorId);

      info = `<div class="status status-${status}">${status === 'inProgress' ? '🔄 In Progress' : '⏳ Pending Approval'}</div>
              <h4>${course.name}</h4>
              <p>Instructor: ${instructor?.username || 'N/A'}</p>
              <p>Time: ${classInfo?.time || 'N/A'}</p>`;
    }

    card.innerHTML = info;
    container.appendChild(card);
  });
}

window.onload = loadLearningPath;
