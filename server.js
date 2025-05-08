const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

require('dotenv').config();
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

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

const db = client.db("Norse_Interview");

function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).send("Access denied");

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send("Invalid token");
        req.user = user;
        next();
    });
}

app.get('/pages/courses/', (req, res) => {
    res.redirect('/pages/courses.html');
});

app.use((req, res, next) => {
    if (fs.existsSync(`./public${req.url}.html`)) {
        res.send(fs.readFileSync(`./public${req.url}.html`, 'utf8'));
    } else next();
});

app.get('/', (req, res) => {
    const filePath = "./public/index.html";
    if (fs.existsSync(filePath)) {
        res.send(fs.readFileSync(filePath, 'utf8'));
    } else {
        res.status(404).send("404 page not found");
    }
});

app.post('/api/validate-token', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const newUser = {
            email,
            hashedPassword,
            username: email.split('@')[0],
            enrolledCourses: [],
            interviews: [],
            isAdmin: false,
        };

        await db.collection("users").insertOne(newUser);
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: "Error creating user" });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.collection("users").findOne({ email });
        if (!user) return res.status(401).send("Invalid email or password");

        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isPasswordValid) return res.status(401).send("Invalid email or password");

        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send("Error logging in");
    }
});

app.get('/api/users', async (req, res) => {
    const users = await db.collection("users").find({}, { projection: { _id: false, password: false } }).toArray();
    res.json(users);
});

app.get('/api/users/:email', async (req, res) => {
    const email = req.params.email;
    const user = await db.collection("users").findOne({ email }, { projection: { _id: false, password: false } });
    if (user) res.json(user);
    else res.status(404).send("User not found");
});

app.get('/api/courses', authenticateToken, async (req, res) => {
    const courses = await db.collection("courses").find({}).toArray();
    res.json(courses);
});

app.get('/api/courses/:id', authenticateToken, async (req, res) => {
    const id = new ObjectId(req.params.id);
    const course = await db.collection("courses").findOne({ _id: id });
    if (course) res.json(course);
    else res.status(404).send("Course not found");
});

app.post('/api/courses', authenticateToken, async (req, res) => {
    const user = await db.collection("users").findOne({ email: req.user.email });
    if (user.isAdmin) {
        try {
            const newCourse = req.body;
            const result = await db.collection("courses").insertOne(newCourse);
            res.status(201).json({ ...newCourse, _id: result.insertedId });
        } catch (error) {
            res.status(500).send("Error creating course");
        }
    }
});

app.put('/api/courses/:id', authenticateToken, async (req, res) => {
    const user = await db.collection("users").findOne({ email: req.user.email });
    if (user.isAdmin) {
        try {
            const id = new ObjectId(req.params.id);
            const updates = req.body;
            delete updates._id;
            const result = await db.collection("courses").updateOne(
                { _id: id },
                { $set: updates }
            );
            if (result.matchedCount === 0) return res.status(404).send("Course not found");
            res.json({ message: "Course updated successfully" });
        } catch (error) {
            res.status(500).send("Error updating course");
        }
    }
});

app.delete('/api/courses/:id', authenticateToken, async (req, res) => {
    const user = await db.collection("users").findOne({ email: req.user.email });
    if (user.isAdmin) {
        try {
            const id = new ObjectId(req.params.id);
            const courseResult = await db.collection("courses").deleteOne({ _id: id });
            if (courseResult.deletedCount === 0) return res.status(404).send("Course not found");

            await db.collection("users").updateMany(
                { "enrolledCourses.courseId": id },
                { $pull: { enrolledCourses: { courseId: id } } }
            );

            res.json({ message: "Course deleted successfully" });
        } catch (error) {
            res.status(500).send("Error deleting course");
        }
    }
});

app.post('/api/enroll', authenticateToken, async (req, res) => {
    const { email, courseId } = req.body;
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isEnrolled = user.enrolledCourses?.some(course => course.courseId === courseId);
        if (isEnrolled) return res.status(400).json({ message: 'User already enrolled in this course' });

        await db.collection('users').updateOne(
            { email },
            { $push: { enrolledCourses: { courseId, completion: 0 } } }
        );

        res.status(200).json({ message: 'Enrolled successfully' });
    } catch (error) {
        console.error('Error enrolling user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/progress', authenticateToken, async (req, res) => {
    const { email, courseId, completion } = req.body;
    console.log('Progress update:', { email, courseId, completion });

    try {
        const user = await db.collection('users').findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const updatedCourses = (user.enrolledCourses || []).map(c =>
            c.courseId === courseId ? { ...c, completion } : c
        );

        await db.collection('users').updateOne(
            { email },
            { $set: { enrolledCourses: updatedCourses } }
        );

        res.status(200).json({ message: 'Progress updated successfully' });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});