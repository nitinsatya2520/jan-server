const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();

// Define allowed origins for CORS
const allowedOrigins = ['http://localhost:3000', 'https://jan-eight.vercel.app'];

// Middleware for CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow if origin is in the list or if it's a non-browser request
        } else {
            callback(new Error('Not allowed by CORS')); // Block requests from disallowed origins
        }
    },
    methods: ['GET', 'POST', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    allowedHeaders: ['Content-Type', 'Authorization'] // Ensure headers are allowed
}));

// Middleware to parse JSON request bodies
app.use(express.json());

app.options('/ask', cors()); // Enable preflight request handling


// Route to handle the '/ask' endpoint
app.post('/ask', (req, res) => {
    const { command } = req.body; // Destructure 'command' from the request body

    // Validate the presence of 'command' in the request
    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }

    // Spawn a child process to execute the Python script
    const pythonProcess = spawn('python', ['python-scripts/assistant.py', command]);

    let result = ''; // Variable to store the Python script output

    // Capture the stdout data from the Python process
    pythonProcess.stdout.on('data', (data) => {
        result += data.toString(); // Append the data to the result string
    });

    // Handle any errors from the Python process
    pythonProcess.stderr.on('data', (error) => {
        console.error(`Python error: ${error.toString()}`);
        return res.status(500).json({ error: 'Error occurred while executing the Python script' });
    });

    // Once the Python process is finished, send the result back to the client
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: `Python script exited with code ${code}` });
        }
        res.status(200).send(result.trim()); // Send the trimmed result to the client
    });
});

// Start the server on the specified port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
