import { newsModel } from "../model/newsModel.js"
import { userModel } from "../model/userModel.js";

import path, { dirname } from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url';
import { statisticModel } from "../model/statisticModel.js";
import normalizeWord from "../utils/normalizeWord.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getNewsById = async (req, res) => {
    try {
        const id = req.params.id
        const data = await newsModel.findOne({
            _id: id, hide: false
        }).populate('owner').lean()

        if (!data) {
            return res.status(400).json({ status: 'failure', msg: 'Not found' })
        }

        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}
const getNewsByEmail = async (req, res) => {
    try {
        const email = req.params.email

        const user = await userModel.findOne({ email }).lean()
        if (!user) {
            return res.status(400).json({ status: 'failure', msg: 'User Not found' })
        }
        const data = await newsModel.find({
            owner: user._id, hide: false, isApprove: 1
        }).populate('owner').lean()

        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}


const getNews = async (req, res) => {
    try {
        const data = await newsModel.find({ hide: false, isApprove: 1 }).populate('owner').lean()
        setTimeout(() => {
            return res.status(200).json({ status: 'success', data })
        }, 1500)


    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const getReApproveNews = async (req, res) => {
    try {
        const data = await newsModel.find({ hide: false, reApprove: true }).lean()

        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const getHideNews = async (req, res) => {
    try {
        const dataFromToken = req.dataFromToken
        const data = await newsModel.find({ owner: dataFromToken._id, hide: true }).lean()

        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}


const getMyNews = async (req, res) => {
    try {
        const dataFromToken = req.dataFromToken
        const dataTmp = await newsModel.find({ owner: dataFromToken._id, hide: false }).lean()
        const data = dataTmp.filter((item) => item.isApprove >= 0)
        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const getRefuseNews = async (req, res) => {
    try {
        const dataFromToken = req.dataFromToken
        const data = await newsModel.find({ owner: dataFromToken._id, hide: false, isApprove: -1 }).lean()

        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const getNewsByStatus_admin = async (req, res) => {
    try {
        const type = req.params.type
        let variant = 0
        if (type === 'approve') {
            variant = 1
        } else if (type === 'refuse') {
            variant = -1
        }
        const data = await newsModel.find({ isApprove: variant }).lean()

        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}


const createNews = async (req, res) => {
    try {
        const { title, content, description } = req.body
        const dataFromToken = req.dataFromToken
        let img = ''
        if (req.file) {
            img = `${process.env.BASE_URL}/news/${req.file.filename}`
        } else {
            img = `${process.env.BASE_URL}/default/auction.jpg`
        }
        if (!title || !content || !description) {
            return res.status(400).json({ status: 'failure', msg: 'Vui lòng nhập đầy đủ thông tin!' })
        }

        const news = new newsModel({
            title,
            lazyTitle: normalizeWord(title),
            description,
            content,
            owner: dataFromToken._id,
            img
        })
        if (dataFromToken.role === 'admin') {
            news.newsSystem = true
        }

        const data = await news.save()
        if (!data) {
            return res.status(400).json({ status: 'failure', msg: 'Tạo tin không thành công!' })
        }

        return res.status(201).json({ status: 'success' })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const editNews = async (req, res) => {
    try {
        const { title, content, description, id } = req.body
        const dataFromToken = req.dataFromToken

        const news = await newsModel.findById(id)
        if (!news) {
            return res.status(400).json({ status: 'failure', msg: 'Not found!' })
        }
        if (dataFromToken._id !== news.owner.toString()) {
            return res.status(400).json({ status: 'failure', msg: 'Có lỗi xãy ra!' })
        }
        news.title = title
        news.content = content
        news.description = description
        if (req.file) {
            await deleteImg(news.img, 'news')
            news.img = `${process.env.BASE_URL}/news/${req.file.filename}`
        }
        const data = await news.save()
        if (!data) {
            return res.status(400).json({ status: 'failure', msg: 'Có lỗi xãy ra!' })
        }
        return res.status(200).json({ status: 'success', data })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}


const hideNews = async (req, res) => {
    try {
        const { id } = req.body
        const news = await newsModel.findById(id)
        const dataFromToken = req.dataFromToken

        if (!news) {
            return res.status(400).json({ status: 'failure', msg: 'Not found!' })
        }
        if (dataFromToken._id !== news.owner.toString()) {
            return res.status(400).json({ status: 'failure', msg: 'Có lỗi xãy ra!' })
        }

        news.hide = true
        await news.save()

        return res.status(200).json({ status: 'success' })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const handleApproveNews = async (req, res) => {
    try {
        const { id, type } = req.body
        const news = await newsModel.findById(id)

        if (!news) {
            return res.status(400).json({ status: 'failure', msg: 'Not found!' })
        }
        if (type === 'approve') {
            news.isApprove = 1

            const currentTime = new Date(news.createdAt)
            const currentYear = currentTime.getFullYear()
            const currentMonth = currentTime.getMonth() + 1

            const statisticByYear = await statisticModel.findOne({ year: currentYear })

            if (statisticByYear) {
                statisticByYear.newsCount += 1

                let checkMonth = statisticByYear.months.find((item) => item.month.toString() === currentMonth.toString())

                if (checkMonth) {
                    // Nếu đã có thống kê cho tháng đó, tăng userCountInMonth trong tháng
                    checkMonth.newsCountInMonth += 1;
                } else {
                    // Nếu chưa có thống kê cho tháng đó, tạo một thống kê mới
                    statisticByYear.months.push({
                        month: currentMonth,
                        newsCountInMonth: 1
                    });
                }

                await statisticByYear.save()
            }
        } else {
            news.isApprove = -1
        }
        news.reApprove = false

        await news.save()

        return res.status(200).json({ status: 'success' })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const deleteNews = async (req, res) => {
    try {
        const { id } = req.params
        const dataFromToken = req.dataFromToken
        const newsCheck = await newsModel.findById(id)
        if (!newsCheck) {
            return res.status(400).json({ status: 'failure', msg: 'Not found!' })
        }

        if (dataFromToken.role === 'admin' || dataFromToken._id.toString() === newsCheck.owner.toString()) {
            await newsModel.findByIdAndDelete(id)
            return res.status(200).json({ status: 'success' })
        }
        return res.status(400).json({ status: 'failure', msg: 'Not Permission!' })

    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}


const reApprove = async (req, res) => {
    try {
        const { id } = req.body
        const news = await newsModel.findById(id)
        const dataFromToken = req.dataFromToken

        if (!news) {
            return res.status(400).json({ status: 'failure', msg: 'Not found!' })
        }
        if (dataFromToken._id !== news.owner.toString()) {
            return res.status(400).json({ status: 'failure', msg: 'Có lỗi xãy ra!' })
        }

        news.reApprove = true
        await news.save()

        return res.status(200).json({ status: 'success' })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const showNews = async (req, res) => {
    try {
        const { id } = req.body
        const news = await newsModel.findById(id)
        const dataFromToken = req.dataFromToken

        if (!news) {
            return res.status(400).json({ status: 'failure', msg: 'Not found!' })
        }
        if (dataFromToken._id !== news.owner.toString()) {
            return res.status(400).json({ status: 'failure', msg: 'Có lỗi xãy ra!' })
        }

        news.hide = false
        await news.save()

        return res.status(200).json({ status: 'success' })
    } catch (error) {
        return res.status(500).json({ status: 'failure' })
    }
}

const deleteImg = async (img, type) => {
    try {
        // tim va xoa cac anh cu
        const folderPath = path.join(__dirname, '../public', type); // Đường dẫn đến thư mục chứa tệp ảnh

        let fileName = img.replace(`${process.env.BASE_URL}/${type}/`, '');
        let filePath = path.join(folderPath, fileName);

        await fs.unlink(filePath);

        return true
    } catch (error) {
        return false
    }
}

export { createNews, hideNews, deleteImg, getNewsByEmail, getReApproveNews, getNewsByStatus_admin, handleApproveNews, deleteNews, getHideNews, reApprove, showNews, editNews, getNews, getNewsById, getMyNews, getRefuseNews }