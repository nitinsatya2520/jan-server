import speech_recognition as sr
import pyttsx3
import os
import spacy
import requests
import datetime
import random
import pint
import webbrowser
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time
from selenium.common.exceptions import WebDriverException
import threading
import pvporcupine
import pyaudio
import struct
import openai



# Initialize spaCy model
nlp = spacy.load('en_core_web_sm')

# Initialize recognizer and speech engine
recognizer = sr.Recognizer()
engine = pyttsx3.init()


# Lock to handle pyttsx3 run loop


# User profile for personalized greetings
profiles = {
    "Nitin": {"name": "Nitin", "greeting": "Hello Nitin! How can I assist you today?"}
}

# Reminders and To-Do List storage
reminders = []

# Jokes and Fun Facts
jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? Because he was outstanding in his field!"
]

fun_facts = [
    "Did you know? Honey never spoils.",
    "Fun fact: A day on Venus is longer than a year on Venus."
]


# Function to convert text to speech
def speak(text):
    engine.say(text)
    engine.runAndWait()


# Function to generate a response from GPT-3 or GPT-4
def ask_openai(question):
    openai.api_key = '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'
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": question}]
        )
        return response['choices'][0]['message']['content']
    except openai.error.RateLimitError:
        print("Rate limit exceeded. Retrying after 60 seconds...")
        time.sleep(60)  # Wait for 60 seconds before retrying
        return ask_openai(question)


# Function to get the weather using OpenWeatherMap API
def get_weather(command):
    doc = nlp(command)
    city = None
    for ent in doc.ents:
        if ent.label_ == 'GPE':
            city = ent.text
            break

    if not city:
        speak("Please specify the city you want the weather for.")
        return

    api_key = "03f7fb2a6ffa9af4e20414dc73edb7a3"
    base_url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"

    try:
        response = requests.get(base_url)
        data = response.json()

        if data['cod'] == 200:
            temperature = data['main']['temp']
            weather_description = data['weather'][0]['description']
            speak(f"The temperature in {city} is {temperature}°C with {weather_description}.")
        else:
            speak(f"Sorry, I couldn't fetch the weather details for {city}.")
    except Exception as e:
        speak(f"An error occurred while fetching the weather: {e}")


# Function to get time-based greeting
def get_time_based_greeting():
    hour = datetime.datetime.now().hour
    if hour < 12:
        return "Good morning"
    elif 12 <= hour < 18:
        return "Good afternoon"
    else:
        return "Good evening"


# Function to get news headlines using News API
def get_news():
    api_key = "c83f785369614f86b9b145c09b7c5c56"
    url = f"https://newsapi.org/v2/top-headlines?country=us&apiKey={api_key}"

    try:
        response = requests.get(url)
        data = response.json()

        if data['status'] == 'ok':
            articles = data['articles']
            if articles:
                headlines = [article['title'] for article in articles[:5]]
                news = "Here are the top news headlines: " + ", ".join(headlines)
                speak(news)
            else:
                speak("No news articles found.")
        else:
            speak("Sorry, I couldn't fetch the news.")
    except Exception as e:
        speak(f"An error occurred while fetching the news: {e}")


# Function to add a reminder
def add_reminder(reminder):
    reminders.append(reminder)
    speak(f"Reminder added: {reminder}")


# Function to list all reminders
def list_reminders():
    if reminders:
        speak("Here are your reminders:")
        for reminder in reminders:
            speak(reminder)
    else:
        speak("You have no reminders.")


# Function to tell a joke
def tell_joke():
    joke = random.choice(jokes)
    speak(joke)


# Function to tell a fun fact
def tell_fun_fact():
    fact = random.choice(fun_facts)
    speak(fact)


# Function to perform basic math calculations
def perform_math(command):
    try:
        result = eval(command)
        speak(f"The result is {result}")
    except Exception:
        speak("Sorry, I couldn't calculate that.")


# Function for unit conversion
def convert_units(command):
    ureg = pint.UnitRegistry()
    try:
        # Extract the numerical value and units from the command
        parts = command.split()
        if len(parts) < 4:
            speak("Invalid conversion command.")
            return

        quantity = float(parts[1])
        from_unit = parts[2]
        to_unit = parts[4]

        # Perform the conversion
        result = ureg(f"{quantity} {from_unit}").to(to_unit)
        print(f"The result is {result:.2f} {to_unit}")
        speak(f"The result is {result:.2f} {to_unit}")


    except Exception as e:
        # Provide detailed error information
        print(f"Error: {e}")
        speak("Sorry, I couldn't convert that.")

# Function to open YouTube and search for a song
def open_youtube_and_play(command):
    if 'play' in command:
        song_name = command.split('play', 1)[1].strip()
        if song_name:
            threading.Thread(target=play_youtube_song, args=(song_name,)).start()
        else:
            speak("Please specify the song you want to play.")
    else:
        speak("Please specify the song you want to play.")


