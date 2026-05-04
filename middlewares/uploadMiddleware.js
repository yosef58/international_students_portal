import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';


// ✅ Validate env vars at startup
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
requiredEnvVars.forEach(v => {
  if (!process.env[v]) throw new Error(`Missing env variable: ${v}`);
});

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

export const uploadDocument = multer({
  storage: createStorage('documents'),  // ✅ using createStorage
  fileFilter: documentFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

export const uploadServiceImage = multer({
  storage: createStorage('services'),   // ✅ using createStorage
  fileFilter: imageFilter,
  limits: { fileSize: 6 * 1024 * 1024 }
});

export const uploadAvatar = multer({
  storage: createStorage('avatars'),    // ✅ using createStorage
  fileFilter: imageFilter,
  limits: { fileSize: 6 * 1024 * 1024 }
});