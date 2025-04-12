const path = require("path");
const fs = require("fs");
const express = require("express");
const router = express.Router();
function generateId(prefix) {
  return prefix + Math.floor(100 + Math.random() * 900);
}

const usersPath = path.join(__dirname, "../data/users.json");
const coursesPath = path.join(__dirname, "../data/courses.json");
const classesPath = path.join(__dirname, "../data/classes.json");
const registrationsPath = path.join(__dirname, "../data/registrations.json"); // ✅ ADD THIS LINE

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath));

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ user });
});

module.exports = router;

router.get("/courses", (req, res) => {
  const courses = JSON.parse(fs.readFileSync(coursesPath));
  res.json(courses);
});

router.get("/learning-path/:studentId", (req, res) => {
  const studentId = req.params.studentId;
  const users = JSON.parse(fs.readFileSync(usersPath));
  const registrations = JSON.parse(fs.readFileSync(registrationsPath));
  const courses = JSON.parse(fs.readFileSync(coursesPath));

  const student = users.find((u) => u.id === studentId && u.role === "student");

  const completed = student.completedCourses.map((c) => {
    const course = courses.find((course) => course.id === c.courseId);
    return { ...course, grade: c.grade };
  });

  const studentRegs = registrations.filter((r) => r.studentId === studentId);

  const inProgress = studentRegs
    .filter((r) => r.status === "approved")
    .map((r) => {
      const course = courses.find((c) => c.id === r.courseId);
      return course;
    });

  const pending = studentRegs
    .filter((r) => r.status === "pending")
    .map((r) => {
      const course = courses.find((c) => c.id === r.courseId);
      return course;
    });

  res.json({
    completed,
    inProgress,
    pending,
  });
});

// GET all courses with their classes
router.get("/admin/courses", (req, res) => {
  const courses = JSON.parse(fs.readFileSync(coursesPath));
  const classes = JSON.parse(fs.readFileSync(classesPath));

  const result = courses.map((course) => ({
    ...course,
    classes: classes.filter((cls) => cls.courseId === course.id),
  }));

  res.json(result);
});

// POST: Create a new course
router.post('/create-course', (req, res) => {
  const { name, category, prerequisites } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Course name and category are required.' });
  }

  const courses = JSON.parse(fs.readFileSync(coursesPath));

  const duplicate = courses.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    return res.status(400).json({ message: 'Course name already exists.' });
  }

  const newCourse = {
    id: generateId('CS'),
    name,
    category,
    prerequisites: prerequisites || [],
    status: 'open'
  };

  courses.push(newCourse);
  fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));

  return res.json({ message: 'Course created successfully.' });
});


// POST: Create a new class
router.post('/create-class', (req, res) => {
  const { courseId, instructorId, time, maxSeats } = req.body;

  if (!courseId || !instructorId || !time || !maxSeats) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const classes = JSON.parse(fs.readFileSync(classesPath));

  const newClass = {
    classId: generateId('CL'),
    courseId,
    instructorId,
    time,
    maxSeats,
    enrolledStudentIds: [],
    status: 'pending'
  };

  classes.push(newClass);
  fs.writeFileSync(classesPath, JSON.stringify(classes, null, 2));

  return res.json({ message: 'Class created successfully.' });
});


// POST: Approve a class
router.post("/admin/approve-class/:classId", (req, res) => {
  const classId = req.params.classId;
  const classes = JSON.parse(fs.readFileSync(classesPath));
  const registrations = JSON.parse(fs.readFileSync(registrationsPath));

  const cls = classes.find((c) => c.classId === classId);
  if (cls) {
    cls.status = "approved";
    registrations.forEach((r) => {
      if (r.classId === classId) r.status = "approved";
    });
    fs.writeFileSync(classesPath, JSON.stringify(classes, null, 2));
    fs.writeFileSync(registrationsPath, JSON.stringify(registrations, null, 2));
  }

  res.json({ message: "Class approved." });
});

// POST: Cancel a class
router.post("/admin/cancel-class/:classId", (req, res) => {
  const classId = req.params.classId;
  const classes = JSON.parse(fs.readFileSync(classesPath));
  const registrations = JSON.parse(fs.readFileSync(registrationsPath));

  const cls = classes.find((c) => c.classId === classId);
  if (cls) {
    cls.status = "canceled";
    registrations.forEach((r) => {
      if (r.classId === classId) r.status = "canceled";
    });
    fs.writeFileSync(classesPath, JSON.stringify(classes, null, 2));
    fs.writeFileSync(registrationsPath, JSON.stringify(registrations, null, 2));
  }

  res.json({ message: "Class canceled." });
});

router.get("/instructor/classes/:instructorId", (req, res) => {
  const instructorId = req.params.instructorId;
  const users = JSON.parse(fs.readFileSync(usersPath));
  const classes = JSON.parse(fs.readFileSync(classesPath));
  const courses = JSON.parse(fs.readFileSync(coursesPath));
  const registrations = JSON.parse(fs.readFileSync(registrationsPath));

  const myClasses = classes.filter(
    (cls) => cls.instructorId === instructorId && cls.status === "approved"
  );

  const result = myClasses.map((cls) => {
    const enrolled = registrations.filter(
      (r) => r.classId === cls.classId && r.status === "approved"
    );
    const students = enrolled.map((reg) =>
      users.find((u) => u.id === reg.studentId)
    );

    const course = courses.find((c) => c.id === cls.courseId);

    return {
      classId: cls.classId,
      courseId: course.id,
      courseName: course.name,
      students: students.map((s) => ({ id: s.id, username: s.username })),
    };
  });

  res.json(result);
});

