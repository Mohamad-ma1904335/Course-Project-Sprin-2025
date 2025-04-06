function logout() {
  localStorage.removeItem('user');
  window.location.href = '/';
}

const searchInput = document.getElementById('searchInput');
const coursesList = document.getElementById('coursesList');
let selectedCourseId = null;

async function fetchCourses() {
  const res = await fetch('http://localhost:3000/api/courses');
  return await res.json();
}

async function getRegisteredCourseIds(studentId) {
  const res = await fetch(`http://localhost:3000/api/learning-path/${studentId}`);
  const path = await res.json();
  return [...path.pending, ...path.inProgress].map(c => c.id);
}

function createStatusTag(status) {
  return `<span class="status-tag status-${status}">${status}</span>`;
}

async function renderCourses(courses, registeredIds) {
  coursesList.innerHTML = '';

  courses.forEach(course => {
    const isRegistered = registeredIds.includes(course.id);
    const courseCard = document.createElement('div');
    courseCard.className = 'course-item';

    courseCard.innerHTML = `
      <h4>${course.name}</h4>
      <p>Category: ${course.category}</p>
      <p>Status: ${createStatusTag(course.status)}</p>
      <button ${isRegistered ? 'disabled' : ''} onclick="showClassOptions('${course.id}', 'classes-${course.id}')">
        ${isRegistered ? 'Already Registered' : 'Show Classes'}
      </button>
      <div id="classes-${course.id}" class="class-options"></div>
    `;

    coursesList.appendChild(courseCard);
  });
}




async function showClassOptions(courseId, containerId) {
  const container = document.getElementById(containerId);

  // Toggle: if already visible, hide it
  if (container.style.display === 'block') {
    container.style.display = 'none';
    container.innerHTML = ''; // Optional: clear contents
    return;
  }

  // Otherwise, show and load the classes
  container.style.display = 'block';
  container.innerHTML = '<p>Loading classes...</p>';

  const res = await fetch('http://localhost:3000/api/classes/' + courseId);
  const classes = await res.json();

  if (classes.length === 0) {
    container.innerHTML = '<p>No available classes for this course.</p>';
    return;
  }

  container.innerHTML = '';
  classes.forEach(cls => {
    const div = document.createElement('div');
    div.className = 'class-card';
    div.innerHTML = `
      <div>
        <strong>Instructor:</strong> ${cls.instructorName}<br>
        <strong>Time:</strong> ${cls.time}<br>
        <strong>Seats Left:</strong> ${cls.availableSeats}
      </div>
      <button onclick="registerClass('${courseId}', '${cls.classId}')">Register in this Class</button>
    `;
    container.appendChild(div);
  });
}


async function registerClass(courseId, classId) {
  const user = JSON.parse(localStorage.getItem('user'));
  const res = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId: user.id,
      courseId,
      classId
    })
  });

  const data = await res.json();
  alert(data.message);
  window.location.reload();
}

window.onload = async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'student') {
    window.location.href = '/';
    return;
  }

  document.getElementById('welcomeUser').innerText = `Welcome, ${user.username}`;
  const allCourses = await fetchCourses();
  const registeredIds = await getRegisteredCourseIds(user.id);
  renderCourses(allCourses, registeredIds);

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = allCourses.filter(c =>
      c.name.toLowerCase().includes(query) || c.category.toLowerCase().includes(query)
    );
    renderCourses(filtered, registeredIds);
  });
};

// ✅ expose inline handler
window.showClassOptions = showClassOptions;
