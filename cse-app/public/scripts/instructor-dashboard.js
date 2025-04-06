function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
  
  async function loadClasses() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'instructor') {
      window.location.href = 'login.html';
      return;
    }
  
    document.getElementById('welcomeUser').innerText = `Welcome, ${user.username}`;
  
    const res = await fetch(`http://localhost:3000/api/instructor/classes/${user.id}`);
    const data = await res.json();
    renderClasses(data);
  }
  
  function renderClasses(classes) {
    const container = document.getElementById('classList');
    container.innerHTML = '';
  
    classes.forEach(cls => {
      const classDiv = document.createElement('div');
      classDiv.className = 'course-item';
      classDiv.innerHTML = `<h4>Course: ${cls.courseName}</h4><ul>`;
  
      cls.students.forEach(student => {
        classDiv.innerHTML += `
          <li>
            ${student.username} (${student.id})
            <input type="text" placeholder="Grade" id="grade-${cls.classId}-${student.id}" />
            <button onclick="submitGrade('${cls.classId}', '${student.id}', '${cls.courseId}')">Submit</button>
          </li>
        `;
      });
  
      classDiv.innerHTML += '</ul>';
      container.appendChild(classDiv);
    });
  }
  
  async function submitGrade(classId, studentId, courseId) {
    const inputId = `grade-${classId}-${studentId}`;
    const grade = document.getElementById(inputId).value;
  
    const res = await fetch('http://localhost:3000/api/instructor/submit-grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, studentId, courseId, grade })
    });
  
    const data = await res.json();
    alert(data.message);
  }
  
  window.onload = loadClasses;
  