import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { env } from "../env.js";
import { requireAuth } from "../auth/middleware.js";
import { HttpError } from "../lib/http.js";

const uploadDir = path.resolve(env.uploadsDir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // crypto-random, а не Date.now()+Math.random(): имя = неугадываемая
    // капабилити-ссылка (файлы отдаются статикой без пофайловой авторизации).
    const ext = path.extname(file.originalname).slice(0, 10).replace(/[^.\w]/g, "");
    cb(null, `${randomUUID()}${ext}`);
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
