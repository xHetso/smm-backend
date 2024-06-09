import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import PostService from './post.service.js';
import TelegramService from './telegram.service.js';

const app = express();
const port = 3000;

const upload = multer();

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

const postService = new PostService();

// Загрузка пользователей из файла users.json
const usersFilePath = './users.json';
let users = [];
if (fs.existsSync(usersFilePath)) {
  const fileData = fs.readFileSync(usersFilePath, 'utf-8');
  users = JSON.parse(fileData);
}

app.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Поиск пользователя в массиве users
    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
      // Если пользователь найден, отправляем ответ с isAdmin: true
      res.json({ isAdmin: true });
    } else {
      // Если пользователь не найден, отправляем ответ с isAdmin: false
      res.json({ isAdmin: false });
    }
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
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

app.post('/submit-form', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    const formData = {
      name,
      phone,
      email,
      message,
    };

    const filePath = './form.json';

    // Read existing data
    let data = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      data = JSON.parse(fileData);
    }

    // Append new form data
    data.push(formData);

    // Write updated data to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({ message: 'Form submission received and saved successfully!' });
  } catch (error) {
    console.error('Ошибка при сохранении формы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/get-form', (req, res) => {
  try {
    const filePath = './form.json';

    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Данные формы не найдены' });
    }

    // Читаем данные из файла
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const formData = JSON.parse(fileData);

    res.json(formData);
  } catch (error) {
    console.error('Ошибка при получении данных формы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

const formFilePath = './form.json';

app.delete('/delete/:index', (req, res) => {
  try {
    const index = req.params.index;

    // Проверяем существование файла
    if (!fs.existsSync(formFilePath)) {
      return res.status(404).json({ error: 'Данные формы не найдены' });
    }

    // Читаем данные из файла
    const fileData = fs.readFileSync(formFilePath, 'utf-8');
    const formData = JSON.parse(fileData);

    // Проверяем, существует ли элемент с указанным индексом
    if (index < 0 || index >= formData.length) {
      return res.status(404).json({ error: 'Элемент с указанным индексом не найден' });
    }

    // Удаляем элемент из массива по индексу
    formData.splice(index, 1);

    // Записываем обновленные данные в файл
    fs.writeFileSync(formFilePath, JSON.stringify(formData, null, 2));

    res.json({ message: 'Элемент успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении элемента из формы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
