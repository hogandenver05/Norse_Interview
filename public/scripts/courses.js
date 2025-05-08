document.addEventListener("DOMContentLoaded", async () => {
    const SERVER_URL = "http://localhost:3000/api";
    let courseToDelete;

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
    const CURRENT_USER = TOKEN ? decodeToken(TOKEN)?.email : null;

    const fetchData = async (endpoint) => {
        try {
            const response = await fetch(`${SERVER_URL}/${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    };

    const createCourseCard = (course, isAdminUser, user) => {
        const isEnrolled = user?.enrolledCourses?.some(e => e.courseId.toString() === course._id.toString());
        const completion = isEnrolled ? user.enrolledCourses.find(e => e.courseId.toString() === course._id.toString())?.completion || 0 : 0;

        return `
            <div class="col-md-3 mb-4">
                <div class="card h-100" data-course-id="${course._id}">
                    <div class="card-image">
                        <img src="../assets/images/${course.image}" alt="${course.title}">
                        ${isAdminUser ? adminControls(course._id) : enrollmentStatus(isEnrolled, completion, course._id)}
                        <div class="card-overlay">
                            <h5 class="card-title">${course.title}</h5>
                            <p class="card-description">${course.description}</p>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-primary btn-view-course" onclick="window.location.href='course_details.html?id=${course._id}'">
                            <i class="fas fa-eye me-1"></i>View Course
                        </button>
                    </div>
                </div>
            </div>`;
    };

    const adminControls = (courseId) => `
        <button class="edit-btn" data-course-id="${courseId}" data-bs-toggle="modal" data-bs-target="#editCourseModal">
            <i class="fas fa-pencil-alt"></i>
        </button>
        <button class="delete-btn" data-course-id="${courseId}" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal">
            <i class="fas fa-trash"></i>
        </button>`;

    const enrollmentStatus = (isEnrolled, completion, courseId) => isEnrolled ? `
        <div class="enrollment-status enrolled">
            <i class="fas fa-check-circle me-1"></i>${completion}% Complete
        </div>` : `
        <button class="btn btn-primary btn-enroll" data-course-id="${courseId}">
            <i class="fas fa-plus-circle me-1"></i>Enroll Now
        </button>`;

    const renderCourses = async () => {
        const user = await fetchData(`users/${CURRENT_USER}`);
        const isAdminUser = user?.isAdmin;
        const courses = await fetchData('courses') || [];
    
        const myCoursesContainer = document.getElementById('my-courses-container');
        const libraryContainer = document.getElementById('course-library-container');
    
        document.getElementById('addCourseBtn').style.display = isAdminUser ? 'flex' : 'none';
    
        myCoursesContainer.innerHTML = '';
        libraryContainer.innerHTML = '';
        myCoursesContainer.parentElement.style.display = isAdminUser ? 'none' : 'block';
    
        courses.forEach(course => {
            const isEnrolled = user?.enrolledCourses?.some(e => e.courseId.toString() === course._id.toString());
            const container = isEnrolled && !isAdminUser ? myCoursesContainer : libraryContainer;
            container.innerHTML += createCourseCard(course, isAdminUser, user);
        });
    };
    

    const handleEnrollment = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const courseId = e.target.closest('.btn-enroll').dataset.courseId;
        const user = await fetchData(`users/${CURRENT_USER}`);

        if (user) {
            const isEnrolled = user.enrolledCourses?.some(e => e.courseId.toString() === courseId);

            if (!isEnrolled) {
                await fetch(`${SERVER_URL}/enroll`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: CURRENT_USER, courseId })
                });

                showToast('Enrolled successfully!');
                await renderCourses();
            }
        }
    };

    const handleDynamicElements = async (e) => {
        if (e.target.closest('.btn-enroll')) handleEnrollment(e);
    };

    const showToast = (message, type = 'success') => {
        const toastBody = document.querySelector('.toast-body');
        toastBody.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle me-2"></i>${message}`;
        toast._element.classList.toggle('bg-danger', type !== 'success');
        toast.show();
    };

    const toast = new bootstrap.Toast('#courseAddedToast');
    document.addEventListener('click', handleDynamicElements);

    await renderCourses();

    // Auto-refresh courses when tab becomes visible
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            await renderCourses();
        }
    });
});