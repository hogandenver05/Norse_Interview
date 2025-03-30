document.addEventListener("DOMContentLoaded", async () => {
    const JSONBLOB_URL = "https://jsonblob.com/api/jsonBlob/1352447312428982272";
    const currentUser = 'hogand6'; // Hardcoded for demo

    // Initialize modal
    const addCourseModal = new bootstrap.Modal(document.getElementById('addCourseModal'));
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));

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

    // Show/hide floating add button based on admin status
    function toggleFloatingButton(isAdminUser) {
        const floatingBtn = document.getElementById('addCourseBtn');
        if (floatingBtn) {
            floatingBtn.style.display = isAdminUser ? 'flex' : 'none';
        }
    }

    // Handle new course submission
    async function handleNewCourse(formData) {
        const data = await getData();
        
        const newCourse = {
            id: Date.now(),
            title: formData.title,
            description: formData.description,
            image: formData.imageUrl || 'assets/images/default-course.jpg',
            progress: 0,
            stats: {
                lessons: 0,
                duration: '0h',
                students: 0
            }
        };

        data.courses.push(newCourse);
        await saveData(data);
        await renderCourses();

        // Show success toast if it exists
        const toast = document.getElementById('courseAddedToast');
        if (toast) {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    }

    // Event listener for form submission
    document.getElementById('addCourseForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            title: document.getElementById('courseTitle').value,
            description: document.getElementById('courseDescription').value,
            imageUrl: document.getElementById('courseImage').value
        };

        if (formData.title && formData.description && formData.imageUrl) {
            await handleNewCourse(formData);
            addCourseModal.hide();
            e.target.reset();
            successModal.show();
        }
    });

    // Show modal when floating button is clicked
    document.getElementById('addCourseBtn')?.addEventListener('click', () => {
        addCourseModal.show();
    });

    async function renderCourses() {
        const data = await getData();
        const isAdminUser = isAdmin(data);
        const user = data.users.find(u => u.username === currentUser);
        
        // Toggle floating button visibility
        toggleFloatingButton(isAdminUser);
        
        const myCoursesContainer = document.getElementById('my-courses-container');
        const libraryContainer = document.getElementById('course-library-container');
        myCoursesContainer.innerHTML = '';
        libraryContainer.innerHTML = '';
        
        // Hide "My Courses" section for admins
        myCoursesContainer.parentElement.style.display = isAdminUser ? 'none' : 'block';
    
        data.courses.forEach(course => {
            const isEnrolled = user?.enrolledCourses?.some(e => e.courseId === course.id);
            const completion = isEnrolled ? user.enrolledCourses.find(e => e.courseId === course.id).completion : 0;
    
            const card = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100" data-course-id="${course.id}">
                        <div class="card-image">
                            <img src="../${course.image}" alt="${course.title}">
                            ${isAdminUser ? `
                                <button class="edit-btn" data-course-id="${course.id}" data-bs-toggle="modal" data-bs-target="#editCourseModal">
                                    <i class="fas fa-pencil-alt"></i>
                                </button>
                                <button class="delete-btn" data-course-id="${course.id}" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal">
                                    <i class="fas fa-trash"></i>
                                </button>` : 
                                (isEnrolled ? `
                                    <div class="enrollment-status enrolled">
                                        <i class="fas fa-check-circle me-1"></i>${completion}% Complete
                                    </div>` : '')}
                            <div class="card-overlay">
                                <h5 class="card-title">${course.title}</h5>
                                <p class="card-description">${course.description}</p>
                            </div>
                        </div>
                    </div>
                </div>`;
            
            // Add to appropriate container
            const container = isEnrolled && !isAdminUser ? myCoursesContainer : libraryContainer;
            container.innerHTML += card;
        });
    }
    
    // Handle edit functionality
    document.addEventListener('click', async function(e) {
        const editBtn = e.target.closest('.edit-btn');
        if (!editBtn) return;

        const courseId = editBtn.dataset.courseId;
        const data = await getData();
        const course = data.courses.find(c => c.id === parseInt(courseId));
        
        if (course) {
            // Populate modal with course data
            const modal = document.getElementById('editCourseModal');
            modal.dataset.courseId = courseId;
            
            // Set form values
            document.getElementById('editCourseTitle').value = course.title;
            document.getElementById('editCourseDescription').value = course.description;
            document.getElementById('editCourseImage').value = course.image;
            
            // Update preview image if exists
            const previewImg = modal.querySelector('.preview-img');
            const placeholder = modal.querySelector('.upload-placeholder');
            if (course.image) {
                previewImg.src = `../${course.image}`;
                previewImg.classList.remove('d-none');
                placeholder.classList.add('d-none');
            } else {
                previewImg.classList.add('d-none');
                placeholder.classList.remove('d-none');
            }
        }
    });

    // Handle form submission
    document.getElementById('editCourseForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const modal = document.getElementById('editCourseModal');
        const courseId = parseInt(modal.dataset.courseId);
        const data = await getData();
        const courseIndex = data.courses.findIndex(c => c.id === courseId);
        
        if (courseIndex !== -1) {
            // Update course data
            data.courses[courseIndex] = {
                ...data.courses[courseIndex],
                title: document.getElementById('editCourseTitle').value.trim(),
                description: document.getElementById('editCourseDescription').value.trim(),
                image: document.getElementById('editCourseImage').value.trim()
            };
            
            try {
                await saveData(data);
                
                // Hide modal
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance.hide();
                
                // Show success toast
                const toast = new bootstrap.Toast(document.getElementById('courseAddedToast'));
                document.querySelector('.toast-body').innerHTML = 
                    '<i class="fas fa-check-circle me-2"></i>Course updated successfully!';
                toast.show();
                
                // Refresh courses display
                await renderCourses();
            } catch (error) {
                console.error('Failed to update course:', error);
                alert('Failed to update course. Please try again.');
            }
        }
    });

    // Reset form on modal close
    document.getElementById('editCourseModal')?.addEventListener('hidden.bs.modal', function() {
        this.querySelector('form').reset();
        const previewImg = this.querySelector('.preview-img');
        const placeholder = this.querySelector('.upload-placeholder');
        previewImg.classList.add('d-none');
        placeholder.classList.remove('d-none');
    });

    // Handle delete functionality
    document.addEventListener('click', async function(e) {
        const deleteBtn = e.target.closest('.delete-btn');
        if (!deleteBtn) return;
        
        const courseId = parseInt(deleteBtn.dataset.courseId);
        if (courseId) {
            courseToDelete = courseId;
            const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
            deleteModal.show();
        }
    });

    // Event listener for confirm delete button
    document.getElementById('confirmDelete')?.addEventListener('click', async function() {
        if (courseToDelete) {
            const data = await getData();
            
            // Filter out the deleted course
            data.courses = data.courses.filter(c => c.id !== courseToDelete);
            // Remove course from all users' enrolled courses
            data.users.forEach(u => {
                if (u.enrolledCourses) {
                    u.enrolledCourses = u.enrolledCourses.filter(e => e.courseId !== courseToDelete);
                }
            });
            
            try {
                await saveData(data);
                
                // Hide the modal
                const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
                deleteModal.hide();
                
                // Show success toast
                const toast = new bootstrap.Toast(document.getElementById('courseAddedToast'));
                document.querySelector('.toast-body').innerHTML = 
                    '<i class="fas fa-check-circle me-2"></i>Course deleted successfully!';
                toast.show();
                
                // Refresh the courses display
                await renderCourses();
                
                // Reset courseToDelete
                courseToDelete = null;
            } catch (error) {
                console.error('Failed to delete course:', error);
                // Show error toast
                const toast = new bootstrap.Toast(document.getElementById('courseAddedToast'));
                document.querySelector('.toast-body').innerHTML = 
                    '<i class="fas fa-exclamation-circle me-2"></i>Failed to delete course. Please try again.';
                document.querySelector('.toast').classList.remove('bg-success');
                document.querySelector('.toast').classList.add('bg-danger');
                toast.show();
            }
        }
    });

    // Initial setup
    document.querySelector('.username').textContent = currentUser;
    const data = await getData();
    if (isAdmin(data)) {
        document.querySelector('.username').textContent += ' (Admin)';
        // Remove the old add course button
        const adminAddCourse = document.getElementById('admin-add-course');
        if (adminAddCourse) {
            adminAddCourse.remove();
        }
    }
    
    await renderCourses();
});

// Course data store
let courses = [];

// Handle "Back to Dashboard" button click
document.getElementById('backToDashboardBtn').addEventListener('click', function() {
    successModal.hide();
    // Reset the form
    document.getElementById('addCourseForm').reset();
    // Clear any preview images
    document.querySelector('.preview-img').classList.add('d-none');
    document.querySelector('.upload-placeholder').classList.remove('d-none');
    // Refresh the dashboard content if needed
    loadDashboardContent();
});

// Handle draft saving
document.getElementById('saveDraftBtn').addEventListener('click', function() {
    // Save draft logic here
    
    // Show brief toast notification
    const toast = new bootstrap.Toast(document.getElementById('courseAddedToast'));
    document.querySelector('.toast-body').innerHTML = '<i class="fas fa-save me-2"></i>Draft saved successfully!';
    toast.show();
    
    // Close the modal
    addCourseModal.hide();
});

// Prevent accidental navigation
window.addEventListener('beforeunload', function(e) {
    const form = document.getElementById('addCourseForm');
    if (form.checkValidity() && !form.classList.contains('submitted')) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Handle modal closing
document.getElementById('cancelBtn').addEventListener('click', function() {
    if (formHasChanges()) {
        if (confirm('Are you sure you want to discard your changes?')) {
            addCourseModal.hide();
            document.getElementById('addCourseForm').reset();
        }
    } else {
        addCourseModal.hide();
    }
});

// Helper function to check if form has changes
function formHasChanges() {
    const form = document.getElementById('addCourseForm');
    const formData = new FormData(form);
    return Array.from(formData.values()).some(value => value !== '');
}

// Helper function to refresh dashboard content
function loadDashboardContent() {
    // Add your dashboard refresh logic here
    // This could be fetching new data and updating the UI
    location.reload(); // Simple refresh for now
}

// Function to create course card
function createCourseCard(course) {
    return `
        <div class="col-md-4 mb-4">
            <div class="card course-card" data-course-id="${course.id}">
                <div class="card-img-container">
                    <img src="${course.image || 'assets/images/default-course.jpg'}" class="card-img-top" alt="${course.title}">
                    <div class="card-actions">
                        <button class="edit-btn" data-bs-toggle="modal" data-bs-target="#editCourseModal">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="delete-btn" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${course.title}</h5>
                    <p class="card-text">${course.description}</p>
                </div>
            </div>
        </div>
    `;
}

// Add this HTML to your dashboard.html
const deleteModalHTML = `
    <div class="modal fade delete-modal" id="deleteConfirmModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        Delete Course
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <i class="fas fa-trash-alt"></i>
                    <p>Are you sure you want to delete this course?<br>This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-cancel" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-delete" id="confirmDelete">Delete Course</button>
                </div>
            </div>
        </div>
    </div>
`;

// Add the delete modal to the document body when the page loads
document.body.insertAdjacentHTML('beforeend', deleteModalHTML);

// Initialize delete confirmation modal
let courseToDelete = null;
const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

// Event listener for delete button click
document.addEventListener('click', function(e) {
    if (e.target.closest('.delete-btn')) {
        const card = e.target.closest('.course-card');
        courseToDelete = card.dataset.courseId;
    }
});

// Event listener for confirm delete button
document.getElementById('confirmDelete').addEventListener('click', function() {
    if (courseToDelete) {
        // Delete the course
        deleteCourse(courseToDelete);
        // Hide the modal
        deleteModal.hide();
        // Show success toast
        showToast('Course deleted successfully', 'success');
        // Reset courseToDelete
        courseToDelete = null;
    }
});

// Function to show toast notifications
function showToast(message, type = 'success') {
    const toastHTML = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.parentElement.remove();
    });
}

// Function to delete course
async function deleteCourse(courseId) {
    try {
        // Here you would typically make an API call to delete the course
        // For now, we'll just remove it from the DOM
        const card = document.querySelector(`.course-card[data-course-id="${courseId}"]`);
        if (card) {
            card.closest('.col-md-4').remove();
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        showToast('Error deleting course', 'error');
    }
}

// Add file input for image upload
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// Handle image preview area click
document.getElementById('imagePreview').addEventListener('click', function() {
    fileInput.click();
});

// Handle upload button click
document.getElementById('uploadImageBtn').addEventListener('click', function() {
    fileInput.click();
});

// Handle file selection
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Update preview image
                const previewImg = document.querySelector('.preview-img');
                const placeholder = document.querySelector('.upload-placeholder');
                
                previewImg.src = e.target.result;
                previewImg.classList.remove('d-none');
                placeholder.classList.add('d-none');
                
                // Update image URL field
                document.getElementById('courseImage').value = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            // Show error toast for invalid file type
            const toast = new bootstrap.Toast(document.getElementById('courseAddedToast'));
            document.querySelector('.toast-body').innerHTML = 
                '<i class="fas fa-exclamation-circle me-2"></i>Please select an image file.';
            document.querySelector('.toast').classList.remove('bg-success');
            document.querySelector('.toast').classList.add('bg-danger');
            toast.show();
        }
    }
});

// Add drag and drop support
const imagePreview = document.getElementById('imagePreview');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    imagePreview.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    imagePreview.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    imagePreview.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    imagePreview.classList.add('highlight');
}

function unhighlight(e) {
    imagePreview.classList.remove('highlight');
}

imagePreview.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.querySelector('.preview-img');
            const placeholder = document.querySelector('.upload-placeholder');
            
            previewImg.src = e.target.result;
            previewImg.classList.remove('d-none');
            placeholder.classList.add('d-none');
            
            document.getElementById('courseImage').value = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        // Show error toast for invalid file type
        const toast = new bootstrap.Toast(document.getElementById('courseAddedToast'));
        document.querySelector('.toast-body').innerHTML = 
            '<i class="fas fa-exclamation-circle me-2"></i>Please drop an image file.';
        document.querySelector('.toast').classList.remove('bg-success');
        document.querySelector('.toast').classList.add('bg-danger');
        toast.show();
    }
}