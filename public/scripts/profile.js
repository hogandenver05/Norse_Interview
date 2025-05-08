// profile.js

document.addEventListener('DOMContentLoaded', async function() {
    const decodeToken = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    const TOKEN = localStorage.getItem('token');
    if (!TOKEN) return;
    const CURRENT_USER = decodeToken(TOKEN)?.email;
    if (!CURRENT_USER) return;

    try {
        const response = await fetch(`http://localhost:3000/api/users/${CURRENT_USER}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch user info');
        const user = await response.json();

        document.getElementById('username').value = user.username || '';
        document.getElementById('email').value = user.email || '';

        // Show number of courses
        const coursesCount = document.getElementById('coursesCount');
        if (user.enrolledCourses && user.enrolledCourses.length > 0) {
            coursesCount.innerHTML = `Registered Courses: <b>${user.enrolledCourses.length}</b>`;
        } else {
            coursesCount.innerHTML = 'No courses registered.';
        }

        // Show number of interviews
        const interviewsCount = document.getElementById('interviewsCount');
        if (user.interviews && user.interviews.length > 0) {
            interviewsCount.innerHTML = `Registered Interviews: <b>${user.interviews.length}</b>`;
        } else {
            interviewsCount.innerHTML = 'No interviews registered.';
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }

    // Handle profile update
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const updatedUser = {
            username: document.getElementById('username').value.trim()
        };
        try {
            const res = await fetch(`http://localhost:3000/api/users/${CURRENT_USER}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedUser)
            });
            if (!res.ok) throw new Error('Failed to update profile');
            alert('Profile updated successfully!');
        } catch (err) {
            alert('Error updating profile.');
            console.error(err);
        }
    });

    // Handle close (X) button
    document.getElementById('closeProfileBtn').addEventListener('click', function() {
        window.history.back();
    });
}); 