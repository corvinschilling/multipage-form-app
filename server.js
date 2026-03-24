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
            lang,
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
            const errorMsg = (lang === 'de') 
                ? 'Bitte füllen Sie alle Pflichtfelder aus!' 
                : 'Veuillez remplir tous les champs obligatoires !';
            return res.status(400).json({ success: false, message: errorMsg });
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

        const isDe = (lang === 'de');

        // Translate Values
        const tValDict = {
            'oui': 'Ja',
            'non': 'Nein',
            'pas necessaire': 'Nicht erforderlich',
            'existant': 'Vorhanden',
            'Visible/lisible': 'Sichtbar/lesbar',
            'Illisible/non visible': 'Unleserlich/nicht sichtbar',
            'outillage propre, prêt à l\'emploi et complet': 'Werkzeuge sauber, einsatzbereit & vollständig',
            'risque de trébuchement dû aux câbles': 'Stolpergefahr durch Kabel',
            'électricité (câble défectueux, etc.)': 'Elektro (Kabel defekt etc.)',
            'EPI en bon état et porté': 'PSA in Ordnung und getragen',
            'absence d\'EPI': 'PSA fehlt',
            'EPI incomplet': 'PSA unvollständig',
            'EPI non porté': 'PSA wird nicht getragen',
            'non requis': 'Nicht erforderlich',
            'Défaut': 'Mangelhaft',
            'Inadapté': 'Ungeeignet',
            'Non utilisé par les employés': 'Wird von Mitarbeitern nicht genutzt',
            'Manquant': 'Fehlt',
            'Incomplet': 'Unvollständig',
            'Expiré': 'Abgelaufen',
            'Modifications apportées': 'Änderungen vorgenommen',
            'Protocole de contrôle appose de manière visible': 'Prüfprotokoll sichtbar angebracht',
            'Monte par du personnel forme en interne': 'Durch intern geschultes Personal aufgebaut',
            'Oui, tout est documenté et approuvé': 'Ja, alles ist dokumentiert und freigegeben',
            'Non, sécurité non respectée': 'Nein, Sicherheit nicht gegeben',
        };

        const tv = (val) => {
            if (!isDe || !val) return val;
            if (Array.isArray(val)) return val.map(v => tValDict[v] || v);
            return tValDict[val] || val;
        };

        // Translated Variables
        const t_accesSecurite = tv(accesSecurite);
        const t_accesSecuriteSub = tv(accesSecuriteSub);
        const t_consignesVisibles = tv(consignesVisibles);
        const t_substancesDangereuses = tv(substancesDangereuses);
        const t_substancesSub = tv(substancesSub);
        const t_machinesOutils = tv(machinesOutils);
        const t_epi = tv(epi);
        const t_aideLevage = tv(aideLevage);
        const t_aideLevageSub = tv(aideLevageSub);
        const t_dechetsChantier = tv(dechetsChantier);
        const t_installationsSanitaires = tv(installationsSanitaires);
        const t_materielSecours = tv(materielSecours);
        const t_materielSecoursSub = tv(materielSecoursSub);
        const t_echafaudages = tv(echafaudages);
        const t_echafaudagesSub = tv(echafaudagesSub);
        const t_modificationsSub = tv(modificationsSub);

        // Labels mapping
        const lbl = {
            title: isDe ? "Audit Bauvorhaben - Bericht" : "Audit Chantier - Rapport",
            nrChantier: isDe ? "N° Bauvorhaben" : "N° Chantier",
            acces: isDe ? "Zugang und Sicherheit" : "Accès et sécurité",
            detailsExistant: isDe ? "Bemerkungen (vorhanden)" : "Détails (existant)",
            consignes: isDe ? "Sicherheitsanweisungen sichtbar" : "Consignes de sécurité visibles",
            substances: isDe ? "Gefahrstoffe" : "Substances dangereuses",
            detailsSubstances: isDe ? "Details Gefahrstoffe" : "Détails substances",
            machines: isDe ? "Maschinen und Werkzeuge" : "Machines et outils",
            epi: isDe ? "Persönliche Schutzausrüstung (PSA)" : "Equipement de protection individuelle (EPI)",
            levage: isDe ? "Hebe- und Transporthilfen" : "Aide au levage et au transport",
            detailsLevage: isDe ? "Bemerkungen (Hebe/Transport)" : "Détails levage",
            domaine: isDe ? "Tätigkeitsbereich" : "Domaine d'activité",
            voirPhoto: isDe ? "(Siehe beigefügte Foto)" : "(Voir photo jointe)",
            dechets: isDe ? "Baustellenabfall richtig getrennt" : "Déchets de chantier, emballages triés correctement",
            sanitaires: isDe ? "Sanitäranlagen nutzbar & hygienisch in Ordnung" : "Installations sanitaires utilisables et hygiéniques",
            secours: isDe ? "Erste Hilfe Material vorhanden" : "Matériel de premiers secours disponible",
            detailsSecours: isDe ? "Bemerkungen (Erste Hilfe)" : "Détails secours",
            echafaudages: isDe ? "Gerüste auf Bauvorhaben" : "Échafaudages sur place",
            detailsEchaf: isDe ? "Bemerkungen (Gerüste)" : "Détails échafaudages",
            modifications: isDe ? "Bemerkungen (Änderungen)" : "Modifications apportées",
            autres: isDe ? "Sonstige Bemerkungen/Feststellungen/Mängel" : "Autres remarques/observations/défauts",
            photosJointes: isDe ? "Beigefügte Fotos" : "Photos jointes",
            aucunePhoto: isDe ? "Kein Foto hochgeladen." : "Aucune photo téléchargée.",
            nonSpecifie: isDe ? "Nicht angegeben" : "Non spécifié",
            aucun: isDe ? "Keine" : "Aucun",
            aucune: isDe ? "Keine" : "Aucune"
        };

        // Prepare Email Content
        const html = `
            <h2>${lbl.title}</h2>
            
            <p><strong>${lbl.nrChantier}:</strong> ${nrChantier}</p>
            
            <hr />
            <p><strong>${lbl.acces}:</strong> ${t_accesSecurite}</p>
            ${t_accesSecuriteSub ? `<p><strong>${lbl.detailsExistant}:</strong> ${t_accesSecuriteSub}</p>` : ''}
            
            <p><strong>${lbl.consignes}:</strong> ${t_consignesVisibles}</p>
            
            <hr />
            <p><strong>${lbl.substances}:</strong> ${t_substancesDangereuses || lbl.nonSpecifie}</p>
            ${(t_substancesSub && t_substancesSub.length > 0) ? `<p><strong>${lbl.detailsSubstances}:</strong> ${t_substancesSub.join(', ')}</p>` : ''}
            
            <hr />
            <p><strong>${lbl.machines}:</strong> ${(t_machinesOutils && t_machinesOutils.length > 0) ? t_machinesOutils.join(', ') : lbl.aucun}</p>
            
            <hr />
            <p><strong>${lbl.epi}:</strong> ${t_epi || lbl.nonSpecifie}</p>
            
            <hr />
            <p><strong>${lbl.levage}:</strong> ${t_aideLevage || lbl.nonSpecifie}</p>
            ${(t_aideLevageSub && t_aideLevageSub.length > 0) ? `<p><strong>${lbl.detailsLevage}:</strong> ${t_aideLevageSub.join(', ')}</p>` : ''}

            <hr />
            <p><strong>${lbl.domaine}:</strong> ${lbl.voirPhoto}</p>
            
            <p><strong>${lbl.dechets}:</strong> ${t_dechetsChantier || lbl.nonSpecifie}</p>
            
            <hr />
            <p><strong>${lbl.sanitaires}:</strong> ${t_installationsSanitaires || lbl.nonSpecifie}</p>
            
            <p><strong>${lbl.secours}:</strong> ${t_materielSecours || lbl.nonSpecifie}</p>
            ${(t_materielSecoursSub && t_materielSecoursSub.length > 0) ? `<p><strong>${lbl.detailsSecours}:</strong> ${t_materielSecoursSub.join(', ')}</p>` : ''}
            
            <hr />
            <p><strong>${lbl.echafaudages}:</strong> ${t_echafaudages || lbl.nonSpecifie}</p>
            ${(t_echafaudagesSub && t_echafaudagesSub.length > 0) ? `<p><strong>${lbl.detailsEchaf}:</strong> ${t_echafaudagesSub.join(', ')}</p>` : ''}
            ${(t_modificationsSub && t_modificationsSub.length > 0) ? `<p><strong>${lbl.modifications}:</strong> ${t_modificationsSub.join(', ')}</p>` : ''}
            
            <hr />
            <p><strong>${lbl.autres}:</strong><br/>${(autresRemarques || lbl.aucune).replace(/\n/g, '<br/>')}</p>

            <hr />
            <h2>${lbl.photosJointes}</h2>
            ${photosHtml || `<p>${lbl.aucunePhoto}</p>`}
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
            const errorMsg = isDe 
                ? 'Fehler beim Senden der E-Mail über Resend.' 
                : 'Erreur lors de l\'envoi de l\'e-mail via Resend.';
            return res.status(500).json({ success: false, message: errorMsg });
        }

        console.log('Message sent:', data);

        // Success response
        res.status(200).json({ success: true, message: 'Audit envoyé avec succès !' });
    } catch (error) {
        console.error('Error sending email:', error);
        // Error response
        const isDeFallback = (req.body && req.body.lang === 'de');
        const errorMsg = isDeFallback 
            ? 'Serverfehler. E-Mail konnte nicht verarbeitet werden.' 
            : 'Erreur serveur. Impossible de traiter l\'e-mail.';
        res.status(500).json({ success: false, message: errorMsg });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server startet auf http://localhost:${PORT}`);
});