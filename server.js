const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve the frontend application from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for single page application feeling (optional, but good practice)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// A simple mock API endpoint down the line if we want to fetch external weather, 
// but for the dashboard simulation all logic will happen in the frontend.

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Rider Server is running!`);
    console.log(`Access locally at: http://localhost:${PORT}`);
    console.log(`To access on your phone, find your Local IP address using 'ipconfig' and go to http://YOUR_IP_ADDRESS:${PORT}`);
});
