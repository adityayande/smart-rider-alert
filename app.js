document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const currentSpeedDisplay = document.getElementById('currentSpeedDisplay');
    const limitValueDisplay = document.getElementById('limitValueDisplay');
    const speedLimitSlider = document.getElementById('speedLimit');
    const speedPanel = document.getElementById('speedPanel');
    const speedWarning = document.getElementById('speedWarning');
    
    const weatherIconDisplay = document.getElementById('weatherIconDisplay');
    const temperatureDisplay = document.getElementById('temperatureDisplay');
    const weatherDescDisplay = document.getElementById('weatherDescDisplay');
    const weatherAlert = document.getElementById('weatherAlert');
    const locationDisplay = document.getElementById('locationDisplay');
    
    const simControls = document.getElementById('simControls');
    const simSpeedSlider = document.getElementById('simSpeed');
    const simSpeedVal = document.getElementById('simSpeedVal');
    
    const realGpsToggle = document.getElementById('realGpsToggle');
    const gpsStatusBadge = document.getElementById('gpsStatusBadge');
    const envStatusBadge = document.getElementById('envStatusBadge');
    
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // ---- State Variables ----
    let currentSpeed = 0;
    let speedLimit = parseInt(speedLimitSlider.value);
    let isAlarming = false;
    let isRealTimeMode = false;
    let currentCityName = "Simulation Area";
    
    let gpsWatchId = null;
    let lastWeatherFetchTime = 0;

    // ---- Web Audio API ----
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let beepInterval;

    function playBeep() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    }

    function toggleAlarm(start) {
        if (start && !isAlarming) {
            isAlarming = true;
            speedPanel.classList.add('alert');
            speedWarning.classList.remove('hidden');
            beepInterval = setInterval(playBeep, 400); 
            playBeep(); 
        } else if (!start && isAlarming) {
            isAlarming = false;
            speedPanel.classList.remove('alert');
            speedWarning.classList.add('hidden');
            clearInterval(beepInterval);
        }
    }

    function updateSpeed(newSpeed) {
        currentSpeed = Math.round(newSpeed);
        currentSpeedDisplay.innerText = currentSpeed;
        if (currentSpeed > speedLimit) {
            toggleAlarm(true);
        } else {
            toggleAlarm(false);
        }
    }

    // ---- Event Listeners ----
    speedLimitSlider.addEventListener('input', (e) => {
        speedLimit = parseInt(e.target.value);
        limitValueDisplay.innerText = speedLimit;
        updateSpeed(currentSpeed); // Recheck
    });

    // SIMULATION CONTROLS
    simSpeedSlider.addEventListener('input', (e) => {
        if (isRealTimeMode) return;
        simSpeedVal.innerText = e.target.value;
        updateSpeed(e.target.value);
    });

    ['Sun', 'Rain', 'Storm'].forEach(type => {
        document.getElementById(`btn${type}`).addEventListener('click', () => {
            if (isRealTimeMode) return;
            handleSimulatedWeather(type);
        });
    });

    // THEME CONTROLS
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            themeIcon.className = 'bx bx-moon';
        } else {
            themeIcon.className = 'bx bx-sun';
        }
    });

    // ---- REAL TIME GPS & WEATHER LOGIC ----
    
    realGpsToggle.addEventListener('change', (e) => {
        isRealTimeMode = e.target.checked;
        if (isRealTimeMode) {
            simControls.classList.add('disabled-panel');
            startRealTimeTracking();
        } else {
            simControls.classList.remove('disabled-panel');
            stopRealTimeTracking();
            // Reset to simulation values
            updateSpeed(simSpeedSlider.value);
            gpsStatusBadge.classList.add('hidden');
            envStatusBadge.classList.add('hidden');
        }
    });

    function startRealTimeTracking() {
        if (!navigator.geolocation) {
            showGpsError("GEOLOCATION NOT SUPPORTED");
            return;
        }

        gpsStatusBadge.classList.remove('hidden');
        gpsStatusBadge.innerText = "GPS SIGNAL: SEARCHING...";
        gpsStatusBadge.className = "";

        gpsWatchId = navigator.geolocation.watchPosition(
            (position) => {
                gpsStatusBadge.innerText = "GPS SIGNAL: LOCKED";
                gpsStatusBadge.style.color = "var(--accent-green)";
                
                // Speed is in m/s. Convert to km/h. If null, user is stationary or hardware lacks speed sensor.
                let speedMps = position.coords.speed;
                let speedKmh = speedMps ? (speedMps * 3.6) : 0;
                updateSpeed(speedKmh);

                // Fetch real weather based on coordinates (throttle to once every 5 minutes)
                let now = Date.now();
                if (now - lastWeatherFetchTime > 300000 || lastWeatherFetchTime === 0) {
                    fetchRealWeather(position.coords.latitude, position.coords.longitude);
                    lastWeatherFetchTime = now;
                }
            },
            (error) => {
                let msg = "GPS ERROR";
                if(error.code === 1) msg = "GPS DENIED (ENABLE PERMISSIONS / USE HTTPS)";
                showGpsError(msg);
            },
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    }

    function stopRealTimeTracking() {
        if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
        gpsStatusBadge.innerText = "GPS OFF";
    }

    function showGpsError(msg) {
        gpsStatusBadge.classList.remove('hidden');
        gpsStatusBadge.innerText = msg;
        gpsStatusBadge.className = "error";
        updateSpeed(0);
    }

    // ---- OPEN-METEO WEATHER API LOGIC ----
    async function fetchRealWeather(lat, lon) {
        envStatusBadge.classList.remove('hidden');
        envStatusBadge.innerText = "FETCHING RADAR...";
        
        try {
            // 1. Fetch City Name (Reverse Geocoding)
            try {
                const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                const geoData = await geoResponse.json();
                currentCityName = geoData.city || geoData.locality || "Rural Area";
            } catch (e) {
                currentCityName = "GPS Location";
            }

            // 2. Fetch Weather Data
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
            const data = await response.json();
            
            const temp = Math.round(data.current.temperature_2m);
            const wmoCode = data.current.weather_code;
            
            envStatusBadge.innerText = "LIVE RADAR: SYNCED";
            envStatusBadge.style.color = "var(--accent-green)";
            
            processWmoCode(wmoCode, temp);
        } catch (err) {
            envStatusBadge.innerText = "RADAR OFFLINE";
            envStatusBadge.style.color = "var(--accent-red)";
        }
    }

    function processWmoCode(code, temp) {
        temperatureDisplay.innerText = temp;
        weatherAlert.classList.add('hidden'); // default hidden

        // WMO Code Interpretation
        if (code <= 3) {
            // Clear or cloudy
            setWeatherUI('bx-sun', '#ffcc00', 'Clear / Cloudy');
        } else if (code >= 45 && code <= 48) {
            // Fog
            setWeatherUI('bx-cloud', '#8b9bb4', 'Foggy');
            showWeatherAlert('bx-low-vision', 'POOR VISIBILITY - FOG AHEAD', 'var(--accent-yellow)');
        } else if (code >= 51 && code <= 67) {
            // Rain / Drizzle
            setWeatherUI('bx-cloud-rain', '#00d2ff', 'Raining');
            showWeatherAlert('bxs-cloud-rain', 'RAIN DETECTED - WET ROAD WARNING', 'var(--accent-blue)');
        } else if (code >= 71 && code <= 77) {
            // Snow
            setWeatherUI('bx-cloud-snow', '#ffffff', 'Snowing');
            showWeatherAlert('bx-error', 'ICY ROADS - EXTREME CAUTION', 'var(--accent-blue)');
        } else if (code >= 80 && code <= 82) {
            // Showers
            setWeatherUI('bx-cloud-rain', '#00d2ff', 'Heavy Showers');
            showWeatherAlert('bxs-cloud-rain', 'HEAVY RAIN WARNING', 'var(--accent-blue)');
        } else if (code >= 95) {
            // Thunderstorm
            setWeatherUI('bx-cloud-lightning', '#ff3366', 'Thunderstorm');
            showWeatherAlert('bx-error', 'SEVERE STORM WARNING!', 'var(--accent-red)');
        }
    }

    function setWeatherUI(iconClass, color, text) {
        weatherIconDisplay.className = `bx ${iconClass}`;
        weatherIconDisplay.style.color = color;
        weatherDescDisplay.innerText = text;
        locationDisplay.innerText = currentCityName;
        window.document.documentElement.style.setProperty('--accent-yellow', color);
    }

    function showWeatherAlert(iconClass, text, color) {
        weatherAlert.innerHTML = `<i class='bx ${iconClass}'></i> ${text}`;
        weatherAlert.className = 'warning-banner weather-warning';
        weatherAlert.style.borderColor = color;
        weatherAlert.style.color = color;
        weatherAlert.style.backgroundColor = `rgba(20,25,40, 0.8)`; // dark bg for contrast
        weatherAlert.classList.remove('hidden');
    }

    function handleSimulatedWeather(type) {
        currentCityName = "Simulation Area";
        // Just mappings for the sim buttons
        if(type === 'Sun') processWmoCode(0, 32);
        if(type === 'Rain') processWmoCode(63, 22);
        if(type === 'Storm') processWmoCode(95, 18);
        document.querySelectorAll('.button-group button').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn${type}`).classList.add('active');
    }

    // Audio context click requirement
    const enableAudio = () => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        document.removeEventListener('click', enableAudio);
    };
    document.addEventListener('click', enableAudio);
});
