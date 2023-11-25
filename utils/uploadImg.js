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

const storage3 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/rate');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const storage4 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/news');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const storage5 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/users');
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

const RateUpload = multer({
    storage: storage3,
    fileFilter: isImage,
});

const NewsUpload = multer({
    storage: storage4,
    fileFilter: isImage,
});

const UserUpload = multer({
    storage: storage5,
    fileFilter: isImage,
});

export default upload
export { AdminUpload }
export { RateUpload }
export { NewsUpload }
export { UserUpload }


