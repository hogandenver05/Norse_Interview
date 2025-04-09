document.addEventListener("DOMContentLoaded", async () => {
    const SERVER_URL = "http://localhost:3000/api";
    const currentUser = 'hogand6';
    let courseToDelete = null;

    const initializeModals = () => {
        return {
            addCourse: new bootstrap.Modal('#addCourseModal'),
            success: new bootstrap.Modal('#successModal'),
            deleteConfirm: new bootstrap.Modal('#deleteConfirmModal'),
            editCourse: new bootstrap.Modal('#editCourseModal')
        };
    };

    const modals = initializeModals();
    const toast = new bootstrap.Toast('#courseAddedToast');

    const fetchData = async () => {
        try {
            const response = await fetch(SERVER_URL);
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return { users: [], courses: [] };
        }
    };

    const persistData = async (data) => {
        try {
            await fetch(SERVER_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const checkAdminStatus = (data) => {
        const user = data.users.find(u => u.username === currentUser);
        return user?.isAdmin ?? false;
    };

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

    const createCourseCard = (course, isAdminUser, user) => {
        const isEnrolled = user?.enrolledCourses?.some(e => e.courseId === course.id);
        const completion = isEnrolled ? user.enrolledCourses.find(e => e.courseId === course.id).completion : 0;

        return `
            <div class="col-md-3 mb-4">
                <div class="card h-100" data-course-id="${course.id}">
                    <div class="card-image">
                        <img src="${course.image}" alt="${course.title}">
                        ${isAdminUser ? adminControls(course.id) : enrollmentStatus(isEnrolled, completion)}
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

    const enrollmentStatus = (isEnrolled, completion) => isEnrolled ? `
        <div class="enrollment-status enrolled">
            <i class="fas fa-check-circle me-1"></i>${completion}% Complete
        </div>` : '';

    const setupEventListeners = () => {
        document.getElementById('addCourseForm')?.addEventListener('submit', handleCourseSubmission);
        document.getElementById('addCourseBtn')?.addEventListener('click', () => modals.addCourse.show());
        document.getElementById('confirmDelete')?.addEventListener('click', handleCourseDeletion);
        document.getElementById('editCourseForm')?.addEventListener('submit', handleCourseUpdate);
        document.getElementById('backToDashboardBtn')?.addEventListener('click', resetForm);
        document.addEventListener('click', handleDynamicElements);
        setupImageUpload();
    };

    const handleDynamicElements = async (e) => {
        if (e.target.closest('.edit-btn')) handleEditClick(e);
        if (e.target.closest('.delete-btn')) handleDeleteClick(e);
    };

    const handleEditClick = async (e) => {
        const courseId = e.target.closest('.edit-btn').dataset.courseId;
        const data = await fetchData();
        const course = data.courses.find(c => c.id === parseInt(courseId));
        
        if (course) populateEditForm(course);
    };

    const populateEditForm = (course) => {
        const modal = document.getElementById('editCourseModal');
        modal.dataset.courseId = course.id;
        
        document.getElementById('editCourseTitle').value = course.title;
        document.getElementById('editCourseDescription').value = course.description;
        document.getElementById('editCourseImage').value = course.image;

        const previewImg = modal.querySelector('.preview-img');
        const placeholder = modal.querySelector('.upload-placeholder');
        previewImg.src = course.image || '';
        previewImg.classList.toggle('d-none', !course.image);
        placeholder.classList.toggle('d-none', !!course.image);
    };

    const handleCourseSubmission = async (e) => {
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

    const createNewCourse = async (formData) => {
        const data = await fetchData();
        const newCourse = {
            id: Date.now(),
            title: formData.title,
            description: formData.description,
            image: formData.imageUrl || 'assets/images/default-course.jpg'
        };

        data.courses.push(newCourse);
        await persistData(data);
        await renderCourses();
        toast.show();
    };

    const handleCourseUpdate = async (e) => {
        e.preventDefault();
        const modal = document.getElementById('editCourseModal');
        const courseId = parseInt(modal.dataset.courseId);
        const data = await fetchData();
        const courseIndex = data.courses.findIndex(c => c.id === courseId);

        if (courseIndex === -1) return;

        data.courses[courseIndex] = {
            ...data.courses[courseIndex],
            title: document.getElementById('editCourseTitle').value.trim(),
            description: document.getElementById('editCourseDescription').value.trim(),
            image: document.getElementById('editCourseImage').value.trim()
        };

        await persistData(data);
        modals.editCourse.hide();
        await renderCourses();
        showToast('Course updated successfully!');
    };

    const handleDeleteClick = (e) => {
        courseToDelete = parseInt(e.target.closest('.delete-btn').dataset.courseId);
        modals.deleteConfirm.show();
    };

    const handleCourseDeletion = async () => {
        if (!courseToDelete) return;

        const data = await fetchData();
        data.courses = data.courses.filter(c => c.id !== courseToDelete);
        data.users.forEach(u => {
            if (u.enrolledCourses) {
                u.enrolledCourses = u.enrolledCourses.filter(e => e.courseId !== courseToDelete);
            }
        });

        await persistData(data);
        modals.deleteConfirm.hide();
        courseToDelete = null;
        await renderCourses();
        showToast('Course deleted successfully!');
    };

    const resetForm = () => {
        modals.success.hide();
        document.getElementById('addCourseForm').reset();
        document.querySelector('.preview-img').classList.add('d-none');
        document.querySelector('.upload-placeholder').classList.remove('d-none');
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

    const renderCourses = async () => {
        const data = await fetchData();
        const isAdminUser = checkAdminStatus(data);
        const user = data.users.find(u => u.username === currentUser);

        document.getElementById('addCourseBtn').style.display = isAdminUser ? 'flex' : 'none';
        
        const containers = {
            myCourses: document.getElementById('my-courses-container'),
            library: document.getElementById('course-library-container')
        };

        containers.myCourses.innerHTML = '';
        containers.library.innerHTML = '';
        containers.myCourses.parentElement.style.display = isAdminUser ? 'none' : 'block';

        data.courses.forEach(course => {
            const container = user?.enrolledCourses?.some(e => e.courseId === course.id) && !isAdminUser 
                ? containers.myCourses 
                : containers.library;
            container.innerHTML += createCourseCard(course, isAdminUser, user);
        });
    };

    const showToast = (message, type = 'success') => {
        const toastBody = document.querySelector('.toast-body');
        toastBody.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle me-2"></i>${message}`;
        toast._element.classList.toggle('bg-danger', type !== 'success');
        toast.show();
    };

    setupEventListeners();
    await renderCourses();
});
