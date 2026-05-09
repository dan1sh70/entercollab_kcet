import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'entercollab/profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  } as any,
});

export const projectStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'entercollab/projects',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  } as any,
});

export const researchStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'entercollab/research',
    allowed_formats: ['pdf', 'jpg', 'png', 'jpeg', 'webp'],
    resource_type: 'auto',
  } as any,
});

export const eventStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'entercollab/events',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  } as any,
});

export default cloudinary;
