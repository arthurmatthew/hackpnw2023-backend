import { config } from "dotenv";
import { ChatGPTAPI } from "chatgpt";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

config();

app.get("/object", async (req, res) => {
  console.log("Request Recieved");
  const objectName = req.query.object;
  await getInfo(objectName).then((x) => res.send(x.text));
  console.log("Object Sent");
});

app.listen(3000, () => {
  console.log("App listening");
});

async function getInfo(object) {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const res = await api.sendMessage(
    `
Can you answer these three questions about a ${object}:

1. A number from 1-10 with 1 being dangerous and 10 being safest, how safe is the object for the environment on a scale of 1/10
2. which category would you put the object in: trash, recycle, compost, biohazard
3. what is a short 1-2 sentence description on how to safely dispose of the object

using the following format given below, like its a javascript object:

{"safety": 7,
"status": "Recycle",
"description": "Short 1-2 sentence description"}

Try your best. I only want you to answer the questions. Please only answer the way the we request.

`
  );
  return res;
}