# Function to search and play the song on YouTube
def play_youtube_song(song_name):
    try:
        driver = webdriver.Chrome()  # Make sure ChromeDriver is installed and in your system's PATH
        driver.get("https://www.youtube.com")

        time.sleep(2)
        search_box = driver.find_element(By.NAME, "search_query")
        search_box.send_keys(song_name)
        search_box.send_keys(Keys.RETURN)

        time.sleep(2)
        first_video = driver.find_element(By.XPATH, '//*[@id="video-title"]')
        first_video.click()

        driver.maximize_window()  # Maximize the window for full screen
        while True:
            time.sleep(1)
            try:
                driver.current_url
            except WebDriverException:
                break

    except Exception as e:
        speak(f"An error occurred: {e}")
    finally:
        driver.quit()




# Function to open WhatsApp Web
def open_whatsapp():
    try:
        webbrowser.open("https://api.whatsapp.com")
        print("Opening WhatsApp Web")
    except Exception as e:
        speak(f"An error occurred while opening WhatsApp: {e}")


# Combined function to handle both NLP and keyword-based commands
def handle_command_with_nlp(command):
    command_lower = command.lower()

    if 'email' in command_lower:
        speak("Do you want to send an email?")
        # Add logic for sending an email

    elif 'weather' in command_lower:
        speak("Fetching weather details...")
        get_weather(command)

    elif 'news' in command_lower:
        speak("Fetching news headlines...")
        get_news()

    elif 'joke' in command_lower:
        tell_joke()

    elif 'fun fact' in command_lower:
        tell_fun_fact()

    elif 'calculate' in command_lower:
        math_expression = command_lower.replace('calculate', '').strip()
        perform_math(math_expression)

    elif 'convert' in command_lower:
        convert_units(command_lower)

    elif 'remind me to' in command_lower:
        reminder_text = command_lower.replace('remind me to', '').strip()
        add_reminder(reminder_text)

    elif 'list reminders' in command_lower:
        list_reminders()

    elif 'who are you' in command_lower:
        speak("I am JAN, your assistent")

    elif 'what is your name' in command_lower or 'your name' in command_lower:
        speak("I am JAN!")

    elif 'open youtube' in command_lower and 'play' in command_lower:
        open_youtube_and_play(command_lower)

    elif 'open notepad' in command_lower:
        speak("Opening Notepad")
        os.system("notepad")

    elif 'open whatsapp' in command_lower:
        speak("Opening WhatsApp")
        threading.Thread(target=open_whatsapp).start()

    elif 'search' in command_lower:
        query = command_lower.replace('search', '').strip()
        if query:
            speak(f"Searching for {query}")
            webbrowser.open(f"https://www.google.com/search?q={query}")
        else:
            speak("Please specify what you want me to search for.")

    elif 'sleep' in command_lower:
        speak("Putting the system into sleep mode")
        os.system("rundll32.exe powrprof.dll,SetSuspendState Sleep")

    elif 'get out' in command_lower:
        speak("Goodbye!")
        return listen_for_hotword()

    elif 'exit' in command_lower or 'quit' in command_lower:
        speak("going out of your space!")
        exit()


    else:
        speak("Let me find the answer for you.")



# Function to recognize speech and return the transcribed text
def recognize_speech():
    with sr.Microphone() as source:
        print("Listening...")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        audio = recognizer.listen(source)

    try:
        print("Recognizing...")
        text = recognizer.recognize_google(audio)
        print(f"You said: {text}")
        speak(f"You said: {text}")
        return text

    except sr.UnknownValueError:
        speak("Sorry, I didn't catch that.")
        return ""

    except sr.RequestError as e:
        speak(f"Error with Google API: {e}")
        return ""


# Main assistant function
# Main assistant function
def jarvis():
    greeting = get_time_based_greeting()
    speak(f"{greeting}, Nitin. How can I assist you today?")
    while True:
        command = recognize_speech()
        if command:
            handle_command_with_nlp(command)
        else:
            speak("Please say something.")


def listen_for_hotword():
    access_key = "l04o9GsSscLVznFyNGBPh0TJ5XeAwiVIigatZLn966YJOgtzhfSstQ=="  # Your access key
    porcupine = pvporcupine.create(
        access_key=access_key,
        keyword_paths=["D:/sem end/curser/pythonProject/hey-jan_en_windows_v3_0_0.ppn"]
    )

    pa = pyaudio.PyAudio()

    audio_stream = pa.open(
        rate=porcupine.sample_rate,
        channels=1,
        format=pyaudio.paInt16,
        input=True,
        frames_per_buffer=porcupine.frame_length
    )

    print("Listening for hotword...")

    try:
        while True:
            pcm = audio_stream.read(porcupine.frame_length)
            pcm = struct.unpack_from("h" * porcupine.frame_length, pcm)
            result = porcupine.process(pcm)

            if result >= 0:
                print("Hotword detected!")
                speak("Hi boss,Jan is getting ready")
                threading.Thread(target=jarvis()).start()  # Run Jarvis in a separate thread to keep listening
    except KeyboardInterrupt:
        print("Stopping...")
    finally:
        audio_stream.close()
        pa.terminate()
        porcupine.delete()


if __name__ == "__main__":
    listen_for_hotword()
