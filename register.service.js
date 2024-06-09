import fs from 'fs/promises';
import path from 'path';

const usersFilePath = path.resolve(__dirname, 'users.json');

// Функция для проверки существования пользователя
export async function checkUserExists(username, password) {
  try {
    const usersData = await fs.readFile(usersFilePath, 'utf8');
    const users = JSON.parse(usersData);
    const existingUser = users.find(user => user.username === username && user.password === password);
    return existingUser !== undefined;
  } catch (error) {
    console.error('Ошибка при чтении файла пользователей:', error);
    throw new Error('Ошибка сервера');
  }
}

// Функция для регистрации нового пользователя
export async function registerUser(username, password) {
  try {
    // Проверяем, существует ли пользователь с такими данными
    const userExists = await checkUserExists(username, password);

    if (!userExists) {
      // Если пользователя с такими данными нет, добавляем его в users.json
      const newUser = { username, password };
      const usersData = await fs.readFile(usersFilePath, 'utf8');
      const users = JSON.parse(usersData);
      users.push(newUser);
      await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
      return { isUser: true };
    } else {
      // Если пользователь уже существует, возвращаем ошибку
      throw new Error('Такой пользователь уже существует');
    }
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    throw new Error('Ошибка сервера');
  }
}
