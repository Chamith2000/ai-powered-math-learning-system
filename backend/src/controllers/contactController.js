const nodemailer = require('nodemailer');

exports.sendContactEmail = async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Check if required fields exist
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Create a transporter
        // Note: For production, use secure credentials from .env
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'placeholder@gmail.com',
                pass: process.env.EMAIL_PASS || 'placeholder_pass'
            }
        });

        const mailOptions = {
            from: email,
            to: 'mathsbuddy.info@gmail.com',
            subject: `Contact Form Submission: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4F46E5;">New Message from Maths Buddy Website</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        <p><strong>Message:</strong></p>
                        <p>${message}</p>
                    </div>
                </div>
            `
        };

        // If no real credentials, simulate success and log to console
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'placeholder@gmail.com') {
            console.log("--- SIMULATED EMAIL SUBMISSION ---");
            console.log("To:", mailOptions.to);
            console.log("From:", mailOptions.from);
            console.log("Subject:", mailOptions.subject);
            console.log("Message:", message);
            console.log("----------------------------------");
            
            return res.status(200).json({ 
                message: "Message received (Simulation Mode). Please configure EMAIL_USER and EMAIL_PASS in your .env for real emails." 
            });
        }

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully!" });

    } catch (error) {
        console.error("Nodemailer Error:", error);
        res.status(500).json({ message: "Failed to send email. Please try again later." });
    }
};
