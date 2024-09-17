const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const port = 5000;

// Define allowed origins
const allowedOrigins = ['http://localhost:3000', 'https://jan-eight.vercel.app'];

// Use CORS middleware with options
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true, // Allows credentials like cookies to be sent
}));

app.use(express.json()); // For parsing application/json

// Route to handle POST requests to /ask
app.post('/ask', (req, res) => {
    const { command } = req.body;

    if (!command) {
        return res.status(400).send('Command is required');
    }

    const pythonProcess = spawn('python', ['python-scripts/assistant.py', command]);

    let result = '';

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data}`);
        res.status(500).send('Error occurred while executing the Python script.');
    });

    pythonProcess.on('close', (code) => {
        res.send(result.trim());
    });
});

app.options('/ask', (req, res) => {
    res.set('Access-Control-Allow-Origin', 'https://jan-eight.vercel.app');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200); // Respond OK to preflight
  });
  

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
