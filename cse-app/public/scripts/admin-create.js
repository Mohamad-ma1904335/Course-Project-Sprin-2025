function logout() {
  localStorage.removeItem("user");
  window.location.href = "/";
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.innerText = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = "#28a745";
  toast.style.color = "white";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
  toast.style.zIndex = "9999";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

async function loadOptions() {
    const courses = await fetch('/api/courses').then(res => res.json());
    const users = await fetch('/api/users').then(res => res.json());
    const instructors = users.filter(u => u.role === 'instructor');
  
    const prereqSelect = document.getElementById('coursePrerequisites');
    const courseSelect = document.getElementById('classCourse');
    const instructorSelect = document.getElementById('classInstructor');
  
    // ✅ Clear previous options to avoid duplication
    prereqSelect.innerHTML = '';
    courseSelect.innerHTML = '';
    instructorSelect.innerHTML = '';
  
    // Re-populate courses for prerequisites and class creation
    courses.forEach(course => {
      const prereqOption = document.createElement('option');
      prereqOption.value = course.id;
      prereqOption.textContent = course.name;
      prereqSelect.appendChild(prereqOption);
  
      const courseOption = document.createElement('option');
      courseOption.value = course.id;
      courseOption.textContent = course.name;
      courseSelect.appendChild(courseOption);
    });
  
    // Re-populate instructors
    instructors.forEach(instructor => {
      const option = document.createElement('option');
      option.value = instructor.id;
      option.textContent = instructor.username;
      instructorSelect.appendChild(option);
    });

    // Render course list for editing/deletion
    renderCourseList(courses);

}
  

document.getElementById("courseForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("courseName").value.trim();
  const category = document.getElementById("courseCategory").value.trim();
  const prereqOptions = [
    ...document.getElementById("coursePrerequisites").selectedOptions,
  ];
  const prerequisites = prereqOptions.map((o) => o.value);

  const res = await fetch("/api/create-course", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, category, prerequisites }),
  });

  const data = await res.json();
  showToast(data.message);
  e.target.reset();
  loadOptions(); // refresh dropdowns
  
});

document.getElementById("classForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const courseId = document.getElementById("classCourse").value;
  const instructorId = document.getElementById("classInstructor").value;
  const time = document.getElementById("classTime").value.trim();
  const maxSeats = parseInt(document.getElementById("maxSeats").value);

  const res = await fetch("/api/create-class", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId, instructorId, time, maxSeats }),
  });

  const data = await res.json();
  showToast(data.message);
  e.target.reset();
  loadOptions();   // refresh to show updated class options
});

window.onload = loadOptions;

function renderCourseList(courses) {
    const container = document.getElementById('courseList');
    container.innerHTML = '';
  
    if (courses.length === 0) {
      container.innerHTML = '<p>No courses found.</p>';
      return;
    }
  
    courses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.innerHTML = `
        <h4>${course.name}</h4>
        <p><strong>Category:</strong> ${course.category}</p>
        <p><strong>Prerequisites:</strong> ${course.prerequisites?.join(', ') || 'None'}</p>
        <div class="actions">
          <button onclick="editCourse('${course.id}')">📝 Edit</button>
          <button onclick="deleteCourse('${course.id}')">❌ Delete</button>
        </div>
      `;
      container.appendChild(card);
    });
}
  
function editCourse(courseId) {
    const name = prompt('Enter new course name:');
    const category = prompt('Enter new category:');
    if (!name || !category) return alert('All fields are required.');
  
    fetch('/api/update-course', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, name, category })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message);
        loadOptions();
      });
  }
  
  function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;
  
    fetch('/api/delete-course', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId })
    })
      .then(res => res.json())
      .then(data => {
        showToast(data.message);
        loadOptions();
      });
  }
  