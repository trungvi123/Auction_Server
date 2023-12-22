import { statisticModel } from "../model/statisticModel.js"
import fetch from "node-fetch";
import { uiModel } from "../model/uiModel.js";
import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import { contactModel } from "../model/contactModel.js";
import configMail from "../utils/configMail.js";
import exceljs from 'exceljs'
import { profitModel } from "../model/profitModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createStatistic = async (req, res) => {
    try {
        const { year } = req.body

        const check = await statisticModel.findOne({ year })
        if (check) {
            return res.status(400).json({ status: 'failure', msg: "Đã tồn tại thống kê của năm này!" })
        }

        const temp = new statisticModel({
            year
        })
        const data = await temp.save()
        if (!data) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success' })
    } catch (error) {
        return res.status(500)
    }
}

const deleteStatistic = async (req, res) => {
    try {
        const year = req.params.year

        const check = await statisticModel.findOneAndDelete({ year })
        if (!check) {
            return res.status(400).json({ status: 'failure', msg: `Xóa thống kê năm ${year} thất bại!` })
        }
        return res.status(200).json({ status: 'success' })
    } catch (error) {
        return res.status(500)
    }
}
const createTemplate = async (req, res) => {
    try {
        const { address, color_primary, color_secondary, email, long_intro, mst, phoneNumber, short_intro, configName } = req.body
        const ui = await uiModel.findOne({ configName: configName })
        if (ui) {
            return res.status(400).json({ status: 'failure', msg: `Template already!` })
        }

        const temp = new uiModel({
            address,
            isActive: false,
            colors: {
                color_primary,
                color_secondary,
            },
            email,
            images: {
                img_logo: '',
                img_mini_logo: '',
                img_intro_homePage: '',
                img_breadcrum: ''
            },
            long_intro,
            mst,
            phoneNumber,
            short_intro,
            configName: configName
        })

        await temp.save()
        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)

    }
}

const updateTemplate = async (req, res) => {
    try {
        const { id, address, color_primary, color_secondary, email, long_intro, mst, phoneNumber, short_intro, nameCongfig, } = req.body
        const ui = await uiModel.findById(id)
        if (!ui) {
            return res.status(400).json({ status: 'failure', msg: `UI NOT FOUND` })
        }

        ui.address = address
        ui.colors = {
            color_primary,
            color_secondary
        }
        ui.email = email
        ui.long_intro = long_intro
        ui.mst = mst
        ui.phoneNumber = phoneNumber
        ui.short_intro = short_intro
        ui.nameCongfig = nameCongfig
        await ui.save()
        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)
    }
}

const deleteImageTemplate = async (deleteImg) => {
    try {
        if (deleteImg !== '') {
            const folderPath = path.join(__dirname, '../public', 'ui/uploads'); // Đường dẫn đến thư mục chứa tệp ảnh

            let fileName = deleteImg.replace(`${process.env.BASE_URL}/ui/uploads/`, '');
            let filePath = path.join(folderPath, fileName);
            await fs.unlink(filePath, (err) => {
                throw err
            });
        }
        return true
    } catch (error) {
        return false
    }
}

const updateImgTemplate = async (req, res) => {
    try {
        const { type, id } = req.body
        const ui = await uiModel.findById(id)

        if (!ui) {
            return res.status(400).json({ status: 'failure', msg: `UI NOT FOUND` })
        }
        const image = `${process.env.BASE_URL}/ui/uploads/${req.file.filename}`

        if (type === 'img_intro_homePage') {
            const check = await deleteImageTemplate(ui.images[0].img_intro_homePage)
            if (!check) {
                return res.status(400).json({ status: 'failure' })
            }
            ui.images[0].img_intro_homePage = image
        } else if (type === 'img_logo') {
            const check = await deleteImageTemplate(ui.images[0].img_logo)
            if (!check) {
                return res.status(400).json({ status: 'failure' })
            }
            ui.images[0].img_logo = image
        } else if (type === 'img_mini_logo') {
            const check = await deleteImageTemplate(ui.images[0].img_mini_logo)
            if (!check) {
                return res.status(400).json({ status: 'failure' })
            }
            ui.images[0].img_mini_logo = image
        } else {
            const check = await deleteImageTemplate(ui.images[0].img_breadcrum)
            if (!check) {
                return res.status(400).json({ status: 'failure' })
            }
            ui.images[0].img_breadcrum = image
        }

        await ui.save()
        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)
    }
}

