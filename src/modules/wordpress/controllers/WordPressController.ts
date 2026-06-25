import { Request, Response } from "express";
import { WordPressService } from "../services/WordPressService";

export class WordPressController {
  private wordpressService: WordPressService;

  constructor() {
    this.wordpressService = new WordPressService();
  }

  /**
   * @openapi
   * /v1/wordpress/import-json:
   *   post:
   *     tags: [WordPress]
   *     summary: Importar datos desde JSON de WordPress
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               jsonFile:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Importación completada
   */
  async importJson(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ status: "error", errorMessage: "No file provided" });
      }

      const fs = require('fs');
      const fileContent = fs.readFileSync(file.path, 'utf8');
      const jsonData = JSON.parse(fileContent);

      fs.unlinkSync(file.path);

      const result = await this.wordpressService.importFromJson(jsonData);
      return res.status(200).json({ status: "success", data: result });
    } catch (error: any) {
      return res.status(500).json({ status: "error", errorMessage: error.message });
    }
  }

  /**
   * @openapi
   * /v1/wordpress/stats:
   *   get:
   *     tags: [WordPress]
   *     summary: Obtener estadísticas de importación WordPress
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas de importación
   */
  async stats(req: Request, res: Response) {
    try {
      const result = await this.wordpressService.stats();
      return res.status(200).json({ status: "success", data: result });
    } catch (error: any) {
      return res.status(500).json({ status: "error", errorMessage: error.message });
    }
  }
}
