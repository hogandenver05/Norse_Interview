document.addEventListener("DOMContentLoaded", function() {
    const myCoursesContainer = document.getElementById('my-courses-container');
    const courseLibraryContainer = document.getElementById('course-library-container');
    let coursesData = [];

    function renderCourses(courses, container, isLibrary = false) {
        container.innerHTML = '';
        courses.forEach(course => {
            const courseCard = `
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="position-relative">
                            <img src="${course.image}" class="card-img-top" alt="${course.title}">
                            <span class="badge bg-success position-absolute top-0 end-0 m-2">${course.completion}%</span>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${course.title}</h5>
                            <p class="card-text">${course.description}</p>
                            ${isLibrary ? 
                                `<button class="btn btn-primary add-course" data-id="${course.id}">Add to My Courses</button>` : 
                                `<div class="d-flex justify-content-between">
                                    <button class="btn btn-primary continue-course" data-id="${course.id}">Continue now...</button>
                                    <button class="btn btn-danger drop-course" data-id="${course.id}">
                                        <img src="assets/icons/trash.png" alt="Trash" height="20">
                                    </button>
                                </div>`}
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += courseCard;
        });
    }

    function fetchCourses() {
        fetch('data/courses.json')
            .then(response => response.json())
            .then(data => {
                coursesData = data.courses;
                const myCourses = coursesData.filter(course => course.enrolled);
                const courseLibrary = coursesData.filter(course => !course.enrolled);
                renderCourses(myCourses, myCoursesContainer);
                renderCourses(courseLibrary, courseLibraryContainer, true);
            })
            .catch(error => console.error('Error fetching courses:', error));
    }

    function addCourse(courseId) {
        const course = coursesData.find(c => c.id == courseId);
        if (course) {
            course.enrolled = true;
            const myCourses = coursesData.filter(course => course.enrolled);
            const courseLibrary = coursesData.filter(course => !course.enrolled);
            renderCourses(myCourses, myCoursesContainer);
            renderCourses(courseLibrary, courseLibraryContainer, true);
        }
    }

    function dropCourse(courseId) {
        const course = coursesData.find(c => c.id == courseId);
        if (course) {
            course.enrolled = false;
            const myCourses = coursesData.filter(course => course.enrolled);
            const courseLibrary = coursesData.filter(course => !course.enrolled);
            renderCourses(myCourses, myCoursesContainer);
            renderCourses(courseLibrary, courseLibraryContainer, true);
        }
    }

    myCoursesContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('drop-course') || event.target.closest('.drop-course')) {
            const courseId = event.target.closest('.drop-course').getAttribute('data-id');
            dropCourse(courseId);
        }
    });

    courseLibraryContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-course')) {
            const courseId = event.target.getAttribute('data-id');
            addCourse(courseId);
        }
    });

    fetchCourses();
});