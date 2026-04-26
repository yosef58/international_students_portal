import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ Helper to create Cloudinary storage per folder
const createCloudinaryStorage = (folder, resourceType = 'auto') =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `uploads/${folder}`,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf']
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
  storage: createCloudinaryStorage('documents'),
  fileFilter: documentFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

// uploads/services — for service cover images
export const uploadServiceImage = multer({
  storage: createCloudinaryStorage('services'),
  fileFilter: imageFilter,
  limits: { fileSize: 6 * 1024 * 1024 }
});

// uploads/avatars — for user profile pictures
export const uploadAvatar = multer({
  storage: createCloudinaryStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 6 * 1024 * 1024 }
});