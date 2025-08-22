import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import fs from 'fs';

const ALL_VOICE_LAB_API_KEY = process.env.ALL_VOICE_LAB_API_KEY;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err: any, fields: formidable.Fields, files: formidable.Files) => {
    if (err) {
      return res.status(400).json({ error: 'Error parsing form data' });
    }
    let audioFile: File | undefined;
    if (Array.isArray(files.audio)) {
      audioFile = files.audio[0];
    } else {
      audioFile = files.audio as File;
    }
    let text: string | undefined;
    if (Array.isArray(fields.text)) {
      text = fields.text[0];
    } else {
      text = fields.text as string;
    }
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    try {
      // Use form-data for Node.js
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(audioFile.filepath), audioFile.originalFilename || 'audio.wav');
      if (text) formData.append('text', text);
      const response = await fetch('https://api.all-voice-lab.com/v1/clone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ALL_VOICE_LAB_API_KEY}`,
          ...formData.getHeaders(),
        },
        body: formData,
      });
      if (!response.ok) {
        return res.status(500).json({ error: 'Voice cloning failed' });
      }
      const resultBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(resultBuffer));
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

export default handler;
