import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export default class PostService {
    async processPost(postData) {
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});

        console.log('Получены данные:', postData);
        const promptUser = postData.title;
        const prompt = `Нужен сделать только один креативный пост для телеграмма пиши самым обычным текстом и добавляй смайлики не надо символы переменные тому подобное использовать, вот каким должен быть Post:, ${promptUser}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(text);
        
        // Упаковываем текст в объект
        const responseObj = { message: text };
        
        return responseObj;
    }
}
