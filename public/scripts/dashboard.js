document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = 'hogand6'; // Replace with dynamic user session

    // Fetch data from API
    async function getData(endpoint) {
        try {
            const response = await fetch(`/api/${endpoint}`);
            const data = await response.json();
            return data[endpoint];
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return [];
        }
    }

    // Check if user is admin
    async function isAdmin() {
        const users = await getData('users');
        const user = users.find(u => u.username === currentUser);
        return user?.isAdmin || false;
    }

    // Render courses
    async function renderCourses() {
        const courses = await getData('courses');
        const users = await getData('users');
        const user = users.find(u => u.username === currentUser);
        
        const myCoursesContainer = document.getElementById('my-courses-container');
        const libraryContainer = document.getElementById('course-library-container');
        myCoursesContainer.innerHTML = '';
        libraryContainer.innerHTML = '';
    
        // Use Promise.all to handle async createCourseCard calls
        const cards = await Promise.all(courses.map(async (course) => {
            const isEnrolled = user?.enrolledCoursesById?.includes(course.id);
            return await createCourseCard(course, isEnrolled);
        }));
    
        // Append cards to the correct containers
        courses.forEach((course, index) => {
            const isEnrolled = user?.enrolledCoursesById?.includes(course.id);
            if (isEnrolled) {
                myCoursesContainer.innerHTML += cards[index];
            } else {
                libraryContainer.innerHTML += cards[index];
            }
        });
    }

    // Create course card HTML
    // TODO: I have the non-admin user layout to have the My Courses and Course Library sections, 
    // but the admin panel should just populate the course library and show edit and delete options
    async function createCourseCard(course, isEnrolled) {
        const admin = await isAdmin();
        return `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="position-relative">
                        <img src="../${course.image}" class="card-img-top" alt="${course.title}">
                        ${admin ? `
                            <span class="position-absolute top-0 start-0 m-2 btn btn-warning btn-round d-flex align-items-center justify-content-center" style="width: 30px; border-radius: 50%;">
                                <img src="../assets/icons/white-pencil.png" alt="Edit Course" style="object-fit: cover; height: 20px;">
                            </span>` : ''}
                        <span class="badge bg-success position-absolute top-0 end-0 m-2">${course.completion}%</span>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text text-muted">${course.description}</p>
                        ${isEnrolled ? `
                            <div class="d-flex justify-content-between">
                                <button class="btn btn-primary continue-course" data-id="${course.id}">Continue now...</button>
                                <!--button class="btn btn-danger drop-course" data-id="${course.id}">Drop</button-->
                                ${admin ? `<button class="btn btn-danger drop-course" data-id="${course.id}">
                                                <img src="../assets/icons/trash.png" alt="Delete Course" style="object-fit: cover; height: 20px;">
                                            </button>` : ''}
                            </div>` : `
                            <button class="btn btn-primary add-course" data-id="${course.id}">Add to My Courses</button>`}
                    </div>
                </div>
            </div>`;
    }

    // Event listeners
    document.addEventListener('click', async (e) => {
        const target = e.target.closest('.add-course, .delete-course'); // .drop-course,
        if (!target) return;
        const courseId = target.dataset.id;

        try {
            if (target.classList.contains('add-course')) {
                await fetch(`/api/users/${currentUser}/enroll/${courseId}`, { method: 'POST' });
            // } else if (target.classList.contains('drop-course')) {
            //     await fetch(`/api/users/${currentUser}/drop/${courseId}`, { method: 'POST' });
            } else if (target.classList.contains('delete-course')) {
                await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
            }
            renderCourses();
        } catch (error) {
            console.error('Action failed:', error);
        }
    });

    // Admin: Add new course
    document.getElementById('add-course-btn')?.addEventListener('click', async () => {
        const title = prompt('Course title:');
        const description = prompt('Description:');
        if (title && description) {
            await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, image: 'assets/images/default-course.jpg' })
            });
            renderCourses();
        }
    });

    // Initial render
    renderCourses();
    document.querySelector('.username').textContent = currentUser;
    if (await isAdmin()) {
        document.getElementById('my-courses-container').parentElement.style.display = 'none';
        document.querySelector('.username').textContent += ' (Admin)';
        document.getElementById('admin-add-course').innerHTML = `
            <button class="btn btn-success mt-2 mb-4" id="add-course-btn">Add New Course +</button>`;
    }
});
