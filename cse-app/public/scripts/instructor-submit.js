function logout() {
  localStorage.removeItem("user");
  window.location.href = "/";
}

window.onload = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== "instructor") {
    window.location.href = "/";
    return;
  }

  document.getElementById(
    "welcomeUser"
  ).innerText = `Welcome, ${user.username}`;

  const classes = await fetch("/api/classes").then((res) => res.json());
  const users = await fetch("/api/users").then((res) => res.json());
  const courses = await fetch("/api/courses").then((res) => res.json());

  const myClasses = classes.filter((c) => c.instructorId === user.id);

  renderInstructorGradeForms(myClasses, users, courses);
};

function renderInstructorGradeForms(classList, users, courses) {
    const container = document.getElementById('classContainer');
    container.innerHTML = '';
  
    if (classList.length === 0) {
      container.innerHTML = '<p>You are not assigned to any classes.</p>';
      return;
    }
  
    classList.forEach(cls => {
      const course = courses.find(c => c.id === cls.courseId);
      const enrolledStudents = users.filter(u => cls.enrolledStudentIds.includes(u.id));
  
      const card = document.createElement('div');
      card.className = 'class-card';
      card.innerHTML = `
        <h3>${course?.name || 'Unnamed Course'}</h3>
        <p><strong>Time:</strong> ${cls.time}</p>
        <p><strong>Students:</strong></p>
        <div class="student-list">
          ${enrolledStudents.map(student => {
            const hasCompleted = student.completedCourses.some(c => c.courseId === cls.courseId);
            const submittedGrade = student.completedCourses.find(c => c.courseId === cls.courseId && c.classId === cls.classId)?.grade;
            const disabled = submittedGrade ? 'disabled' : '';
            const options = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'FA', 'FB', 'I'].map(grade => `
              <option value="${grade}" ${grade === submittedGrade ? 'selected' : ''}>${grade}</option>
            `).join('');
            
            return `
              <div class="student-entry">
                <span>${student.username}</span>
                <select id="grade-${cls.classId}-${student.id}" ${disabled}>
                  <option value="">Select Grade</option>
                  ${options}
                </select>
                <button class="submit-grade-btn" onclick="submitGrade('${cls.classId}', '${cls.courseId}', '${student.id}')" ${disabled}>
                  ${submittedGrade ? '✔ Submitted' : 'Submit'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
  
      container.appendChild(card);
    });
}
  

async function submitGrade(classId, courseId, studentId) {
  const input = document.getElementById(`grade-${classId}-${studentId}`);
  const grade = input.value.trim();

  if (!grade) {
    alert("Please enter a grade.");
    return;
  }

  try {
    const res = await fetch("/api/instructor/submit-grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, classId, courseId, grade }),
    });

    const contentType = res.headers.get("content-type");

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Something went wrong");
    }

    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      alert(data.message);
      input.value = "";
      input.disabled = true;
      input.style.backgroundColor = "#e0ffe0";
      input.nextElementSibling.innerText = "✔ Submitted";
      input.nextElementSibling.disabled = true;
    } else {
      throw new Error("Invalid JSON response from server");
    }
  } catch (err) {
    console.error("Error submitting grade:", err);
    alert("Failed to submit grade. " + err.message);
  }
}
