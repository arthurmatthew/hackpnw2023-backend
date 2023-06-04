import { config } from "dotenv";
config(); // Config Dotenv
import { ChatGPTAPI } from "chatgpt";
import express from "express";
import cors from "cors";
import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";
import fileUpload from "express-fileupload";

const stub = ClarifaiStub.grpc();

const metadata = new grpc.Metadata();
metadata.set("authorization", `Key ${process.env.CLARIFAI_API_KEY}`);

// Start Express App

const app = express();
app.use(cors());
app.use(fileUpload());

const predictImage = (inputs) => {
  return new Promise((resolve, reject) => {
    stub.PostModelOutputs(
      {
        // This is the model ID of a publicly available General model. You may use any other public or custom model ID.
        model_id: "aaa03c23b3724a16a56b629203edc62c",
        inputs: inputs,
      },
      metadata,
      (err, response) => {
        if (err) {
          reject("Error: " + err);
          return;
        }

        if (response.status.code !== 10000) {
          reject(
            "Received failed status: " +
              response.status.description +
              "\n" +
              response.status.details
          );
          return;
        }

        let results = [];
        for (const c of response.outputs[0].data.concepts) {
          results.push({
            name: c.name,
            value: c.value,
          });
        }
        resolve(results);
      }
    );
  });
};

// Interact with ChatGPT API
const getInfo = async (object) => {
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
};

app.post("/image", async (req, res) => {
  console.log("Recieved a /image request.");
  console.log(req.files.file);
  if (req.files.file != null) {
    const image = req.files.file;
    const results = await predictImage([
      { data: { image: { base64: image.data } } },
    ]);
    const objectName = results[0].name;
    console.log("Clarifai thinks this is a: " + objectName);
    await getInfo(objectName).then((x) => res.send(x.text));
  }
});

// Object Route, name of object goes in, details go out
app.get("/object", async (req, res) => {
  console.log("Recieved an /object request");
  const objectName = req.query.object;
  await getInfo(objectName).then((x) => res.send(x.text));
  console.log("Send the info back.");
});

// Test Route, send back test data
app.get("/test", async (req, res) => {
  console.log("Recieved a /test request");
  res.send(`{
    "safety": 6,
    "status": "Lorem Ipsum",
    "description":
      " AKLJSd ljaklsjdl jalskjd JLASjdl jlaksjdlj aksdjkl JKLasjdljksdjl sjdkjalsjdl akjlsdjLJaskldj lajsdl jlJSld jljl"
  }`);
  console.log("Sent the test info back.");
});

// Start Express server
app.listen(3000, () => {
  console.log("App listening");
});
