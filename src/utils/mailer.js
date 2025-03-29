const nodemailer = require("nodemailer");

class Mailer {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail", host: "smtp.gmail.com", port: 587, secure: false, auth: {
                user: process.env.MAILER_MAIL, pass: process.env.MAILER_SECRET,
            },
        });
        this.sendMail = this.sendMail.bind(this);
    }

    async sendMail(to, subject, body) {
        return await this.transporter.sendMail({
            from: {name: process.env.MAILER_NAME, address: process.env.MAILER_MAIL}, // sender address
            to, // list of receivers
            subject: subject, // Subject line
            ...body
        })
    }
}

module.exports = new Mailer();