import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import PostService from './post.service.js';
import TelegramService from './telegram.service.js';
import { registerUser } from './register.service.js';

const app = express();
const port = 3000;

const upload = multer();

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

const postService = new PostService();

app.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // Регистрируем пользователя
      const result = await registerUser(username, password);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

app.post('/submit-post', async (req, res) => {
  try {
    const postData = req.body;
    const result = await postService.processPost(postData);
    res.json(result); // Отправка результата в формате JSON
  } catch (error) {
    console.error('Ошибка при обработке поста:', error);
    res.status(500).json({ error: 'Ошибка сервера' }); // Отправка ошибки в формате JSON
  }
});

app.post('/send-to-telegram', upload.single('photo'), async (req, res) => {
  try {
    const telegramMessage = req.body.message;
    const chatId = '1102971924'; // Ваш chatId
    const telegramToken = req.body.telegramToken;
    const photo = req.file;

    const telegramService = new TelegramService(telegramToken);

    const result = await telegramService.sendMessage(telegramMessage, chatId, photo);

    if (result.success) {
      res.send('Сообщение успешно отправлено в телеграмм');
    } else {
      res.status(500).send(result.error);
    }
  } catch (error) {
    console.error('Ошибка при отправке сообщения в телеграмм:', error);
    res.status(500).send('Ошибка сервера');
  }
});



app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
