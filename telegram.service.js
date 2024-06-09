import { Telegraf } from 'telegraf';
import FormData from 'form-data';
import axios from 'axios';

class TelegramService {
  constructor(token) {
    this.bot = new Telegraf(token);
  }

  async sendMessage(message, chatId, photo) {
    try {
      if (photo) {
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('caption', message);
        form.append('photo', photo.buffer, photo.originalname);

        const url = `https://api.telegram.org/bot${this.bot.token}/sendPhoto`;
        await axios.post(url, form, {
          headers: form.getHeaders()
        });
      } else {
        await this.bot.telegram.sendMessage(chatId, message);
      }
      return { success: true, message: 'Message sent to Telegram successfully' };
    } catch (error) {
      console.error('Error sending message to Telegram:', error);
      return { success: false, error: 'Failed to send message to Telegram' };
    }
  }
}

export default TelegramService;
