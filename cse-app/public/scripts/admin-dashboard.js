function logout() {
  localStorage.removeItem('user');
  window.location.href = '/';
}

async function fetchData() {
  const courses = await fetch('/api/courses').then(res => res.json());
  const classes = await fetch('/api/classes').then(res => res.json());
  const users = await fetch('/api/users').then(res => res.json());

  const instructors = users.filter(u => u.role === 'instructor');

  renderCourses(courses, classes, instructors);
}

function renderCourses(courses, classes, instructors) {
  const container = document.getElementById('courseContainer');
  container.innerHTML = '';

  courses.forEach(course => {
    const courseDiv = document.createElement('div');
    courseDiv.className = 'course-card';
    courseDiv.innerHTML = `
      <h3>${course.name}</h3>
      <p>Category: ${course.category}</p>
      <p>Status: ${course.status}</p>
    `;

    const relatedClasses = classes.filter(c => c.courseId === course.id);
    if (relatedClasses.length > 0) {
      relatedClasses.forEach(cls => {
        const instructor = instructors.find(i => i.id === cls.instructorId);
        const enrolled = cls.enrolledStudentIds.length;

        // Determine button states based on status
        let approveDisabled = '';
        let cancelDisabled = '';
        let approveLabel = 'Approve';
        let cancelLabel = 'Cancel';

        if (cls.status === 'approved') {
          approveDisabled = 'disabled';
          approveLabel = '✔️ Approved';
        } else if (cls.status === 'canceled') {
          cancelDisabled = 'disabled';
          cancelLabel = '❌ Canceled';
        }

        const classDiv = document.createElement('div');
        classDiv.className = 'class-entry';
        classDiv.setAttribute('data-class-id', cls.classId);
        classDiv.innerHTML = `
          <p><strong>Instructor:</strong> ${instructor?.username || 'Unknown'}</p>
          <p><strong>Time:</strong> ${cls.time}</p>
          <p><strong>Enrolled Students:</strong> ${enrolled}</p>
          <p class="class-status"><strong>Status:</strong> ${cls.status}</p>
          <div class="actions">
            <button class="approve-btn" ${approveDisabled} onclick="approveClass('${cls.classId}')">${approveLabel}</button>
            <button class="cancel-btn" ${cancelDisabled} onclick="cancelClass('${cls.classId}')">${cancelLabel}</button>
          </div>
        `;

        courseDiv.appendChild(classDiv);
      });
    } else {
      courseDiv.innerHTML += '<p>No classes available.</p>';
    }

    container.appendChild(courseDiv);
  });
}


async function approveClass(classId) {
  const res = await fetch(`/api/admin/approve-class/${classId}`, {
    method: 'POST'
  });
  const data = await res.json();
  alert(data.message);

  const classCard = document.querySelector(`[data-class-id="${classId}"]`);
  if (classCard) {
    const approveBtn = classCard.querySelector('.approve-btn');
    const cancelBtn = classCard.querySelector('.cancel-btn');
    const statusLine = classCard.querySelector('.class-status');

    // Update button states
    approveBtn.innerHTML = '✔️ Approved';
    approveBtn.disabled = true;
    approveBtn.style.opacity = '0.6';

    cancelBtn.disabled = false;
    cancelBtn.innerHTML = 'Cancel';
    cancelBtn.style.opacity = '1';

    // Update status line
    if (statusLine) {
      statusLine.textContent = 'Status: approved';
    }
  }
}



async function cancelClass(classId) {
  const res = await fetch(`/api/admin/cancel-class/${classId}`, {
    method: 'POST'
  });
  const data = await res.json();
  alert(data.message);

  const classCard = document.querySelector(`[data-class-id="${classId}"]`);
  if (classCard) {
    const approveBtn = classCard.querySelector('.approve-btn');
    const cancelBtn = classCard.querySelector('.cancel-btn');
    const statusLine = classCard.querySelector('.class-status');

    // Update button states
    cancelBtn.innerHTML = '❌ Canceled';
    cancelBtn.disabled = true;
    cancelBtn.style.opacity = '0.6';

    approveBtn.disabled = false;
    approveBtn.innerHTML = 'Approve';
    approveBtn.style.opacity = '1';

    // Update status line
    if (statusLine) {
      statusLine.textContent = 'Status: canceled';
    }
  }
}



window.onload = fetchData;
