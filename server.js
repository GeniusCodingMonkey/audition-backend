const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');
const stream = require('stream');

const app = express();

// Enable CORS so your InfinityFree frontend can communicate with this Render backend
app.use(cors());

// Configure Multer for in-memory uploads
const upload = multer({ storage: multer.memoryStorage() });

// Authenticate with Google Drive
// This looks for the Secret File you will set up in Render's dashboard
const auth = new google.auth.GoogleAuth({
  keyFile: './google-credentials.json', 
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    const character = req.body.character;
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'No video file provided' });
    }

    // Convert memory buffer to readable stream for Google Drive
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    // Upload the file to your specific Drive folder
    const driveResponse = await drive.files.create({
      requestBody: {
        name: `${character}_audition_${Date.now()}.mp4`,
        parents: ['1R_oDTSKju0nAu4N0iJYDr2Zkx51yNw53'] 
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
    });

    res.status(200).json({ success: true, fileId: driveResponse.data.id });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// Render assigns a dynamic port via process.env.PORT. 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Casting server running on port ${PORT}`));