const activeTemplate = async (req, res) => {
    try {
        const id = req.params.id
        const ui = await uiModel.findById(id)
        if (!ui) {
            return res.status(400).json({ status: 'failure', msg: `UI NOT FOUND` })
        }

        await uiModel.findOneAndUpdate({ isActive: true }, { isActive: false }, { new: true })
        ui.isActive = true
        await ui.save()
        return res.status(200).json({ status: 'success' })

    } catch (error) {
        return res.status(500)

    }
}

const deleteTemplate = async (req, res) => {
    try {
        const id = req.params.id
        const check = await uiModel.findOne({ isActive: true })
        if (!check) {
            return res.status(400).json({ status: 'failurea' })
        }

        if (check._id.toString() === id) {
            return res.status(400).json({ status: 'failurex' })
        }

        const ui = await uiModel.findByIdAndDelete(id)
        if (!ui) {
            return res.status(400).json({ status: 'failure', msg: `Delete failure` })
        }

        await deleteImageTemplate(ui.images[0].img_logo)
        await deleteImageTemplate(ui.images[0].img_mini_logo)
        await deleteImageTemplate(ui.images[0].img_intro_homePage)
        await deleteImageTemplate(ui.images[0].img_breadcrum)

        return res.status(200).json({ status: 'success' })


    } catch (error) {
        return res.status(500)
    }
}

const getTemplates = async (req, res) => {
    try {
        const ui = await uiModel.find()
        if (!ui) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: ui })
    } catch (error) {
        return res.status(500)
    }
}

const getTemplateActive = async (req, res) => {
    try {
        const ui = await uiModel.findOne({ isActive: true })
        if (!ui) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: ui })
    } catch (error) {
        return res.status(500)
    }
}

const getAllStatistic = async (req, res) => {
    try {
        const statistic = await statisticModel.find()

        if (!statistic) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: statistic })
    } catch (error) {
        return res.status(500)
    }
}

const postDataMonth = async (req, res) => {
    try {
        const id = req.params.id
        const statistic = await statisticModel.findById(id)
        statistic.months = [
            {
                month: '1',
                userCountInMonth: 3,
                newsCountInMonth: 2,
                auctionCountInMonth: 4,
                freeProductCountInMonth: 3
            },
            {
                month: '2',
                userCountInMonth: 4,
                newsCountInMonth: 6,
                auctionCountInMonth: 6,
                freeProductCountInMonth: 3
            },
            {
                month: '3',
                userCountInMonth: 4,
                newsCountInMonth: 6,
                auctionCountInMonth: 6,
                freeProductCountInMonth: 2
            }, {
                month: '4',
                userCountInMonth: 5,
                newsCountInMonth: 7,
                auctionCountInMonth: 12,
                freeProductCountInMonth: 4
            }, {
                month: '5',
                userCountInMonth: 2,
                newsCountInMonth: 1,
                auctionCountInMonth: 7,
                freeProductCountInMonth: 6
            }, {
                month: '6',
                userCountInMonth: 8,
                newsCountInMonth: 9,
                auctionCountInMonth: 6,
                freeProductCountInMonth: 5
            }, {
                month: '7',
                userCountInMonth: 8,
                newsCountInMonth: 9,
                auctionCountInMonth: 6,
                freeProductCountInMonth: 7
            }, {
                month: '8',
                userCountInMonth: 7,
                newsCountInMonth: 6,
                auctionCountInMonth: 7,
                freeProductCountInMonth: 6
            }, {
                month: '9',
                userCountInMonth: 3,
                newsCountInMonth: 3,
                auctionCountInMonth: 4,
                freeProductCountInMonth: 2
            }, {
                month: '10',
                userCountInMonth: 2,
                newsCountInMonth: 2,
                auctionCountInMonth: 3,
                freeProductCountInMonth: 1
            }, {
                month: '11',
                userCountInMonth: 6,
                newsCountInMonth: 7,
                auctionCountInMonth: 4,
                freeProductCountInMonth: 2
            },

        ]
        await statistic.save()
        return res.status(200).json({ status: 'success', data: statistic })

    } catch (error) {

    }
}

