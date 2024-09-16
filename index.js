//index.js
const express = require('express');
const cors = require('cors'); // Import cors
const { spawn } = require('child_process');
const app = express();
const port = 5000;

app.use(cors()); // Enable CORS
app.use(express.json());

app.post('/ask', (req, res) => {
    const command = req.body.command;

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
