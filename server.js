const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log("ENV PATH:", path.resolve(__dirname, '.env'));
console.log("SMTP_HOST:", process.env.SMTP_HOST);

console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "SET" : "NOT SET");

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Email Transporter Configuration
// Note: It is best practice to enter these details in the .env file!
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// API Endpoint to handle form submission
app.post('/api/submit', async (req, res) => {
    try {
        const { question1, question2, question3, screenshots } = req.body;

        // Basic backend validation
        if (!question1 || !question2 || !question3) {
            return res.status(400).json({ success: false, message: 'Bitte alle Fragen beantworten!' });
        }

        // Process attachments
        const attachments = [];
        if (screenshots && Array.isArray(screenshots)) {
            screenshots.forEach((base64Data, index) => {
                if (base64Data) {
                    // Extract base64 part
                    const base64Image = base64Data.split(';base64,').pop();
                    attachments.push({
                        filename: `screenshot_frage${index + 1}.jpg`,
                        content: base64Image,
                        encoding: 'base64'
                    });
                }
            });
        }

        // Prepare Email Content
        const mailOptions = {
            from: process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@example.com',
            to: 'sitecheck@lampertz.lu',
            subject: 'Neue Formular-Einsendung von der Web-App',
            html: `
                <h2>Neue Formular-Einsendung</h2>
                <p><strong>Frage 1:</strong> ${question1}</p>
                <p><strong>Frage 2:</strong> ${question2}</p>
                <p><strong>Frage 3:</strong> ${question3}</p>
                <p><br><em>Die Screenshots der Formularschritte sind als Anhang beigefügt.</em></p>
            `,
            attachments: attachments
        };

        // Send Email
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);

        // Success response
        res.status(200).json({ success: true, message: 'Formular erfolgreich gesendet!' });
    } catch (error) {
        console.error('Error sending email:', error);
        // Error response
        res.status(500).json({ success: false, message: 'Fehler beim Senden der E-Mail. Bitte überprüfen Sie die Server-Konfiguration.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server startet auf http://localhost:${PORT}`);
});
