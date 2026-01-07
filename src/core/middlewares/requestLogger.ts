import { NextFunction, Request, Response } from "express";

function requestLogger(req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp} Method ${req.method} ${req.url} - IP: ${req.ip}]`);
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] Response: Status Code ${res.statusCode} - ${duration}ms\n`);
  });
  next();
}

export { requestLogger };
