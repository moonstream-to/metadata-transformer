// Configures the Metadata Transformer express server and starts the server process

import cors from "cors";
import express, { Request, Response } from "express";

import { PORT } from "./config";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", async (_: Request, res: Response) => {
  const responseBody = { status: "ok" };
  return res.status(200).json(responseBody);
});

app.listen(PORT, () => {
  console.log(`Metadata Transformer running on ${PORT}`);
});

export default app;
