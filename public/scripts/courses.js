document.addEventListener("DOMContentLoaded", async () => {
    const JSONBLOB_URL = "https://jsonblob.com/api/jsonBlob/1352447312428982272";
    const currentUser = 'hogand6'; // Hardcoded for demo

    // Fetch data from JSONBlob
    async function getData() {
        try {
            const response = await fetch(JSONBLOB_URL);
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            return { users: [], courses: [] };
        }
    }

    // Save data to JSONBlob
    async function saveData(data) {
        try {
            await fetch(JSONBLOB_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    // Check admin status
    function isAdmin(data) {
        const user = data.users.find(u => u.username === currentUser);
        return user?.isAdmin || false;
    }

    async function renderCourses() {
        const data = await getData();
        const isAdmin = data.users.find(u => u.username === currentUser)?.isAdmin || false;
        const user = data.users.find(u => u.username === currentUser);
        
        const myCoursesContainer = document.getElementById('my-courses-container');
        const libraryContainer = document.getElementById('course-library-container');
        myCoursesContainer.innerHTML = '';
        libraryContainer.innerHTML = '';
        
        // Hide "My Courses" section for admins
        myCoursesContainer.parentElement.style.display = isAdmin ? 'none' : 'block';
    
        data.courses.forEach(course => {
            const isEnrolled = user?.enrolledCourses?.some(e => e.courseId === course.id);
            const completion = isEnrolled ? user.enrolledCourses.find(e => e.courseId === course.id).completion : 0;
    
            const card = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-image position-relative">
                            <img src="../${course.image}" class="card-img-top" alt="${course.title}" style="height: 180px; object-fit: cover;">
                            ${isAdmin ? `
                                <span class="edit-course btn btn-secondary btn-round position-absolute top-0 start-0 m-2" data-id="${course.id}">
                                    <img src="../assets/icons/black-pencil.png" alt="Edit" style="height: 20px;">
                                </span>
                                <span class="delete-course btn btn-danger btn-round position-absolute top-0 end-0 m-2" data-id="${course.id}">
                                    <img src="../assets/icons/trash.png" alt="Delete" style="height: 20px;">
                                </span>` : 
                                (isEnrolled ? `<span class="badge bg-success position-absolute top-0 end-0 m-2">${completion}%</span>` : '')}
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${course.title}</h5>
                            <p class="card-text text-muted flex-grow-1">${course.description}</p>
                            ${isAdmin ? '' : `
                                ${isEnrolled ? `
                                    <div class="d-flex justify-content-between">
                                        <button class="btn btn-primary continue-course flex-grow-1" data-id="${course.id}">Continue Learning</button>
                                        <!--button class="btn btn-danger drop-course" data-id="${course.id}">Drop</button-->
                                    </div>` : 
                                    `<button class="btn btn-primary add-course" data-id="${course.id}">Enroll</button>`}
                            `}
                        </div>
                    </div>
                </div>`;
            
            // Add to appropriate container
            const container = isEnrolled && !isAdmin ? myCoursesContainer : libraryContainer;
            container.innerHTML += card;
        });
    }
    
    // Handle actions
    document.addEventListener('click', async (e) => {
        const target = e.target.closest('[data-id]');
        if (!target) return;
        
        const courseId = Number(target.dataset.id);
        const action = target.classList.contains('add-course') ? 'add' :
                       // target.classList.contains('drop-course') ? 'drop' :
                       target.classList.contains('delete-course') ? 'delete' : null;

        const data = await getData();
        const user = data.users.find(u => u.username === currentUser);
        
        try {
            switch(action) {
                case 'add':
                    if (!user.enrolledCourses.some(e => e.courseId === courseId)) {
                        user.enrolledCourses.push({ courseId, completion: 0 });
                    }
                    break;
                    
                case 'drop':
                    user.enrolledCourses = user.enrolledCourses.filter(e => e.courseId !== courseId);
                    break;
                    
                case 'delete':
                    if (!confirm('Permanently delete this course?')) return;
                    data.courses = data.courses.filter(c => c.id !== courseId);
                    data.users.forEach(u => {
                        u.enrolledCourses = u.enrolledCourses.filter(e => e.courseId !== courseId);
                    });
                    break;
            }
            
            await saveData(data);
            await renderCourses();
        } catch (error) {
            console.error('Action failed:', error);
            alert('Operation failed');
        }
    });

    // Admin course creation
    document.getElementById('admin-add-course')?.addEventListener('click', async () => {
        const data = await getData();
        if (!isAdmin(data)) return;
        
        const title = prompt('Course title:');
        const description = prompt('Description:');
        if (!title || !description) return;
        
        data.courses.push({
            id: Date.now(),
            title,
            description,
            image: 'assets/images/default-course.jpg'
        });
        
        await saveData(data);
        await renderCourses();
    });

    // Initial setup
    document.querySelector('.username').textContent = currentUser;
    const data = await getData();
    if (isAdmin(data)) {
        document.querySelector('.username').textContent += ' (Admin)';
        document.getElementById('admin-add-course').innerHTML = `
            <button class="btn btn-success mt-2 mb-4">Add New Course +</button>`;
    }
    
    await renderCourses();
});