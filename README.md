# Norse Interview  
A career help hub for college students looking to secure their next job.

![Norse Interview Demo]
▶️ [YouTube Demo Video](https://www.youtube.com/watch?v=6CmSgrlMoe4)

## 👥 Contributors
- [Denver Hogan](https://github.com/hogandenver05)
- [Oshan Maharjan](https://github.com/oshanma)

---

## 🎯 Project Overview

**Norse Interview** is a full-stack career development platform built to help college students prepare for job interviews through AI-powered mock interviews, resume building, and skill development resources.

We were inspired by [BigInterview.com](https://www.biginterview.com/)—a paid platform provided to NKU students through Career Services. Our goal was to create a **free and open-source** alternative that provides similar (or even better) features for all students.

---

## 🧪 Built For  
Final project submission for **ASE 230 – Full Stack Application Development** at Northern Kentucky University.

---

## 🧱 Tech Stack

| Layer       | Tech Details                            |
|-------------|------------------------------------------|
| Backend     | Node.js, Express.js                      |
| Frontend    | HTML, CSS, JavaScript                    |
| Database    | MongoDB with Mongoose ORM                |
| Auth/Security | JWT + bcrypt, protected API routes     |

---

## 🔐 Security Features
- JWT-based authentication
- Bcrypt password hashing
- Secure session management
- Encrypted data
- Role-based route protection

---

## 🚀 Key Features

### 1. AI-Powered Mock Interviews
- Personalized questions based on resume and job description
- Real-time emotional tracking (prototype stage)
- LLM-powered answer feedback
- Pitch enhancement suggestions

### 2. Interview Questions
- Role-based and industry-specific question banks
- Difficulty levels with sample answers

### 3. Resume Builder
- ATS-optimized professional templates
- AI-generated content suggestions
- Industry-specific formats

### 4. Resource Library
- AI-generated course content
- Video tutorials and interactive modules
- Progress tracking and enrollment system

---

## 🗃️ Database Collections

### Users Collection
- User profile and login info
- Enrolled courses
- Interview attempt history
- Progress tracking

### Courses Collection
- Course modules and goals
- Learning materials
- Enrollment and progress tracking

---

## ⚙️ Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/hogandenver05/Norse_Interview.git

# 2. Navigate into the project folder
cd Norse_Interview

# 3. Install dependencies
npm install

# 4. Add your .env file
# .env should contain the following:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_key

# 5. Start the server
node server.js

# 6. Visit the app in your browser
http://localhost:3000
