const fs = require("fs");
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const uri = process.env.MONGODB_URI;
const express = require("express");
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); 
app.use(cors());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

/* HTML ENDPOINTS */
// HTML catchall
app.use((req,res,next)=>{
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

app.get('/detail', (req, res) => {
    let filePath = "./public/detail.html";
    
    if (fs.existsSync(filePath)) {
        let html = fs.readFileSync(filePath, 'utf8');
        res.send(html);
    } else {
        res.status(404).send("404 page not found");
    }
});

/* API ENDPOINTS */
// Get all users
app.get('/api/users', async (req, res) => {
    let users = await client.db("Norse_Interview").collection("users").find({}, { projection: { _id: false,  password: false } }).toArray();
    res.json(users);
});

// Get user by username
app.get('/api/users/:username', async (req, res) => {
    let _username = req.params.username;
    let user = await client.db("Norse_Interview").collection("users").findOne({ username: _username }, { projection: { _id: false,  password: false } });
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