const getStatisticByYear = async (req, res) => {
    try {
        const year = req.params.year

        const statistic = await statisticModel.findOne({ year })
        if (!statistic) {
            return res.status(400).json({ status: 'failure' })
        }
        return res.status(200).json({ status: 'success', data: statistic })
    } catch (error) {
        return res.status(500)
    }
}


const payouts = async (emailPaypal, value, productId, productName) => {
    try {
        const authUrl = "https://api-m.sandbox.paypal.com/v1/oauth2/token";
        const clientIdAndSecret = `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`;
        const base64 = Buffer.from(clientIdAndSecret).toString('base64')


        return fetch(authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Language': 'en_US',
                'Authorization': `Basic ${base64}`,
            },
            body: 'grant_type=client_credentials'
        }).then(function (response) {
            return response.json();
        }).then(function (data) {

            return fetch('https://api-m.sandbox.paypal.com/v1/payments/payouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.access_token}`
                },
                body: JSON.stringify(
                    {
                        "sender_batch_header":
                        {
                            "sender_batch_id": productId,
                            "email_subject": "Thanh toán từ CIT AUCTION",
                            "email_message": `Chúng tôi vừa thanh toán cho bạn sản phẩm có tên ${productName}!`
                        },
                        "items": [{
                            "recipient_type": "EMAIL",
                            "amount": { "value": value, "currency": "USD" },
                            "note": `Chúng tôi vừa thanh toán cho bạn sản phẩm có tên ${productName}!`,
                            "sender_item_id": "201403140001",
                            "receiver": emailPaypal,
                        }]
                    })
            }).then(function (response) {
                return response.json();
            }).then(function (data) {
                return data
            }).catch(function () {
                console.log("error something!");
            });

        }).catch(function () {
            console.log("couldn't get auth token");
        });




    } catch (error) {
        return false
    }
}

const getNewContact = async (req, res) => {
    try {
        const data = await contactModel.find({ reply: false })

        return res.status(200).json({ status: 'success', data })

    } catch (error) {
        return res.status(500)
    }
}

const getContactReply = async (req, res) => {
    try {
        const data = await contactModel.find({ reply: true })

        return res.status(200).json({ status: 'success', data })

    } catch (error) {
        return res.status(500)
    }
}

const replyContact = async (req, res) => {
    try {
        const id = req.params.id
        const { subject, email, html } = req.body
        const contact = await contactModel.findById(id)
        if (!contact) {
            return res.status(400).json({ status: 'failure' })
        }

        const { transporter, mailOption } = configMail(email, subject, '', html)
        transporter.sendMail(mailOption, (err) => {
            if (err) {
                console.log(err);
                res.status(500).json({ status: 'failure', message: "Gửi mail thất bại!" });
            } else {
                res.status(200).json({ status: 'success', message: "success" });
            }
        });


    } catch (error) {
        return res.status(500)
    }
}
const handleExport = async (req, res) => {
    try {
        const { year, type } = req.params
        let productTemp = {};
        let freeProductTemp = {};
        let userTemp = {};
        let newsTemp = {};
        const statistic = await statisticModel.findOne({ year })
        if (!statistic) {
            return res.status(400).json({ status: 'failure' })
        }

        for (let i = 1; i <= 12; i++) {
            const check = statistic.months?.find(
                (item) => item.month === i.toString()
            );
            if (type === 'product') {
                productTemp[`thang${i}`] = check ? check.auctionCountInMonth : 0
            } else if (type === 'freeProduct') {
                freeProductTemp[`thang${i}`] = check ? check.freeProductCountInMonth : 0
            } else if (type === 'user') {
                userTemp[`thang${i}`] = check ? check.userCountInMonth : 0
            } else {
                newsTemp[`thang${i}`] = check ? check.newsCountInMonth : 0
            }
        }

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Thống kê');
        let worksheetColumns = []
        let i = 1
        if (type === 'product') {
            for (const keydata in productTemp) {
                worksheetColumns.push({
                    header: `Tháng ${i}`, key: keydata, width: 15
                })
                i++
            }
        } else if (type === 'freeProduct') {
            for (const keydata in freeProductTemp) {
                worksheetColumns.push({
                    header: `Tháng ${i}`, key: keydata, width: 15
                })
                i++
            }
        } else if (type === 'user') {
            for (const keydata in userTemp) {
                worksheetColumns.push({
                    header: `Tháng ${i}`, key: keydata, width: 15
                })
                i++
            }
        } else {
            for (const keydata in newsTemp) {
                worksheetColumns.push({
                    header: `Tháng ${i}`, key: keydata, width: 15
                })
                i++
            }
        }

        worksheet.columns = worksheetColumns
        if (type === 'product') {
            worksheet.addRow(productTemp)
        } else if (type === 'freeProduct') {
            worksheet.addRow(freeProductTemp)
        } else if (type === 'user') {
            worksheet.addRow(userTemp)
        } else {
            worksheet.addRow(newsTemp)
        }
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=" + `${type}.xlsx`);
        workbook.xlsx.write(res).then(() => res.end());
    } catch (error) {
        return res.status(500)

    }
};

