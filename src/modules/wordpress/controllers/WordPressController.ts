import { Request, Response } from "express";
import { WordPressService } from "../services/WordPressService";

export class WordPressController {
  private wordpressService: WordPressService;

  constructor() {
    this.wordpressService = new WordPressService();
  }

  async importJson(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ status: "error", errorMessage: "No file provided" });
      }

      // Read file content
      const fs = require('fs');
      const fileContent = fs.readFileSync(file.path, 'utf8');
      const jsonData = JSON.parse(fileContent);

      // Delete temp file after reading
      fs.unlinkSync(file.path);

      const result = await this.wordpressService.importFromJson(jsonData);
      return res.status(200).json({ status: "success", data: result });
    } catch (error: any) {
      return res.status(500).json({ status: "error", errorMessage: error.message });
    }
  }

  //stats
  async stats(req: Request, res: Response) {
    try {
      const result = await this.wordpressService.stats();
      return res.status(200).json({ status: "success", data: result });
    } catch (error: any) {
      return res.status(500).json({ status: "error", errorMessage: error.message });
    }
  }
}
