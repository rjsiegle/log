const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Define user roles
const userRoles = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    GUEST_MOD: 'guest_mod'
};

// In-memory user data for demo purposes
const users = [
    //Attacks Mods first:
    { username: 'bpbattacks3', password: bcrypt.hashSync('P4vement', 10), role: userRoles.ADMIN },
    { username: 'bpbattacks9', password: bcrypt.hashSync('wR5sD@kYhU', 10), role: userRoles.MODERATOR },
    { username: 'bpbattacks10', password: bcrypt.hashSync('eT8dF#jNvG', 10), role: userRoles.MODERATOR },
    //then by mod order
    { username: 'submod4', password: bcrypt.hashSync('rY3fG$zHcX', 10), role: userRoles.MODERATOR },
    { username: 'submod_bpb_55', password: bcrypt.hashSync('tU2gH%xJvB', 10), role: userRoles.MODERATOR },
    { username: 'bpb_mod8', password: bcrypt.hashSync('yI9hJ&cKnM', 10), role: userRoles.MODERATOR },
    { username: 'guestmod', password: bcrypt.hashSync('chinchilla', 10), role: userRoles.GUEST_MOD }
];

// Function to fetch published CSV URL
async function fetchCsvUrl() {
    try {
        const credentials = require('./credentials.json');
        const jwtClient = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets.readonly']
        );
        const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // Update this with your actual spreadsheet ID
        const sheets = google.sheets({ version: 'v4', auth: jwtClient });

        const response = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
            fields: 'sheets.properties',
        });
        // Extract the CSV URL correctly from the response
        // Adjust this logic based on the actual structure of the response
        const csvUrl = response.data.sheets[0].properties.csvLink;
        return csvUrl;
    } catch (error) {
        console.error('Error fetching CSV URL:', error);
        return null;
    }
}

// Serve static files (e.g., your HTML files)
app.use(express.static('public'));

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (user) {
        if (bcrypt.compareSync(password, user.password)) {
            req.session.user = user;
            if (user.role === userRoles.GUEST_MOD) {
                res.redirect('/guestmod'); // Redirect guest user to guestmod page
            } else {
                res.redirect('/landing'); // Redirect regular user to landing page
            }
        } else {
            res.status(401).send('Invalid username or password');
        }
    } else {
        res.status(401).send('User not found');
    }
});

// Landing page route (protected)
app.get('/landing', authMiddleware, (req, res) => {
    const { user } = req.session;
    if (user.role === userRoles.ADMIN || user.role === userRoles.MODERATOR) {
        res.sendFile(path.join(__dirname, 'public', 'landing.html'));
    } else {
        res.status(403).send('Access Forbidden'); // Handle other roles or unauthorized access
    }
});

// Route for serving the guest mod page
app.get('/guestmod', authMiddleware, (req, res) => {
    const { user } = req.session;
    if (user.role === userRoles.GUEST_MOD) {
        res.sendFile(path.join(__dirname, 'public', 'guestmod.html'));
    } else {
        res.status(403).send('Access Forbidden'); // Guest mods only
    }
});

// Update HTML page with dynamic CSV link
app.get('/download-csv', async (req, res) => {
    const csvUrl = await fetchCsvUrl();
    if (csvUrl) {
        // Dynamically generate HTML content with CSV download link
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Download CSV</title>
            </head>
            <body>
                <h1>Download Google Sheets as CSV</h1>
                <a href="${csvUrl}" download>Download CSV</a>
            </body>
            </html>
        `;
        res.send(htmlContent); // Send the HTML content as the response
    } else {
        res.status(500).send('Failed to fetch CSV URL.');
    }
});

// Route for serving CSV file
app.get('/csv', (req, res) => {
    // Serve CSV file or render CSV data
    // Example:
    res.sendFile(path.join(__dirname, 'public', 'file.csv'));
});

// Protect routes
function authMiddleware(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/');
    }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
