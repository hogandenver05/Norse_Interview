document.addEventListener('DOMContentLoaded', function() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const emailDisplay = document.getElementById('emailDisplay');
    const coursesList = document.getElementById('coursesList');

    // Load user profile data
    async function loadProfileData() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                usernameDisplay.textContent = data.user.username;
                emailDisplay.textContent = data.user.email;
                displayCourses(data.user.courses);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    function displayCourses(courses) {
        coursesList.innerHTML = '';
    
        if (!courses || courses.length === 0) {
            coursesList.innerHTML = '<p style="color: #888;">No courses enrolled yet.</p>';
            return;
        }
    
        courses.forEach(course => {
            const progress = course.completion;
            let statusLabel;
    
            if (progress === 0) {
                statusLabel = '<span class="course-status-label yet">Yet to start</span>';
            } else if (progress === 100) {
                statusLabel = '<span class="course-status-label completed">Completed</span>';
            } else {
                statusLabel = '<span class="course-status-label in-progress">In progress</span>';
            }
    
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item';
            courseElement.innerHTML = `
                <h4>${course.title}</h4>
                <div class="course-progress">
                    <div class="progress">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="course-status-row">
                    ${statusLabel}
                    <span class="completed">${Math.round(progress)}%</span>
                </div>
            `;
            coursesList.appendChild(courseElement);
        });
    }
    

    // Load initial data
    loadProfileData();
}); 