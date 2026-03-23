const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log("ENV PATH:", path.resolve(__dirname, '.env'));
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "SET" : "NOT SET");
console.log("MAIL_FROM:", process.env.MAIL_FROM);
console.log("MAIL_TO:", process.env.MAIL_TO);

const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Resend Configuration
const resend = new Resend(process.env.RESEND_API_KEY);

// API Endpoint to handle form submission
app.post('/api/submit', async (req, res) => {
    try {
        const { nrChantier, accesSecurite, accesSecuriteSub, consignesVisibles, photos } = req.body;

        // Basic backend validation
        if (!nrChantier || !accesSecurite || !consignesVisibles) {
            return res.status(400).json({ success: false, message: 'Bitte alle erforderlichen Felder ausfüllen!' });
        }

        // Process attachments
        const attachments = [];
        let photosHtml = '';

        function processPhoto(base64Data, label) {
            if (base64Data) {
                const base64Image = base64Data.split(';base64,').pop();
                const filename = `photo_${label.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
                attachments.push({
                    filename: filename,
                    content: base64Image
                });
                photosHtml += `
                    <div style="margin-bottom: 20px;">
                        <h3>${label}</h3>
                        <img src="${base64Data}" alt="${label}" style="max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 8px;" />
                    </div>
                `;
            }
        }

        if (photos) {
            if (photos.photoAcces) processPhoto(photos.photoAcces, 'Accès et sécurité');
            if (photos.photoConsignes) processPhoto(photos.photoConsignes, 'Consignes de sécurité');
            
            if (photos.photoMateriaux && Array.isArray(photos.photoMateriaux)) {
                photos.photoMateriaux.forEach((base64Data, index) => {
                    processPhoto(base64Data, `Matériaux et fabrication ${index + 1}`);
                });
            }
        }

        // Prepare Email Content
        const html = `
            <h2>Chantier Audit - Teil 1</h2>
            
            <h3>Site 1</h3>
            <p><strong>nr.chantier:</strong> ${nrChantier}</p>
            
            <hr />
            <h3>Site 2</h3>
            <p><strong>Accès et sécurité:</strong> ${accesSecurite}</p>
            ${accesSecuriteSub ? `<p><strong>Unteroption (existant):</strong> ${accesSecuriteSub}</p>` : ''}
            
            <p><strong>Consignes de sécurité visibles:</strong> ${consignesVisibles}</p>
            
            <hr />
            <h2>Fotos</h2>
            ${photosHtml || '<p>Keine Fotos hochgeladen.</p>'}
        `;

        // Send Email
        const { data, error } = await resend.emails.send({
            from: process.env.MAIL_FROM || 'onboarding@resend.dev',
            to: [process.env.MAIL_TO || 'sitecheck@lampertz.lu'],
            subject: `Chantier Audit - Report ${nrChantier}`,
            html: html,
            attachments: attachments
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(500).json({ success: false, message: 'Fehler beim Senden der E-Mail über Resend.' });
        }

        console.log('Message sent:', data);

        // Success response
        res.status(200).json({ success: true, message: 'Audit (Teil 1) erfolgreich gesendet!' });
    } catch (error) {
        console.error('Error sending email:', error);
        // Error response
        res.status(500).json({ success: false, message: 'Server-Fehler. Konnte E-Mail nicht verarbeiten.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server startet auf http://localhost:${PORT}`);
});