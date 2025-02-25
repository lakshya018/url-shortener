// Step 1: Import Dependencies
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`; // Deployment-ready

// Step 2: Middleware
app.use(express.json());
app.use(cors());

// Step 3: In-Memory Storage
const urlDatabase = {};

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
    
    const shortId = await generateShortId();
    urlDatabase[shortId] = originalUrl;
    
    res.json({ shortUrl: `${BASE_URL}/${shortId}` });
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
    
    res.redirect(originalUrl);
});

// Step 6: Start Server
app.listen(PORT, () => {
    console.log(`Server running on ${BASE_URL}`);
    console.log(`Swagger Docs available at ${BASE_URL}/api-docs`);
});
