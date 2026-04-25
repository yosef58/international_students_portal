import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Helper: create folder if it doesn't exist
// this part need to update before redeployment
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = `uploads/${folder}`;
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname).toLowerCase());
    }
  });

const documentFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext) ? cb(null, true) : cb(new Error('Documents: PDF, JPG, PNG only'));
};

const imageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext) ? cb(null, true) : cb(new Error('Images: JPG, PNG, WEBP only'));
};

// uploads/documents — for service request attachments
export const uploadDocument = multer({
  storage: createStorage('documents'),
  fileFilter: documentFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// uploads/services — for service cover images
export const uploadServiceImage = multer({
  storage: createStorage('services'),
  fileFilter: imageFilter,
  limits: { fileSize: 6 * 1024 * 1024 } // 6MB
});

// uploads/avatars — for user profile pictures
export const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 6 * 1024 * 1024 } // 6MB
});