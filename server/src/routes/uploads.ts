import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { env } from "../env.js";
import { requireAuth } from "../auth/middleware.js";
import { HttpError } from "../lib/http.js";

const uploadDir = path.resolve(env.uploadsDir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 МБ
  fileFilter: (_req, file, cb) => {
    const ok = /^(image\/|application\/pdf|video\/)/.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new HttpError(400, "Недопустимый тип файла"));
  },
});

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

// Загрузка файла (фото/видео/PDF) -> { url }
uploadsRouter.post("/", upload.single("file"), (req, res) => {
  if (!req.file) throw new HttpError(400, "Файл не передан");
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});
