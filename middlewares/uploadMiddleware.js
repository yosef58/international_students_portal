import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

const getCloudinary = () => {
 cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  return cloudinary;
};


const createImageStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `uploads/${folder}`,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `${folder}-${Date.now()}`
    })
  });

  const createDocumentStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `uploads/${folder}`,
      resource_type: 'raw',
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      public_id: `${folder}-${Date.now()}`
    })
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

// ✅ New — use the correct function per type
export const uploadDocument = multer({
  storage: createDocumentStorage('documents'),  // PDFs + images → resource_type: 'raw'
  fileFilter: documentFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

export const uploadServiceImage = multer({
  storage: createImageStorage('services'),      // images only → resource_type: 'image'
  fileFilter: imageFilter,
  limits: { fileSize: 6 * 1024 * 1024 }
});

export const uploadAvatar = multer({
  storage: createImageStorage('avatars'),       // images only → resource_type: 'image'
  fileFilter: imageFilter,
  limits: { fileSize: 6 * 1024 * 1024 }
});