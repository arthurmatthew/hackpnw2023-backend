import { config } from "dotenv";
import { ChatGPTAPI } from "chatgpt";

config();

async function example() {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const res = await api.sendMessage("Hello World!");
  console.log(res.text);
}
