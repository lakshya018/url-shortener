// Step 1: Import Dependencies
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = 3000;

// Step 2: Middleware
app.use(express.json()); // Parse JSON body
app.use(cors()); // Allow cross-origin requests

// Step 3: In-Memory Storage
const urlDatabase = {}; // { "shortID": "originalURL" }

// Step 4: Swagger Documentation
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'URL Shortener API',
            version: '1.0.0',
            description: 'A simple URL shortener API',
        },
    },
    apis: ['./index.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Function to generate short ID dynamically
async function generateShortId() {
    const { nanoid } = await import('nanoid');
    return nanoid(6);
}

/**
 * @swagger
 * /shorten:
 *   post:
 *     summary: Shorten a URL
 *     description: Takes a long URL and returns a shortened version.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 example: "https://www.google.com"
 *     responses:
 *       200:
 *         description: Successfully shortened URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortUrl:
 *                   type: string
 *       400:
 *         description: Invalid request
 */
app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;
    if (!originalUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    const shortId = await generateShortId(); // Generate short ID (6 characters)
    urlDatabase[shortId] = originalUrl;
    
    res.json({ shortUrl: `http://localhost:${PORT}/${shortId}` });
});

/**
 * @swagger
 * /{shortId}:
 *   get:
 *     summary: Redirect to original URL
 *     description: Given a short ID, redirects to the original long URL.
 *     parameters:
 *       - in: path
 *         name: shortId
 *         required: true
 *         schema:
 *           type: string
 *         description: The short URL ID
 *     responses:
 *       302:
 *         description: Redirects to the original URL
 *       404:
 *         description: Short URL not found
 */
app.get('/:shortId', (req, res) => {
    const { shortId } = req.params;
    const originalUrl = urlDatabase[shortId];

    if (!originalUrl) {
        return res.status(404).json({ error: 'Short URL not found' });
    }

    // Add CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    res.redirect(originalUrl);
});

// Handle CORS preflight requests
app.options('/:shortId', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});

// Step 6: Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
