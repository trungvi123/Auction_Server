import { statisticModel } from "../model/statisticModel.js"
import fetch from "node-fetch";
import { uiModel } from "../model/uiModel.js";
import fs from 'fs/promises'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import { contactModel } from "../model/contactModel.js";
import configMail from "../utils/configMail.js";
import exceljs from 'exceljs'

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



export { createStatistic, handleExport, getNewContact, replyContact, getContactReply, getTemplateActive, activeTemplate, deleteTemplate, updateImgTemplate, updateTemplate, deleteStatistic, deleteImageTemplate, getAllStatistic, getStatisticByYear, payouts, createTemplate, getTemplates }