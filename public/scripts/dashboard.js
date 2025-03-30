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
                    <div class="card h-100">
                        <div class="card-image">
                            <img src="../${course.image}" alt="${course.title}">
                            ${isAdminUser ? `
                                <button class="edit-course btn-round position-absolute top-0 start-0 m-3" data-id="${course.id}">
                                    <img src="../assets/icons/black-pencil.png" alt="Edit">
                                </button>
                                <button class="delete-course btn-round position-absolute top-0 end-0 m-3" data-id="${course.id}">
                                    <img src="../assets/icons/trash.png" alt="Delete">
                                </button>` : 
                                (isEnrolled ? `
                                    <div class="enrollment-status enrolled">
                                        <i class="fas fa-check-circle me-1"></i>${completion}% Complete
                                    </div>
                                    <div class="course-progress mt-3">
                                        <div class="course-progress-bar" style="width: ${completion}%"></div>
                                    </div>` : '')}
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${course.title}</h5>
                            <p class="card-text flex-grow-1">${course.description}</p>
                            <div class="course-stats">
                                <div class="course-stat-item">
                                    <div class="course-stat-value">${course.stats.lessons}</div>
                                    <div class="course-stat-label">Lessons</div>
                                </div>
                                <div class="course-stat-item">
                                    <div class="course-stat-value">${course.stats.duration}</div>
                                    <div class="course-stat-label">Duration</div>
                                </div>
                                <div class="course-stat-item">
                                    <div class="course-stat-value">${course.stats.students}</div>
                                    <div class="course-stat-label">Students</div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="course-actions">
                                ${isAdminUser ? `
                                    <button class="course-action-btn secondary" onclick="previewCourse(${course.id})">
                                        <i class="fas fa-eye me-2"></i>Preview
                                    </button>
                                    <button class="course-action-btn primary" onclick="editCourse(${course.id})">
                                        <i class="fas fa-edit me-2"></i>Edit
                                    </button>
                                ` : (isEnrolled ? `
                                    <button class="course-action-btn primary continue-course" data-id="${course.id}">
                                        <i class="fas fa-play me-2"></i>Continue Learning
                                    </button>
                                ` : `
                                    <button class="course-action-btn secondary" onclick="previewCourse(${course.id})">
                                        <i class="fas fa-eye me-2"></i>Preview
                                    </button>
                                    <button class="course-action-btn primary add-course" data-id="${course.id}">
                                        <i class="fas fa-plus me-2"></i>Enroll Now
                                    </button>
                                `)}
                            </div>
                        </div>
                    </div>
                </div>`;
            
            // Add to appropriate container
            const container = isEnrolled && !isAdminUser ? myCoursesContainer : libraryContainer;
            container.innerHTML += card;
        });
    }
    
    // Handle actions
    document.addEventListener('click', async (e) => {
        const target = e.target.closest('[data-id]');
        if (!target) return;
        
        const courseId = Number(target.dataset.id);
        const action = target.classList.contains('add-course') ? 'add' :
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
    const col = document.createElement('div');
    col.className = 'col-md-4';
    
    col.innerHTML = `
        <div class="course-card">
            <img src="${course.imageUrl}" class="card-image" alt="${course.title}">
            <div class="card-body">
                <h3 class="card-title">${course.title}</h3>
                <p class="card-text">${course.description}</p>
                <div class="course-stats">
                    <div class="course-stat-item">
                        <div class="course-stat-value">${course.stats.lessons}</div>
                        <div class="course-stat-label">Lessons</div>
                    </div>
                    <div class="course-stat-item">
                        <div class="course-stat-value">${course.stats.duration}</div>
                        <div class="course-stat-label">Duration</div>
                    </div>
                    <div class="course-stat-item">
                        <div class="course-stat-value">${course.stats.students}</div>
                        <div class="course-stat-label">Students</div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <div class="course-actions">
                    <button class="course-action-btn primary">Start Course</button>
                    <button class="course-action-btn secondary">Preview</button>
                </div>
            </div>
        </div>
    `;

    return col;
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