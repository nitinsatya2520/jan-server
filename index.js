const express = require('express');
const cors = require('cors'); // Import cors
const { spawn } = require('child_process');
const app = express();
const port = 5000;

// Define allowed origins
const allowedOrigins = ['http://localhost:3000', 'https://jan-eight.vercel.app'];

// Enable CORS for the allowed origins
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true, // Allow credentials if needed
}));

app.use(express.json()); // Middleware to parse JSON request bodies

// Route to handle POST requests to /ask
app.post('/ask', (req, res) => {
    const command = req.body.command;

    if (!command) {
        return res.status(400).send('Command is required');
    }

    // Call a Python script (example: assistant.py) with the command as an argument
    const pythonProcess = spawn('python', ['python-scripts/assistant.py', command]);

    let result = '';

    // Capture Python script output
    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    // Handle errors from Python script
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data}`);
        res.status(500).send('Error occurred while executing the Python script.');
    });

    // Send the final result after the Python process closes
    pythonProcess.on('close', (code) => {
        res.send(result.trim());
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
