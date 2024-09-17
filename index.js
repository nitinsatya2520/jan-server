const axios = require('axios');
const { SpeechClient } = require('@google-cloud/speech');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const { Builder, By, Key, until } = require('selenium-webdriver');
const open = require('open');

// Initialize Google Cloud clients
const speechClient = new SpeechClient();
const ttsClient = new TextToSpeechClient();

// Function to convert text to speech
async function speak(text) {
    const request = {
        input: { text },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const writeFile = util.promisify(fs.writeFile);
    await writeFile('output.mp3', response.audioContent, 'binary');
    console.log('Audio content written to file: output.mp3');
}

// Function to recognize speech
async function recognizeSpeech() {
    const audio = fs.readFileSync('path_to_audio_file.wav'); // Replace with actual audio file path
    const audioBytes = audio.toString('base64');

    const request = {
        audio: {
            content: audioBytes,
        },
        config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
        },
    };

    const [response] = await speechClient.recognize(request);
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
    console.log(`Transcription: ${transcription}`);
    return transcription;
}

// Function to get weather information
async function getWeather(command) {
    const city = command.match(/in (\w+)/)[1]; // Example extraction
    const apiKey = '03f7fb2a6ffa9af4e20414dc73edb7a3'; // Replace with your API key
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await axios.get(url);
        const { temp } = response.data.main;
        const description = response.data.weather[0].description;
        await speak(`The temperature in ${city} is ${temp}°C with ${description}.`);
    } catch (error) {
        await speak('Sorry, I couldn\'t fetch the weather details.');
    }
}

// Function to perform basic math calculations
function performMath(command) {
    try {
        const result = eval(command);
        speak(`The result is ${result}`);
    } catch (error) {
        speak('Sorry, I couldn\'t calculate that.');
    }
}

// Function for unit conversion
function convertUnits(command) {
    // Example conversion logic
    // Note: Implement unit conversion based on the actual requirement
    speak(`Conversion result for: ${command}`);
}

// Function to play song on YouTube
async function playYouTubeSong(songName) {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('https://www.youtube.com');
        await driver.findElement(By.name('search_query')).sendKeys(songName, Key.RETURN);
        await driver.wait(until.elementLocated(By.id('video-title')), 10000);
        await driver.findElement(By.id('video-title')).click();
    } catch (error) {
        await speak('An error occurred while playing the song.');
    } finally {
        await driver.quit();
    }
}

// Function to open WhatsApp
async function openWhatsApp() {
    await open('https://api.whatsapp.com');
}

// Function to handle commands
async function handleCommand(command) {
    command = command.toLowerCase();

    if (command.includes('weather')) {
        await getWeather(command);
    } else if (command.includes('calculate')) {
        performMath(command.replace('calculate', '').trim());
    } else if (command.includes('convert')) {
        convertUnits(command);
    } else if (command.includes('play')) {
        await playYouTubeSong(command.replace('play', '').trim());
    } else if (command.includes('open whatsapp')) {
        await openWhatsApp();
    } else {
        await speak('Command not recognized.');
    }
}

// Main function
async function main() {
    // Example command
    const command = await recognizeSpeech();
    await handleCommand(command);
}

main();
