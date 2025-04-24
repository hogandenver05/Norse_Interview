const fs = require("fs");
const express = require("express");
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); 
app.use(cors());

const client = new MongoClient(MONGO_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

    if (!token) return res.status(401).send("Access denied");

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send("Invalid token");
        req.user = user; // Attach user info to request
        next();
    });
}

/* HTML ENDPOINTS */
// HTML catchall
app.use((req, res, next)=>{
	if(fs.existsSync(`./public${req.url}.html`)) res.send(fs.readFileSync(`./public${req.url}.html`,'utf8'));
	else next();
});

// Serve index.html
app.get('/', (req, res) => {
    let filePath = "./public/index.html";

    if (fs.existsSync(filePath)) {
        let html = fs.readFileSync(filePath, 'utf8');
        res.send(html);
    } else {
        res.status(404).send("404 page not found");
    }
});

/* API ENDPOINTS */
app.post('/api/validate-token', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await client.db("Norse_Interview").collection("users").findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Insert the new user into the database
        const newUser = { 
            email,
            password, // TODO: Hash the password in production
            username: email.split('@')[0], // Extract username from email
            enrolledCourses: [],
            interviews: [],
            isAdmin: false,
            isLoggedIn: false
        };
        await client.db("Norse_Interview").collection("users").insertOne(newUser);

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: "Error creating user" });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user in the database
        const user = await client.db("Norse_Interview").collection("users").findOne({ email });

        if (!user || user.password !== password) {
            return res.status(401).send("Invalid email or password");
        }

        // Generate JWT
        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        res.status(500).send("Error logging in");
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    let users = await client.db("Norse_Interview").collection("users").find({}, { projection: { _id: false,  password: false } }).toArray();
    res.json(users);
});

// Get user by email
app.get('/api/users/:email', async (req, res) => {
    let _email = req.params.email;
    let user = await client.db("Norse_Interview").collection("users").findOne({ email: _email }, { projection: { _id: false,  password: false } });
    if (user) {
        res.json(user);
    } else {
        res.status(404).send("User not found");
    }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
    let courses = await client.db("Norse_Interview").collection("courses").find({}).toArray();
    res.json(courses);
});

// Get course by ID
app.get('/api/courses/:id', async (req, res) => {
    let id = new ObjectId(req.params.id);
    let course = await client.db("Norse_Interview").collection("courses").findOne({ _id: id });
    if (course) {
        res.json(course);
    } else {
        res.status(404).send("Course not found");
    }
});

// Create new course
app.post('/api/courses', async (req, res) => {
    try {
        const newCourse = req.body;
        const result = await client.db("Norse_Interview").collection("courses").insertOne(newCourse);
        res.status(201).json({ ...newCourse, _id: result.insertedId });
    } catch (error) {
        res.status(500).send("Error creating course");
    }
});

// Update course by ID
app.put('/api/courses/:id', async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const updates = req.body;
        delete updates._id; // Prevent ID change
        const result = await client.db("Norse_Interview").collection("courses").updateOne(
            { _id: id },
            { $set: updates }
        );
        if (result.matchedCount === 0) return res.status(404).send("Course not found");
        res.json({ message: "Course updated successfully" });
    } catch (error) {
        res.status(500).send("Error updating course");
    }
});

// Delete course by ID
app.delete('/api/courses/:id', async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        // Delete course
        const courseResult = await client.db("Norse_Interview").collection("courses").deleteOne({ _id: id });
        if (courseResult.deletedCount === 0) return res.status(404).send("Course not found");
        
        // Remove from user enrollments
        await client.db("Norse_Interview").collection("users").updateMany(
            { "enrolledCourses.courseId": id },
            { $pull: { enrolledCourses: { courseId: id } } }
        );
        
        res.json({ message: "Course deleted successfully" });
    } catch (error) {
        res.status(500).send("Error deleting course");
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
