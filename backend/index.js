const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic');
const WebSocket = require('ws');
const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const appId = 62729;

// Establish connection to Deriv API endpoint
const connection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);
const api = new DerivAPIBasic({ connection });

// Subscribe to tick updates for the stock symbol R_100
const tickStream = () => api.subscribe({ ticks: 'R_100' });

const tickResponse = async (res) => {
    const data = JSON.parse(res.data);

    if (data.error !== undefined) {
        console.log('Error: ' + data.error.message);
        connection.removeEventListener('message', tickResponse, false);
        await api.disconnect();
    }

    if (data.msg_type === 'tick') {
        console.log(data.tick);
    }
};

const subscribeTicks = async () => {
    await tickStream();
    connection.addEventListener("message", tickResponse);
};

subscribeTicks();

// WebSocket server for clients to connect to
const wss = new WebSocket.Server({ server });

// Handle client connection
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Relay messages from DerivAPI to the connected client
    const handleMessage = (res) => {
        ws.send(res.data);
    };

    connection.addEventListener('message', handleMessage);

    // Handle client disconnections
    ws.on('close', () => {
        console.log('Client disconnected');
        connection.removeEventListener("message", handleMessage);
    });
});

// Start the server
server.listen(4000, () => {
    console.log('Server running on port 4000');
});