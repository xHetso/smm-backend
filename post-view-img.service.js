import dotenv from "dotenv";
import * as fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType,
        },
    };
}

export default class VisionService {
    async processImage(imagePath, prompt, mimeType) {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

        const imageParts = [
            fileToGenerativePart(imagePath, mimeType), // передаем mimeType
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();
        console.log(text);
        
        // Упаковываем текст в объект
        const responseObj = { message: text };
        
        return responseObj;
    }
}