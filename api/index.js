const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to trigger Python script
app.post('/ask', (req, res) => {
    const { question } = req.body;  // Extract the question from the request body

    // Ensure question is provided
    if (!question) {
        return res.status(400).json({ error: 'No question provided' });
    }

    // Path to your Python script
    const pythonScriptPath = path.join(__dirname, 'assistant.py');

    // Command to execute Python script with the question
    const command = `python ${pythonScriptPath} "${question}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'An error occurred while executing the script' });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ error: 'An error occurred while executing the script' });
        }

        // Send the output of the Python script as the response
        res.json({ response: stdout.trim() });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
