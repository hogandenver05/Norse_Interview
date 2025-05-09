# Norse Interview
A career help hub for college students looking to secure their next job. 

### Contributors:
- **Denver Hogan**
- **Oshan Maharjan**

### The Why: 
For our final project in ASE 230 (Full Stack Application Development), we were tasked to team up with our peers and...
- Design and implement a RESTful API with Node.js + Express.
- Persist and query data with MongoDB.
- Protect routes with JSON Web Tokens (JWT) and session management.
- Combine the server-side component with the existing front end to provide a cohesive user experience.

We decided to create a platform that assists college students in preparing for job interviews. This project aims to provide resources, practice questions, and tips to help students succeed in their job search.

### Technical Implementation:
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with proper data modeling
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Frontend**: HTML, CSS, JavaScript with modern UI/UX practices
- **Security**: Protected routes, secure session management, and data encryption

### Key Features:
1. **AI-Powered Mock Interviews**
   - Personalized interview questions based on resume and job description
   - Real-time emotional tracking during interviews
   - LLM-powered feedback and recommendations
   - Experience pitching suggestions
   - Answer recommendations based on user's background

2. **Interview Questions**
   - Industry-specific question banks
   - Role-based question categories
   - Difficulty levels
   - Sample answers and best practices

3. **Resume Builder**
   - Professional templates
   - AI-powered content suggestions
   - Industry-specific formatting
   - ATS-friendly optimization

4. **Resource Library**
   - AI-generated course content
   - Video tutorials
   - Interactive learning modules
   - Progress tracking
   - Course enrollment system

### Database Structure:
- **Users Collection**
  - User profiles
  - Authentication data
  - Enrolled courses
  - Interview history
  - Progress tracking

- **Courses Collection**
  - Course content
  - Learning materials
  - Progress tracking
  - Enrollment data

### Security Features:
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Secure session management
- Data encryption

### Instructions:
1. **Clone the Repository**: `git clone https://github.com/yourusername/Norse_Interview.git`
2. **Navigate to the Project Directory**: `cd Norse_Interview`
3. **Install Dependencies**: `npm install`
4. **Add '.env' File**: *(provided in submission)*
   - MONGODB_URI: Your MongoDB connection string
   - JWT_SECRET: Your JWT secret key
5. **Run the Application**: `node server.js`
6. **Access the Application**: Open your browser and go to `http://localhost:3000`

### API Endpoints:
- `/api/signup`: User registration
- `/api/login`: User authentication
- `/api/courses`: Course management
- `/api/interviews`: Interview session management
- `/api/users`: User profile management

### Future Enhancements:
- Real-time interview feedback
- Advanced emotional analysis
- Integration with job boards
- Mobile application
- Community features for peer learning