router.post("/instructor/submit-grade", (req, res) => {
  const { studentId, classId, courseId, grade } = req.body;

  const users = JSON.parse(fs.readFileSync(usersPath));
  const registrations = JSON.parse(fs.readFileSync(registrationsPath));
  const student = users.find((u) => u.id === studentId);

  if (!student || student.role !== "student") {
    return res.status(404).json({ message: "Student not found" });
  }

  // Prevent duplicate submission for the same course + class
  const alreadyGraded = student.completedCourses.find(
    (c) => c.courseId === courseId && c.classId === classId
  );

  if (alreadyGraded) {
    return res.status(409).json({ message: "Grade already submitted" });
  }

  // Add grade for this specific class
  student.completedCourses.push({ courseId, classId, grade });

  // Remove registration record
  const regIndex = registrations.findIndex(
    (r) => r.studentId === studentId && r.courseId === courseId
  );
  if (regIndex !== -1) {
    registrations.splice(regIndex, 1);
  }

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  fs.writeFileSync(registrationsPath, JSON.stringify(registrations, null, 2));

  res.json({ message: "Grade submitted successfully" });
});



router.post("/register", (req, res) => {
  const { studentId, courseId, classId } = req.body;

  const users = JSON.parse(fs.readFileSync(usersPath));
  const courses = JSON.parse(fs.readFileSync(coursesPath));
  const classes = JSON.parse(fs.readFileSync(classesPath));
  const registrations = JSON.parse(fs.readFileSync(registrationsPath));

  const student = users.find((u) => u.id === studentId && u.role === "student");
  const course = courses.find((c) => c.id === courseId);
  const cls = classes.find(
    (cl) => cl.classId === classId && cl.courseId === courseId
  );

  if (!student || !course || !cls) {
    return res
      .status(404)
      .json({ message: "Invalid student, course, or class." });
  }

  if (cls.enrolledStudentIds.includes(studentId)) {
    return res.status(409).json({ message: "Already enrolled in this class." });
  }

  const completed = student.completedCourses.map((c) => c.courseId);
  const unmet = course.prerequisites.filter((pre) => !completed.includes(pre));
  if (unmet.length > 0) {
    return res
      .status(403)
      .json({ message: `Missing prerequisites: ${unmet.join(", ")}` });
  }

  if (course.status !== "open") {
    return res
      .status(403)
      .json({ message: "Course is not open for registration." });
  }

  if (cls.enrolledStudentIds.length >= cls.maxSeats) {
    return res.status(403).json({ message: "Selected class is full." });
  }

  // Register student
  cls.enrolledStudentIds.push(studentId);

  registrations.push({
    studentId,
    courseId,
    classId,
    status: "pending",
  });

  fs.writeFileSync(classesPath, JSON.stringify(classes, null, 2));
  fs.writeFileSync(registrationsPath, JSON.stringify(registrations, null, 2));

  return res.json({
    message: "Successfully registered. Awaiting admin approval.",
  });
});

router.get("/classes/:courseId", (req, res) => {
  const courseId = req.params.courseId.trim();
  const classes = JSON.parse(fs.readFileSync(classesPath));
  const instructors = JSON.parse(fs.readFileSync(usersPath)).filter(
    (u) => u.role === "instructor"
  );

  const filtered = classes
    .filter((cls) => cls.courseId.trim() === courseId)
    .map((cls) => {
      const instructor = instructors.find((i) => i.id === cls.instructorId);
      return {
        classId: cls.classId,
        instructorName: instructor?.username || "Unknown",
        time: cls.time,
        availableSeats: cls.maxSeats - cls.enrolledStudentIds.length,
      };
    });

  res.json(filtered);
});

router.get("/users", (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersPath));
  res.json(users);
});

router.get("/classes", (req, res) => {
  const classes = JSON.parse(fs.readFileSync(classesPath));
  res.json(classes);
});

router.put('/update-course', (req, res) => {
  const { courseId, name, category } = req.body;
  const courses = JSON.parse(fs.readFileSync(coursesPath));

  const course = courses.find(c => c.id === courseId);
  if (!course) return res.status(404).json({ message: 'Course not found.' });

  course.name = name;
  course.category = category;

  fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
  res.json({ message: 'Course updated successfully.' });
});


router.delete('/delete-course', (req, res) => {
  const { courseId } = req.body;
  let courses = JSON.parse(fs.readFileSync(coursesPath));
  const index = courses.findIndex(c => c.id === courseId);

  if (index === -1) return res.status(404).json({ message: 'Course not found.' });

  courses.splice(index, 1);
  fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
  res.json({ message: 'Course deleted successfully.' });
});