const handleExportProfit = async (req, res) => {
    try {
        const { year } = req.params

        const result = await profitModel.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${year + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    totalProfit: { $sum: "$profit" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        let profitTmp = {};
        let worksheetColumns = []
        for (let i = 1; i <= 12; i++) {
            const check = result?.find(
                (item) => item._id.month.toString() === i.toString()
            );
            profitTmp[`thang${i}`] = check ? check.totalProfit : 0
        }
        let i = 1
        for (const keydata in profitTmp) {
            worksheetColumns.push({
                header: `Tháng ${i}`, key: keydata, width: 15
            })
            i++
        }
        // console.log(worksheetColumns);
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Thống kê');

        worksheet.columns = worksheetColumns
        worksheet.addRow(profitTmp)

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=" + `profit.xlsx`);
        workbook.xlsx.write(res).then(() => res.end());
    } catch (error) {
        return res.status(500)

    }
};

const getProfitByYear = async (req, res) => {
    const year = req.params.year; // Năm được truyền vào từ request

    try {
        // Tạo một đối tượng Date để sử dụng trong truy vấn
        const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

        // Truy vấn MongoDB để lấy lợi nhuận trong khoảng thời gian từ startDate đến endDate
        const profits = await profitModel.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Tạo một đối tượng để lưu trữ lợi nhuận theo tháng và ngày
        const monthlyProfits = {};

        // Tạo một đối tượng để lưu trữ tổng lợi nhuận của từng tháng
        const totalProfits = {};

        // Lặp qua tất cả các tháng trong năm
        for (let month = 1; month <= 12; month++) {
            // Tìm số ngày thực tế trong tháng
            const daysInMonth = new Date(year, month, 0).getDate();

            // Tạo một đối tượng để lưu trữ lợi nhuận theo ngày trong tháng
            const dailyProfits = {};

            // Tổng lợi nhuận của tháng
            let monthlyTotalProfit = 0;

            // Lặp qua tất cả các ngày trong tháng
            for (let day = 1; day <= daysInMonth; day++) {
                dailyProfits[day] = 0; // Mặc định giá trị là 0

                // Tìm lợi nhuận cho ngày cụ thể trong tháng
                profits.forEach((profit) => {
                    const profitMonth = profit.createdAt.getMonth() + 1;
                    const profitDay = profit.createdAt.getDate();

                    if (profitMonth === month && profitDay === day) {
                        dailyProfits[day] += profit.profit;
                        monthlyTotalProfit += profit.profit;
                    }
                });
            }

            monthlyProfits[month] = {
                dailyProfits,
                monthlyTotalProfit,
            };

            totalProfits[month] = monthlyTotalProfit;
        }


        // Trả về kết quả
        return res.status(200).json({ year, monthlyProfits });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export { createStatistic, handleExportProfit, getProfitByYear, postDataMonth, handleExport, getNewContact, replyContact, getContactReply, getTemplateActive, activeTemplate, deleteTemplate, updateImgTemplate, updateTemplate, deleteStatistic, deleteImageTemplate, getAllStatistic, getStatisticByYear, payouts, createTemplate, getTemplates }