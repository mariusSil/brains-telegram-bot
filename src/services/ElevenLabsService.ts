import axios from 'axios';
import { config } from '../config/vars';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class ElevenLabsService {
  private apiKey: string;
  private voiceId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.ELEVENLABS;
    this.voiceId = 'JkELl0p5yddgBTVx9lBa';
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async textToSpeech(text: string): Promise<string> {
    try {
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        data: {
          text,
          model_id: 'eleven_monolingual_v1',
        },
        responseType: 'arraybuffer',
      });

      // Create voice folder if it doesn't exist
      const voiceFolder = path.join(__dirname, '../../voices');
      if (!fs.existsSync(voiceFolder)) {
        fs.mkdirSync(voiceFolder, { recursive: true });
      }

      // Save the audio file
      const fileName = `${uuidv4()}.mp3`;
      const filePath = path.join(voiceFolder, fileName);
      fs.writeFileSync(filePath, response.data);

      return filePath;
    } catch (error) {
      console.error('Error in textToSpeech:', error);
      throw error;
    }
  }

  shouldUseVoice(): boolean {
    return Math.random() < 0.2; // 20% chance
  }
}

export const elevenLabsService = new ElevenLabsService();
