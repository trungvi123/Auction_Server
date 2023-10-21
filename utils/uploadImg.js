import multer from 'multer'


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/ui/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const isImage = (req, file, callback) => {
    if (file.mimetype.startsWith('image')) {
        callback(null, true)
    } else {
        callback(new Error('Only image is allowed..'))
    }
}

const upload = multer({
    storage: storage,
    fileFilter: isImage,
});

const AdminUpload = multer({
    storage: storage2,
    fileFilter: isImage,
});

export default upload
export { AdminUpload }