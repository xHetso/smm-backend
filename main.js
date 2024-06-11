import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import PostService from './post.service.js';
import TelegramService from './telegram.service.js';
import VisionService from './post-view-img.service.js';

const app = express();
const port = 3000;

// Создание директории uploads, если она не существует
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Настройка хранилища для файлов с помощью multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Папка, куда будут сохраняться файлы
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Имя файла будет текущая дата и время + расширение файла
  }
});

// Multer для сохранения файлов на диск
const uploadToDisk = multer({ storage: storage });

// Multer для обработки файлов без сохранения их на диск
const uploadMemory = multer();

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

const postService = new PostService();
const visionService = new VisionService();

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
    console.log('result post: ' + result);
    res.json(result); // Отправка результата в формате JSON
  } catch (error) {
    console.error('Ошибка при обработке поста:', error);
    res.status(500).json({ error: 'Ошибка сервера' }); // Отправка ошибки в формате JSON
  }
});

// Новый маршрут для обработки загрузки файлов
app.post('/submit-post-view-img', uploadToDisk.single('file'), async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;

    if (!title || !file) {
      return res.status(400).json({ message: 'Title and file are required' });
    }

    console.log('Title:', title);
    console.log('File:', file);

    const resultImage = (await visionService.processImage(file.path, title, file.mimetype));
    console.log('11111111111111'+resultImage.message);
    const result = await postService.processPost("На картинки изображена:" + resultImage.message + ".Придумай пост для этой картинки, напиши об этой картинке текст" );
    console.log('result: ' + JSON.stringify(result, null, 2));

    res.json(result);
  } catch (error) {
    console.error('Ошибка при загрузке файла:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/send-to-telegram', uploadMemory.single('photo'), async (req, res) => {
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
