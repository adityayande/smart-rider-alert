<h1 align="center">🏍️ Smart Rider OS Dashboard</h1>

![Project Status](https://img.shields.io/badge/Status-Complete-success)
![Platform](https://img.shields.io/badge/Platform-Web%20App-blue)
![Languages](https://img.shields.io/badge/Code-HTML%20%7C%20CSS%20%7C%20JS-yellow)

The **Smart Rider OS Dashboard** is a modern, real-time Heads-Up Display (HUD) web application designed for two-wheelers. It tracks physical ground speed via GPS satellites and dynamically fetches surrounding real-time weather radar to keep riders safe from over-speeding and bad weather.

## ✨ Features
1. **Real-Time GPS Telemetry**: Connects directly to smartphone satellite hardware to track velocity in `km/h`.
2. **Dynamic Speed Alerts**: Users can set custom speed limits. Exceeding the limit instantly flashes the dashboard red and triggers a native audible, high-frequency alarm using the Web Audio API.
3. **Live Weather Radar**: Pings the Open-Meteo data API using exact coordinates to interpret the World Meteorological Organization (WMO) codes, alerting the rider immediately of fog, rain, or thunderstorms.
4. **Presentation Simulation Mode**: Built-in developer tools that allow users to override GPS and weather data through sliders. Perfect for demonstrating functionality indoors, like in a college classroom.
5. **Aesthetics Mode**: A toggle built directly into the UI switching between standard "Dark Mode" HUD and high-contrast "Light Mode".

---

## ⚙️ How It Works (Technical Flow)

The application solves hardware integration through a purely web-based approach using native HTML5 Web APIs.

* **Frontend**: Vanilla HTML/CSS/JavaScript with a Glassmorphism design system. 
* **Backend**: An `Express.js` (NodeJS) server that serves the static dashboard over the local network.
* **Geolocation API (`navigator.geolocation`)**: When "Real-Time DB" is activated, the browser queries the phone's internal positioning chip. Speed is captured in meters-per-second (`m/s`) and multiplied by `3.6` to achieve Kilometers per Hour (`km/h`).
* **Open-Meteo API**: Once the GPS lock is acquired, the Latitude and Longitude are injected into an asynchronous `fetch()` request to Open-Meteo. The JSON response is parsed into WMO codes to swap UI color-palettes (e.g., Red for Thunderstorms, Blue for rain).
* **Web Audio API**: Rather than relying on external `.mp3` files that might fail to load over slow mobile networks, the speeding alarm initializes an `AudioContext` oscillator, generating pure sound waves dynamically.

---

## 🚀 How To Run & Install

### 1. Run it locally (Laptop/PC)
First, ensure you have [Node.js](https://nodejs.org/) installed on your computer.

```bash
# Navigate to the project directory
cd smart-rider-alert

# Install the server dependencies
npm install

# Start the Express server
npm start
```
Once the server is running, open your web browser and go to `http://localhost:3000`.

### 2. How to Test it Outside (Mobile Phone Tracker)
Mobile Phone browsers have extreme security policies that **block GPS tracking** on local network links (like `http://192.168.x.x`). You must use a secure HTTPS tunnel to test the speed tracker outside.

1. Keep `npm start` running in one terminal window.
2. Open a *new* terminal window and run:
   ```bash
   npx localtunnel --port 3000
   ```
3. Look at your terminal, it will print a secure internet link (e.g., `https://random-words.loca.lt`).
4. Type that exact link into your iPhone or Android browser while riding/walking. 
5. Turn the **Simulation Switch** to **"REAL-TIME DB"** and press Allow Location!

> **Note**: Audio requires a user interaction to play on modern browsers. Always tap the screen anywhere at least once before you begin riding so the alarm has permission to sound.

---

## 👨‍💻 Created By
Developed as a college demonstration project combining UX/UI Design principles with live physical sensor data integration.
