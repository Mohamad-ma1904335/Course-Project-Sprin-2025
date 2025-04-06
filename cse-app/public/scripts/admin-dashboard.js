function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
  
  async function loadCourses() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      window.location.href = 'login.html';
      return;
    }
  
    document.getElementById('welcomeUser').innerText = `Welcome, ${user.username}`;
  
    const res = await fetch('http://localhost:3000/api/admin/courses');
    const data = await res.json();
    renderCourseList(data);
  }
  
  function renderCourseList(courses) {
    const list = document.getElementById('courseList');
    list.innerHTML = '';
  
    courses.forEach(course => {
      const div = document.createElement('div');
      div.className = 'course-item';
      div.innerHTML = `
        <h4>${course.name}</h4>
        <p>Category: ${course.category}</p>
        <p>Status: ${course.status}</p>
        <ul>
          ${course.classes.map(cls => `
            <li>
              Class ID: ${cls.classId} | Instructor: ${cls.instructorId} | Enrolled: ${cls.enrolledStudentIds.length} / ${cls.maxSeats} | Status: ${cls.status}
              ${cls.status === 'pending' ? `
                <button onclick="approveClass('${cls.classId}')">Approve</button>
                <button onclick="cancelClass('${cls.classId}')">Cancel</button>
              ` : ''}
            </li>
          `).join('')}
        </ul>
      `;
      list.appendChild(div);
    });
  }
  
  function showCreateForm() {
    document.getElementById('createForm').style.display = 'block';
  }
  
  async function createCourse() {
    const name = document.getElementById('newCourseName').value;
    const category = document.getElementById('newCourseCategory').value;
  
    const res = await fetch('http://localhost:3000/api/admin/create-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category })
    });
  
    const data = await res.json();
    alert(data.message);
    loadCourses();
  }
  
  async function approveClass(classId) {
    await fetch(`http://localhost:3000/api/admin/approve-class/${classId}`, { method: 'POST' });
    loadCourses();
  }
  
  async function cancelClass(classId) {
    await fetch(`http://localhost:3000/api/admin/cancel-class/${classId}`, { method: 'POST' });
    loadCourses();
  }
  
  window.onload = loadCourses;
  