import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

export default class PostCleanService {
    async processPost(postData) {
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});

        console.log('Получены данные:', postData);
        const promptUser = postData.title;
        const prompt = `${promptUser}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(text);
        
        // Упаковываем текст в объект
        const responseObj = { message: text };
        
        return responseObj;
    }
}
