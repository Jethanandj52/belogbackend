const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"My Platform" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        });
        
        console.log("Email sent successfully to:", to);
    } catch (error) {
        console.error("Email Error:", error);
        throw new Error("Email sending failed"); // Ye error controller ko batayega ke email nahi gayi
    }
};

// 🔥 YE LINE SABSE ZAROORI HAI
module.exports = { sendEmail };