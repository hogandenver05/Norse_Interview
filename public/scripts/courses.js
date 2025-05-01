document.addEventListener("DOMContentLoaded", async () => {
    const SERVER_URL = "http://localhost:3000/api";
    let courseToDelete;
    
    
    const decodeToken = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1])); // Decode the payload
            return payload;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    const TOKEN = localStorage.getItem('token');
    const CURRENT_USER = TOKEN ? decodeToken(TOKEN)?.email : null;


    const fetchData = async (data) => {
        try {
            const response = await fetch(`${SERVER_URL}/${data}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }); 
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    };


    /* Course cards */
    const createCourseCard = (course, isAdminUser, user) => {
        const isEnrolled = user?.enrolledCourses?.some(e => e.courseId === course._id);
        const completion = isEnrolled ? user.enrolledCourses.find(e => e.courseId === course._id).completion : 0;
        
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
        </div>`
        : 
        `<button class="btn btn-primary btn-enroll" data-course-id="${courseId}">
            <i class="fas fa-plus-circle me-1"></i>Enroll
        </button>`;


    const renderCourses = async () => {
        const user = await fetchData('users/' + CURRENT_USER);
        const isAdminUser = user?.isAdmin;
        const courses = await fetchData('courses');

        document.getElementById('addCourseBtn').style.display = isAdminUser ? 'flex' : 'none';
        
        const containers = {
            myCourses: document.getElementById('my-courses-container'),
            library: document.getElementById('course-library-container')
        };

        containers.myCourses.innerHTML = '';
        containers.library.innerHTML = '';
        containers.myCourses.parentElement.style.display = isAdminUser ? 'none' : 'block';

        courses.forEach(course => {
            const container = user?.enrolledCourses?.some(e => e.courseId === course._id) && !isAdminUser 
                ? containers.myCourses 
                : containers.library;
            container.innerHTML += createCourseCard(course, isAdminUser, user);
        });
    };


    /* Creating courses */
    const createNewCourse = async (formData) => {
        try {
            const newCourse = {
                title: formData.title,
                description: formData.description,
                image: formData.imageUrl || 'assets/images/default-course.jpg'
            };
    
            await fetch(`${SERVER_URL}/courses`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCourse)
            });
            
            await renderCourses();
            showToast('Course created successfully!');
        } catch (error) {
            showToast('Error creating course', 'error');
        }
    };


    const handleCourseCreation = async (e) => {
        e.preventDefault();
        const formData = {
            title: document.getElementById('courseTitle').value,
            description: document.getElementById('courseDescription').value,
            imageUrl: document.getElementById('courseImage').value
        };

        if (formData.title && formData.description && formData.imageUrl) {
            await createNewCourse(formData);
            modals.addCourse.hide();
            e.target.reset();
            modals.success.show();
        }
    };


    /* Enrolling in courses */
    const handleEnrollment = async (e) => {
        const courseId = e.target.dataset.courseId;
        // console.log('Course ID:', courseId);
        // console.log('Current User:', CURRENT_USER);
    
        const user = await fetchData('users/' + CURRENT_USER);
        // console.log('User Data:', user);
    
        if (user) {
            const enrolledCourses = user.enrolledCourses || [];
            const isEnrolled = enrolledCourses.some(e => e.courseId === courseId);
            // console.log('Is Enrolled:', isEnrolled);
    
            if (!isEnrolled) {
                enrolledCourses.push({ courseId, completion: 0 });
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


    /* Editing courses */
    const handleEditClick = async (e) => {
        const courseId = e.target.closest('.edit-btn').dataset.courseId;
        const course = await fetchData(`courses/${courseId}`);
        
        if (course) populateEditForm(course);
    };
    
    
    // FIXME: Network error thrown when trying to edit a course
    const populateEditForm = (course) => {
        const modal = document.getElementById('editCourseModal');
        modal.dataset.courseId = course._id;
        
        document.getElementById('editCourseTitle').value = course.title;
        document.getElementById('editCourseDescription').value = course.description;
        document.getElementById('editCourseImage').value = course.image;
        
        const previewImg = modal.querySelector('.preview-img');
        const placeholder = modal.querySelector('.upload-placeholder');
        previewImg.src = course.image || '';
        previewImg.classList.toggle('d-none', !course.image);
        placeholder.classList.toggle('d-none', !!course.image);
    };
    
    
    const handleCourseEdit = async (e) => {
        e.preventDefault();
        const modal = document.getElementById('editCourseModal');
        const courseId = modal.dataset.courseId;

        const updates = {
            title: document.getElementById('editCourseTitle').value.trim(),
            description: document.getElementById('editCourseDescription').value.trim(),
            image: document.getElementById('editCourseImage').value.trim()
        };
    
        try {
            await fetch(`${SERVER_URL}/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            await renderCourses();
            showToast('Course updated successfully!');
            modals.editCourse.hide();
        } catch (error) {
            showToast('Error updating course', 'error');
        }
    };


    /* Deleting courses */
    const handleDeleteClick = (e) => {
        courseToDelete = e.target.closest('.delete-btn').dataset.courseId;
        modals.deleteConfirm.show();
    };


    const handleCourseDeletion = async () => {
    if (!courseToDelete) return;

    try {
        await fetch(`${SERVER_URL}/courses/${courseToDelete}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${TOKEN}`
            }
        });
        
        await renderCourses();
        showToast('Course deleted successfully!');
        modals.deleteConfirm.hide();
        courseToDelete = null;
    } catch (error) {
        showToast('Error deleting course', 'error');
    }
};


    /* Image upload */
    const handleImageUpload = (file, previewSelector, placeholderSelector, urlField) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.querySelector(previewSelector);
            const placeholder = document.querySelector(placeholderSelector);
            
            preview.src = e.target.result;
            preview.classList.remove('d-none');
            placeholder.classList.add('d-none');
            document.querySelector(urlField).value = e.target.result;
        };
        reader.readAsDataURL(file);
    };


    const setupImageUpload = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        const handleFileSelect = (e) => {
            const file = e.target.files[0];
            if (!file?.type.startsWith('image/')) return;
            handleImageUpload(file, '.preview-img', '.upload-placeholder', '#courseImage');
        };

        document.getElementById('imagePreview')?.addEventListener('click', () => fileInput.click());
        document.getElementById('uploadImageBtn')?.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
    };


    const resetForm = () => {
        modals.success.hide();
        document.getElementById('addCourseForm').reset();
        document.querySelector('.preview-img').classList.add('d-none');
        document.querySelector('.upload-placeholder').classList.remove('d-none');
    };


    const handleDynamicElements = async (e) => {
        if (e.target.closest('.btn-enroll')) handleEnrollment(e);
        if (e.target.closest('.edit-btn')) handleEditClick(e);
        if (e.target.closest('.delete-btn')) handleDeleteClick(e);
    };


    const showToast = (message, type = 'success') => {
        const toastBody = document.querySelector('.toast-body');
        toastBody.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle me-2"></i>${message}`;
        toast._element.classList.toggle('bg-danger', type !== 'success');
        toast.show();
    };


    const initializeModals = () => {
        return {
            addCourse: new bootstrap.Modal('#addCourseModal'),
            success: new bootstrap.Modal('#successModal'),
            deleteConfirm: new bootstrap.Modal('#deleteConfirmModal'),
            editCourse: new bootstrap.Modal('#editCourseModal')
        };
    };


    /* Event listeners */
    const setupEventListeners = () => {
        document.getElementById('addCourseForm')?.addEventListener('submit', handleCourseCreation);
        document.getElementById('addCourseBtn')?.addEventListener('click', () => modals.addCourse.show());
        document.getElementById('confirmDelete')?.addEventListener('click', handleCourseDeletion);
        document.getElementById('editCourseForm')?.addEventListener('submit', handleCourseEdit);
        document.getElementById('backToCoursesBtn')?.addEventListener('click', resetForm);
        document.getElementById('logoutButton')?.addEventListener('click', () => localStorage.removeItem('token'));
        document.addEventListener('click', handleDynamicElements);
        setupImageUpload();
    };


    const modals = initializeModals();
    const toast = new bootstrap.Toast('#courseAddedToast');

    setupEventListeners();
    await renderCourses();
});
