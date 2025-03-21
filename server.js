import express from 'express';
import fetch from 'node-fetch'; // Install node-fetch for making HTTP requests

const app = express();
const port = process.env.PORT || 3000;

// JSONBlob ID (replace with your actual ID)
const JSONBLOB_ID = '1352447312428982272';
const JSONBLOB_URL = `https://jsonblob.com/api/jsonBlob/${JSONBLOB_ID}`;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Helper function to fetch data from JSONBlob
async function fetchData() {
  const response = await fetch(JSONBLOB_URL);
  return await response.json();
}

// Helper function to update data on JSONBlob
async function updateData(data) {
  await fetch(JSONBLOB_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// API Routes
app.get('/api/courses', async (req, res) => {
  const data = await fetchData();
  res.json({ courses: data.courses });
});

app.get('/api/users', async (req, res) => {
  const data = await fetchData();
  res.json({ users: data.users });
});

app.post('/api/users/:username/enroll/:courseId', async (req, res) => {
  const { username, courseId } = req.params;
  const data = await fetchData();
  const user = data.users.find((u) => u.username === username);

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.enrolledCoursesById.includes(Number(courseId))) {
    user.enrolledCoursesById.push(Number(courseId));
    await updateData(data);
  }
  res.json(user);
});

app.post('/api/users/:username/drop/:courseId', async (req, res) => {
  const { username, courseId } = req.params;
  const data = await fetchData();
  const user = data.users.find((u) => u.username === username);

  if (!user) return res.status(404).json({ error: 'User not found' });
  user.enrolledCoursesById = user.enrolledCoursesById.filter(
    (id) => id !== Number(courseId)
  );
  await updateData(data);
  res.json(user);
});

app.post('/api/courses', async (req, res) => {
  const data = await fetchData();
  const newCourse = {
    id: Date.now(),
    ...req.body,
    completion: 0,
  };
  data.courses.push(newCourse);
  await updateData(data);
  res.json(newCourse);
});

app.delete('/api/courses/:courseId', async (req, res) => {
  const courseId = Number(req.params.courseId);
  const data = await fetchData();
  data.courses = data.courses.filter((c) => c.id !== courseId);
  data.users.forEach((user) => {
    user.enrolledCoursesById = user.enrolledCoursesById.filter(
      (id) => id !== courseId
    );
  });
  await updateData(data);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});