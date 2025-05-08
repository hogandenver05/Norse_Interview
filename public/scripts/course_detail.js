const SERVER_URL = "http://localhost:3000/api";

const getCourseIdFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
};

const getCurrentUser = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email;
    } catch (e) {
        return null;
    }
};

let currentTopic = 1;
let course = null;
let selectedAnswers = {};

const fetchCourse = async (id) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${SERVER_URL}/courses/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return await response.json();
};

const renderCourseDetail = async () => {
    const courseId = getCourseIdFromURL();
    course = await fetchCourse(courseId);

    // Fetch user info
    const token = localStorage.getItem("token");
    const payload = JSON.parse(atob(token.split('.')[1]));
    const email = payload.email;
    const userRes = await fetch(`${SERVER_URL}/users/${email}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const user = await userRes.json();

    // Find enrolled course
    const enrolled = user.enrolledCourses.find(c => c.courseId === courseId);
    if (!enrolled) {
        currentTopic = 1;
    }

    document.getElementById("course-detail").innerHTML = `
        <h1>${course.title}</h1>
        <p>${course.description}</p>
    `;

    renderCurrentTopic();
};

const renderCurrentTopic = () => {
    const topicContent = document.getElementById("topic-content");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const goToQuizBtn = document.getElementById("goToQuizBtn");
    const quizSection = document.getElementById("quiz-section");

    prevBtn.style.display = currentTopic > 1 && currentTopic <= 5 ? "block" : "none";
    nextBtn.style.display = currentTopic < 5 ? "block" : "none";
    goToQuizBtn.style.display = currentTopic === 5 ? "block" : "none";

    if (currentTopic > 5) {
        topicContent.style.display = "none";
        quizSection.style.display = "block";
        renderQuiz();
        return;
    }

    topicContent.style.display = "block";
    quizSection.style.display = "none";

    const topic = course[`topic${currentTopic}`];
    const goal = course[`goal${currentTopic}`];
    const content = course[`content${currentTopic}`];

    topicContent.innerHTML = `
        <h2>${topic}</h2>
        <div class="goal">
            <strong>Goal:</strong> ${goal}
        </div>
        <div class="content">${content.replace(/\n/g, '<br>')}</div>
    `;
};

const renderQuiz = () => {
    const quizSection = document.getElementById("quiz-section");
    let quizHTML = '<h2>Quiz</h2>';

    for (let i = 1; i <= 5; i++) {
        const quiz = course[`quiz${i}`];
        quizHTML += `
            <div class="quiz-question" data-question="${i}">
                <h3>${quiz.question}</h3>
                <div class="quiz-options">
                    ${quiz.options.map((option, index) => `
                        <div class="quiz-option" data-option="${index}" onclick="selectAnswer(${i}, ${index})">
                            ${option}
                        </div>
                    `).join('')}
                </div>
                <div class="quiz-result" id="result-${i}" style="display: none;"></div>
            </div>
        `;
    }

    quizHTML += `<button class="nav-btn" onclick="checkAnswers()">Submit Quiz</button>`;
    quizSection.innerHTML = quizHTML;
};

const selectAnswer = (questionNumber, optionIndex) => {
    selectedAnswers[questionNumber] = optionIndex;
    const questionElement = document.querySelector(`.quiz-question[data-question="${questionNumber}"]`);
    questionElement.querySelectorAll('.quiz-option').forEach((option, index) => {
        option.classList.toggle('selected', index === optionIndex);
    });
};

const checkAnswers = async () => {
    let allCorrect = true;

    for (let i = 1; i <= 5; i++) {
        const quiz = course[`quiz${i}`];
        const selectedOption = selectedAnswers[i];
        const resultElement = document.getElementById(`result-${i}`);

        if (selectedOption === undefined) {
            resultElement.innerHTML = 'Please select an answer';
            resultElement.className = 'quiz-result incorrect';
            resultElement.style.display = 'block';
            allCorrect = false;
            continue;
        }

        const isCorrect = quiz.options[selectedOption] === quiz.answer;
        resultElement.innerHTML = isCorrect ? '✓ Correct!' : `✗ Incorrect. Correct: ${quiz.answer}`;
        resultElement.className = `quiz-result ${isCorrect ? 'correct' : 'incorrect'}`;
        resultElement.style.display = 'block';

        if (!isCorrect) allCorrect = false;
    }

    const quizSection = document.getElementById('quiz-section');
    let nextStepBtn = document.getElementById('nextStepBtn');
    if (nextStepBtn) nextStepBtn.remove();

    const btn = document.createElement('button');
    btn.id = 'nextStepBtn';
    btn.className = 'nav-btn';
    if (allCorrect) {
        btn.textContent = 'Next Course';
        btn.onclick = () => window.location.href = 'courses.html';
    } else {
        btn.textContent = 'Retake Quiz';
        btn.onclick = () => {
            selectedAnswers = {};
            renderQuiz();
        };
    }
    quizSection.appendChild(btn);
};

document.addEventListener('DOMContentLoaded', () => {
    renderCourseDetail();

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentTopic > 1) {
            currentTopic--;
            renderCurrentTopic();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentTopic < 5) {
            currentTopic++;
            renderCurrentTopic();
        }
    });

    document.getElementById('goToQuizBtn').addEventListener('click', () => {
        currentTopic = 6;
        renderCurrentTopic();
    });
});
