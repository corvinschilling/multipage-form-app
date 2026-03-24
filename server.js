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
        const { 
            nrChantier, 
            accesSecurite, 
            accesSecuriteSub, 
            consignesVisibles, 
            substancesDangereuses,
            substancesSub,
            machinesOutils,
            epi,
            aideLevage,
            aideLevageSub,
            installationsSanitaires,
            materielSecours,
            materielSecoursSub,
            dechetsChantier,
            echafaudages,
            echafaudagesSub,
            modificationsSub,
            autresRemarques,
            photos 
        } = req.body;

        // Basic backend validation
        if (!nrChantier || !accesSecurite || !consignesVisibles) {
            return res.status(400).json({ success: false, message: 'Veuillez remplir tous les champs obligatoires !' });
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
            if (photos.photoStockage) processPhoto(photos.photoStockage, 'Stockage correct');
            if (photos.photoDefaut) processPhoto(photos.photoDefaut, 'Défaut de levage');
            if (photos.photoDechets) processPhoto(photos.photoDechets, 'Déchets de chantier');
            
            if (photos.photoDomaine && Array.isArray(photos.photoDomaine)) {
                photos.photoDomaine.forEach((base64Data, index) => {
                    processPhoto(base64Data, `Domaine d'activité ${index + 1}`);
                });
            }
            
            if (photos.photoMateriaux && Array.isArray(photos.photoMateriaux)) {
                photos.photoMateriaux.forEach((base64Data, index) => {
                    processPhoto(base64Data, `Matériaux et fabrication ${index + 1}`);
                });
            }
            if (photos.photoRemarques && Array.isArray(photos.photoRemarques)) {
                photos.photoRemarques.forEach((base64Data, index) => {
                    processPhoto(base64Data, `Autres remarques ${index + 1}`);
                });
            }
        }

        // Prepare Email Content
        const html = `
            <h2>Audit Chantier - Rapport</h2>
            
            <p><strong>N° Chantier:</strong> ${nrChantier}</p>
            
            <hr />
            <p><strong>Accès et sécurité:</strong> ${accesSecurite}</p>
            ${accesSecuriteSub ? `<p><strong>Détails (existant):</strong> ${accesSecuriteSub}</p>` : ''}
            
            <p><strong>Consignes de sécurité visibles:</strong> ${consignesVisibles}</p>
            
            <hr />
            <p><strong>Substances dangereuses:</strong> ${substancesDangereuses || 'Non spécifié'}</p>
            ${(substancesSub && substancesSub.length > 0) ? `<p><strong>Détails substances:</strong> ${substancesSub.join(', ')}</p>` : ''}
            
            <hr />
            <p><strong>Machines et outils:</strong> ${(machinesOutils && machinesOutils.length > 0) ? machinesOutils.join(', ') : 'Aucun'}</p>
            
            <hr />
            <p><strong>Equipement de protection individuelle (EPI) :</strong> ${epi || 'Non spécifié'}</p>
            
            <hr />
            <p><strong>Aide au levage et au transport:</strong> ${aideLevage || 'Non spécifié'}</p>
            ${(aideLevageSub && aideLevageSub.length > 0) ? `<p><strong>Détails levage:</strong> ${aideLevageSub.join(', ')}</p>` : ''}

            <hr />
            <p><strong>Domaine d'activité :</strong> (Voir photo jointe)</p>
            
            <p><strong>Déchets de chantier, emballages triés correctement :</strong> ${dechetsChantier || 'Non spécifié'}</p>
            
            <hr />
            <p><strong>Installations sanitaires utilisables et hygiéniques :</strong> ${installationsSanitaires || 'Non spécifié'}</p>
            
            <p><strong>Matériel de premiers secours disponible :</strong> ${materielSecours || 'Non spécifié'}</p>
            ${(materielSecoursSub && materielSecoursSub.length > 0) ? `<p><strong>Détails secours:</strong> ${materielSecoursSub.join(', ')}</p>` : ''}
            
            <hr />
            <p><strong>Échafaudages sur place :</strong> ${echafaudages || 'Non spécifié'}</p>
            ${(echafaudagesSub && echafaudagesSub.length > 0) ? `<p><strong>Détails échafaudages:</strong> ${echafaudagesSub.join(', ')}</p>` : ''}
            ${(modificationsSub && modificationsSub.length > 0) ? `<p><strong>Modifications apportées:</strong> ${modificationsSub.join(', ')}</p>` : ''}
            
            <hr />
            <p><strong>Autres remarques/observations/défauts :</strong><br/>${(autresRemarques || 'Aucune').replace(/\n/g, '<br/>')}</p>

            <hr />
            <h2>Photos jointes</h2>
            ${photosHtml || '<p>Aucune photo téléchargée.</p>'}
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
        res.status(200).json({ success: true, message: 'Audit envoyé avec succès !' });
    } catch (error) {
        console.error('Error sending email:', error);
        // Error response
        res.status(500).json({ success: false, message: 'Erreur serveur. Impossible de traiter l\'e-mail.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server startet auf http://localhost:${PORT}`);
});