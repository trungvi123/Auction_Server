import nodemailer from "nodemailer";

const configMail = (email, subject, text='', html) => {
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "jemcovintage@gmail.com", // generated ethereal user
                pass: "dqouvtafluvasxpt", // generated ethereal password
            },
        });

        const mailOption = {
            from: `jemcovintage@gmail.com`, // sender address
            to: `${email}`, // list of receivers
            subject: subject, // Subject line
            text: `${text}`, // plain text body
            html: html
        };

        return {transporter , mailOption}
    } catch (error) {
        return 'failure'

    }

}

export default configMail