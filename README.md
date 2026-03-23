# Multi-Page Formular App

Eine moderne 3-seitige Formular-Web-App mit einem Node.js Backend, das Formulardaten per E-Mail versendet. Das Frontend verfügt über ein Premium Dark-Mode Glassmorphism-Design.

## Voraussetzungen
Stelle sicher, dass **Node.js** auf deinem System installiert ist. Prüfe dies, indem du im Terminal `node -v` eingibst.

## 1. Installation der Pakete

Öffne ein Terminal, navigiere in diesen Ordner (`c:\Antigravitiy\multipage-form-app`) und installiere die benötigten Pakete mit npm:

```bash
npm install express nodemailer dotenv cors
```
*(Da bereits eine `package.json` vorliegt, reicht auch einfach `npm install`)*

Dieses Projekt benötigt folgende Pakete:
- **express**: Für den Webserver und die API.
- **nodemailer**: Um die E-Mails via SMTP zu versenden.
- **dotenv**: Um Umgebungsvariablen wie Mail-Zugangsdaten sicher aus einer `.env` Datei auszulesen.
- **cors**: Erlaubt Cross-Origin Resource Sharing (falls du Frontend/Backend später trennst).

## 2. SMTP / E-Mail Konfiguration

Deine Zugangsdaten dürfen **nicht** direkt im Code (`server.js`) stehen. Dafür haben wir die `.env` Datei.

1. Im Projektordner gibt es eine Datei namens `.env.example`.
2. Benenne diese Datei um in `.env` (oder erstelle eine Kopie namens `.env`).
3. Öffne die `.env` Datei und trage deine echten SMTP-Zugangsdaten ein:

```env
# Server Port
PORT=3000

# SMTP / Mail Info
SMTP_HOST=smtp.dein-provider.com
SMTP_PORT=587
SMTP_SECURE=false

# Deine Mail-Zugangsdaten
SMTP_USER=deine-echte-email@example.com
SMTP_PASS=dein-sicheres-passwort

# Absenderadresse
MAIL_FROM=deine-echte-email@example.com
```

> **Wichtig:** E-Mails werden im Code an `sitecheck@lampertz.lu` versendet. Das ist fest in der `server.js` eingebaut, so wie gewünscht.

## 3. App starten

Starte den Server, indem du folgenden Befehl ausführst:

```bash
node server.js
```

Du solltest im Terminal folgende Meldung sehen:
`🚀 Server startet auf http://localhost:3000`

## 4. App nutzen

1. Öffne deinen Webbrowser.
2. Gehe zu [http://localhost:3000](http://localhost:3000).
3. Fülle das mehrseitige Formular aus und klicke auf der letzten Seite auf **Absenden**.
4. Die App validiert das Formular, zeigt einen Lade-Status an, und sendet die Daten an den Backend-Server, welcher die E-Mail an `sitecheck@lampertz.lu` verschickt!
