import { diskStorage } from 'multer';

export const multerConfig = {
    storage: diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = './uploads/user/'; // Destination folder for user

            cb(null, uploadPath);
        },
    }),
    fileFilter: (req, file, cb) => {
        // Accept image files only
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
};
