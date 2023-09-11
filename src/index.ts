import { Router, Request, Response } from "express";
import { chain, MetadataTransformer } from "./data";

// Configures an express.js app with Metadata Transformer endpoints.
// Uses the given status handler and transformers.
// This mutates the app that it is passed, which is why it has no return.
export default function configure(
  app: Router,
  currentStatus: () => Promise<object>,
  ...transformers: MetadataTransformer[]
) {
  if (transformers.length === 0) {
    throw new Error("No transformers provided.");
  }

  const raw = transformers[0];
  const cumulativeTransform = chain(...transformers);

  app.get("/status", async (_: Request, res: Response) => {
    try {
      const status = await currentStatus();
      return res.status(200).json(status);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e });
    }
  });

  app.get(
    "/raw/:contractAddress/:tokenID",
    async (req: Request, res: Response) => {
      try {
        const contractAddress = req.params.contractAddress;
        const tokenID = req.params.tokenID;
        const metadata = await raw(contractAddress, tokenID);
        return res.status(200).json(metadata);
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e });
      }
    }
  );

  app.get(
    "/transformed/:contractAddress/:tokenID",
    async (req: Request, res: Response) => {
      try {
        const contractAddress = req.params.contractAddress;
        const tokenID = req.params.tokenID;
        const metadata = await cumulativeTransform(contractAddress, tokenID);
        return res.status(200).json(metadata);
      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e });
      }
    }
  );
}
