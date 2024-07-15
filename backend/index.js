const express = require("express");
const http = require("http");
const cors = require("cors");
const axios = require("axios");
const https = require("https");
const WebSocket = require('ws');
const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic');

const app = express();
app.use(cors());
const server = http.createServer(app);

const appId = 62729;

// Establish connection to Deriv API endpoint
const connection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);
const api = new DerivAPIBasic({ connection });

// Ignore SSL certificate errors
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Disable SSL certificate verification globally
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Endpoint to fetch the last n ticks for
app.get('/api/ticks', async (req, res) => {
    const { symbol, count } = req.query;
    console.log(`Symbol: ${symbol}, Count: ${count}`);

    if(!symbol || !count) {
        return res.status(400).send({ error: "Symbol and count are required parameters" });
    }

    try {
        const url = `https://api.deriv.com/v3/price_ticker?symbol=${symbol}&count=${count}`;
        const response = await axios.get(url);
        res.send(response.data.ticks);
    } catch (error) {
        console.error('Error fetching ticks:', error);
        res.status(500).send({ error: 'Error fetching ticks' });
    }
 });

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