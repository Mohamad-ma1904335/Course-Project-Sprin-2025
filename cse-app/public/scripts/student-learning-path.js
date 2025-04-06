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
  
    const completedList = document.getElementById('completedList');
    const inProgressList = document.getElementById('inProgressList');
    const pendingList = document.getElementById('pendingList');
  
    if (path.completed.length === 0) {
      completedList.innerHTML = '<li>None yet.</li>';
    } else {
      path.completed.forEach(c => {
        const li = document.createElement('li');
        li.innerText = `${c.name} - Grade: ${c.grade}`;
        completedList.appendChild(li);
      });
    }
  
    if (path.inProgress.length === 0) {
      inProgressList.innerHTML = '<li>None yet.</li>';
    } else {
      path.inProgress.forEach(c => {
        const li = document.createElement('li');
        li.innerText = `${c.name}`;
        inProgressList.appendChild(li);
      });
    }
  
    if (path.pending.length === 0) {
      pendingList.innerHTML = '<li>None yet.</li>';
    } else {
      path.pending.forEach(c => {
        const li = document.createElement('li');
        li.innerText = `${c.name}`;
        pendingList.appendChild(li);
      });
    }
  }
  
  window.onload = loadLearningPath;
  