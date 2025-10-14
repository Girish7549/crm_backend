const nodemailer = require("nodemailer");
const cloudinary = require("../config/cloudinaryConfig");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const https = require("https");
const User = require("../models/User");
const OfferLetter = require("../models/OfferLetter");


// Helper: upload local file to Cloudinary
const uploadFileToCloudinary = async (filePath, folder = "offerLetters/generated") => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: "auto",
        });
        return result.secure_url;
    } catch (err) {
        console.error("Cloudinary Upload Error:", err);
        throw err;
    }
};

// ====== GENERATE & SEND OFFER LETTER PDF ======
const generateOfferLetterOLD = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

        // 1️⃣ Fetch user + company offer info
        const user = await User.findById(userId)
            .populate("department", "name")
            .populate("designation", "name")
            .populate("assignedService", "name");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const offerLetter = await OfferLetter.findOne({ company: user.assignedService });
        if (!offerLetter) return res.status(404).json({ success: false, message: "Offer letter not found for this company" });

        // 2️⃣ Create PDF
        const pdfDir = path.join(__dirname, "../generated");
        if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

        const pdfPath = path.join(pdfDir, `${user.name}_OfferLetter.pdf`);
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // --- Header
        doc.fontSize(18).font("Helvetica-Bold").text("AdzDrio India Services Pvt. Ltd", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").text(offerLetter.address || "", { align: "center" });
        doc.text(`${offerLetter.email} | ${offerLetter.phone} | ${offerLetter.website}`, { align: "center" });
        doc.moveDown(2);

        // --- Title
        doc.fontSize(14).font("Helvetica-Bold").text("Apprentice Letter", { align: "center" });
        doc.moveDown(1);

        // --- Body
        const joinDate = new Date().toLocaleDateString("en-IN");
        const letterBody = `
Dear ${user.name},

We are pleased to appoint you to our organization as an Associate in the ${user.department?.name || "____"} department of the company w.e.f ${joinDate}.

Your employment with us will be governed by the Terms & Conditions as detailed below.

Your offer has been made based on information furnished by you. However, if there arises any discrepancy in the copies of documents or certificates given by you, we retain the right to review our offer of employment. Employment as per this offer is subject to your being medically fit.

Please sign and return a duplicate copy of this letter as a token of your acceptance.

We congratulate you on your appointment and wish you a long and successful career with us.

We are confident that your contribution will take us further in our journey toward becoming world leaders.
We assure you of our support for your professional development and growth.
`;
        doc.font("Helvetica").fontSize(12).text(letterBody, { align: "justify" });
        doc.moveDown(2);

        // --- Signature from Cloudinary
        if (offerLetter.signtory) {
            const response = await axios.get(offerLetter.signtory, {
                responseType: "arraybuffer",
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            });
            const signPath = path.join(pdfDir, `sign_${user.name}.png`);
            fs.writeFileSync(signPath, Buffer.from(response.data));
            doc.image(signPath, 70, doc.y, { width: 100 });
        }

        doc.moveDown(5).font("Helvetica-Bold").text("Authorized Signatory");
        doc.fontSize(10).text("Managing Director");
        doc.end();

        // 3️⃣ Wait for PDF to finish writing
        stream.on("finish", async () => {
            // 4️⃣ Upload PDF to Cloudinary
            const pdfUrl = await uploadFileToCloudinary(pdfPath);

            // 5️⃣ Send email to employee
            //   const transporter = nodemailer.createTransport({
            //     service: "gmail", // You can replace with SMTP details if using company mail
            //     auth: {
            //       user: process.env.SMTP_USER, // e.g. "hr@adzdrio.com"
            //       pass: process.env.SMTP_PASS,
            //     },
            //   });
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.hostinger.com",
                port: process.env.SMTP_PORT || 465,
                secure: true, // true for 465 (SSL)
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: `"HR Department" <${process.env.FROM_EMAIL}>`,
                to: user.email,
                subject: "Your Offer Letter - AdzDrio India Services Pvt. Ltd",
                html: `
          <p>Dear ${user.name},</p>
          <p>Congratulations! 🎉</p>
          <p>Please find attached your official offer letter from AdzDrio India Services Pvt. Ltd.</p>
          <p>Best Regards,<br>HR Department<br><b>AdzDrio India Services Pvt. Ltd</b></p>
        `,
                attachments: [
                    {
                        filename: `${user.name}_OfferLetter.pdf`,
                        path: pdfPath,
                    },
                ],
            };

            await transporter.sendMail(mailOptions);

            // 6️⃣ Respond success
            res.status(200).json({
                success: true,
                message: `Offer letter sent successfully to ${user.email}`,
                pdfUrl,
            });

            // Optional cleanup
            fs.unlinkSync(pdfPath);
        });
    } catch (error) {
        console.error("Send Offer Letter Error:", error);
        res.status(500).json({
            success: false,
            message: "Error generating or sending offer letter",
            error: error.message,
        });
    }
};

const generateOfferLetterOLDWORKING = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

        const user = await User.findById(userId)
            .populate("department", "name")
            .populate("designation", "name")
            .populate("assignedService", "name");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const offerLetter = await OfferLetter.findOne({ company: user.assignedService });
        if (!offerLetter) return res.status(404).json({ success: false, message: "Offer letter not found for this company" });

        const assetsPath = path.join(__dirname, "../assets");
        const headerImagePath = path.join(assetsPath, "header.png");
        const footerImagePath = path.join(assetsPath, "footer.png");

        const pdfDir = path.join(__dirname, "../generated");
        if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

        const pdfPath = path.join(pdfDir, `${user.name}_OfferLetter.pdf`);
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // 1️⃣ HEADER IMAGE
        doc.image(headerImagePath, 0, 0, { width: doc.page.width, height: 150 });

        // 2️⃣ COMPANY INFO (over header, right aligned)
        doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
        const infoX = 370;
        doc.text(`Phone: ${offerLetter.phone || ""}`, infoX, 25, { width: 170 });
        doc.text(`Email: ${offerLetter.email || ""}`, infoX, 48, { width: 170 });
        doc.text(`Website: ${offerLetter.website || ""}`, infoX, 70, { width: 170 });
        doc.text(`Address: ${offerLetter.address || ""}`, infoX, 88, { width: 170 });

        doc.moveDown(6);

        // 3️⃣ Address & Date
        doc.fillColor("black").font("Helvetica").fontSize(10);
        doc.text(`Add: ${user.address || "User address"},`, 50, 160);
        doc.text(`Bihar - ${user.pincode || "000000"}`);

        doc.font("Helvetica-Bold").text("October 11, 2025", 50, 160, {
            align: "right",
        });

        doc.moveDown(2);

        // 4️⃣ Title
        doc.font("Helvetica-Bold").fontSize(13).text("Apprentice Letter", { align: "center", underline: true });
        doc.moveDown(1);

        // 5️⃣ Letter Content
        const joinDate = "03 September 2025";
        const letterBody = `
Dear ${user.name},

We are pleased to appoint you to our organization as an Associate in the ${user.department?.name || "____"} department of the company w.e.f ${joinDate}. On the following terms and conditions are given below.

Your employment with us will be governed by the Terms & Conditions as detailed below.

Your offer has been made based on information furnished by you. However, if there arises any discrepancy in the copies of documents or certificates given by you as proof of the above, we retain the right to review our offer of employment. Employment as per this offer is subject to your being medically fit.

Please sign and return a duplicate copy of this letter as a token of your acceptance.
We congratulate you on your appointment and wish you a long and successful career with us.

We are confident that your contribution will take us further in our journey toward becoming world leaders.
We assure you of our support for your professional development and growth.
    `;

        doc.font("Helvetica").fontSize(11).text(letterBody, {
            align: "justify",
            lineGap: 4,
        });


        // doc.moveDown(6);
        // doc.font("Helvetica-Bold").text("Arun Yadav");
        // doc.font("Helvetica").text("M. Director");
        doc.moveDown(4);
        doc.font("Helvetica-Bold").text("Arun Yadav");
        doc.font("Helvetica").text("M. Director");
        doc.moveDown(0.5);

        if (offerLetter.signtory) {
            const signPath = path.join(pdfDir, `sign_${user.name}.png`);
            const response = await axios.get(offerLetter.signtory, {
                responseType: "arraybuffer",
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            });
            fs.writeFileSync(signPath, Buffer.from(response.data));

            // Save current y position before drawing signature
            const signatureY = doc.y;

            doc.image(signPath, 50, signatureY, { width: 200 });

            // Move y position manually below signature
            doc.y = signatureY + 100; // Adjust 50 to height of signature + margin as needed
        }

        doc.font("Helvetica-Oblique").text("[Authorized Signatory]", 50, doc.y);


        // 7️⃣ Footer Image
        const footerHeight = 50;
        const footerY = doc.page.height - footerHeight;
        doc.image(footerImagePath, 0, footerY, {
            width: doc.page.width,
            height: footerHeight,
        });

        doc.end();

        // 8️⃣ After stream finished, send email
        stream.on("finish", async () => {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.hostinger.com",
                port: process.env.SMTP_PORT || 465,
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: `"HR Department" <${process.env.FROM_EMAIL}>`,
                to: user.email,
                subject: "Your Offer Letter - AdzDrio India Services Pvt. Ltd",
                html: `
          <p>Dear ${user.name},</p>
          <p>Congratulations! 🎉</p>
          <p>Please find attached your official offer letter from AdzDrio India Services Pvt. Ltd.</p>
          <p>Best Regards,<br>HR Department<br><b>AdzDrio India Services Pvt. Ltd</b></p>
        `,
                attachments: [
                    {
                        filename: `${user.name}_OfferLetter.pdf`,
                        path: pdfPath,
                    },
                ],
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({
                success: true,
                message: `Offer letter sent successfully to ${user.email}`,
            });

            // Optional cleanup
            fs.unlinkSync(pdfPath);
        });
    } catch (error) {
        console.error("Error generating offer letter:", error);
        res.status(500).json({
            success: false,
            message: "Error generating or sending offer letter",
            error: error.message,
        });
    }
};


const generateOfferLetter = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

        const user = await User.findById(userId)
            .populate("department", "name")
            .populate("designation", "name")
            .populate("assignedService", "name");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const offerLetter = await OfferLetter.findOne({ company: user.assignedService });
        if (!offerLetter) return res.status(404).json({ success: false, message: "Offer letter not found for this company" });

        const assetsPath = path.join(__dirname, "../assets");
        const headerImagePath = path.join(assetsPath, "header.png");
        const footerImagePath = path.join(assetsPath, "footer.png");
        const pdfDir = path.join(__dirname, "../generated");
        if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

        const pdfPath = path.join(pdfDir, `${user.name}_OfferLetter.pdf`);
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // 1️⃣ HEADER IMAGE
        doc.image(headerImagePath, 0, 0, { width: doc.page.width, height: 150 });

        // 2️⃣ COMPANY INFO (top-right)
        doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
        const infoX = 370;
        doc.text(`Phone: ${offerLetter.phone || ""}`, infoX, 25, { width: 170 });
        doc.text(`Email: ${offerLetter.email || ""}`, infoX, 48, { width: 170 });
        doc.text(`Website: ${offerLetter.website || ""}`, infoX, 70, { width: 170 });
        doc.text(`Address: ${offerLetter.address || ""}`, infoX, 88, { width: 170 });

        doc.moveDown(6);

        // 3️⃣ Address & Date
        doc.fillColor("black").font("Helvetica").fontSize(10);
        doc.text(`Add: ${user.address || "User address"},`, 50, 160);
        doc.text(`Bihar - ${user.pincode || "000000"}`);

        doc.font("Helvetica-Bold").text("October 11, 2025", 50, 160, {
            align: "right",
        });

        doc.moveDown(2);

        // 4️⃣ Title
        doc.font("Helvetica-Bold").fontSize(13).text("Apprentice Letter", { align: "center", underline: true });
        doc.moveDown(1);

        // 5️⃣ Letter Body (Page 1)
        const joinDate = "03 September 2025";
        const letterBody = `
Dear ${user.name},

We are pleased to appoint you to our organization as an Associate in the ${user.department?.name || "____"} department of the company w.e.f ${joinDate}. On the following terms and conditions are given below.

Your employment with us will be governed by the Terms & Conditions as detailed below.

Your offer has been made based on information furnished by you. However, if there arises any discrepancy in the copies of documents or certificates given by you as proof of the above, we retain the right to review our offer of employment. Employment as per this offer is subject to your being medically fit.

Please sign and return a duplicate copy of this letter as a token of your acceptance.

We congratulate you on your appointment and wish you a long and successful career with us.

We are confident that your contribution will take us further in our journey toward becoming world leaders.

We assure you of our support for your professional development and growth.
        `;

        doc.font("Helvetica").fontSize(11).text(letterBody, {
            align: "justify",
            lineGap: 4,
        });

        doc.moveDown(4);
        doc.font("Helvetica-Bold").text("Arun Yadav");
        doc.font("Helvetica").text("M. Director");

        // Signature Image
        if (offerLetter.signtory) {
            const signPath = path.join(pdfDir, `sign_${user.name}.png`);
            const response = await axios.get(offerLetter.signtory, {
                responseType: "arraybuffer",
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            });
            fs.writeFileSync(signPath, Buffer.from(response.data));
            const signatureY = doc.y;
            doc.image(signPath, 50, signatureY, { width: 200 });
            doc.y = signatureY + 100;
        }

        doc.font("Helvetica-Oblique").text("[Authorized Signatory]", 50, doc.y);

        // ➕ Add 2nd Page: Employment Contract
        doc.addPage();

        // Reversed header image (same as footer, flipped)
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6); // add spacing after header

        // Title
        doc.font("Helvetica-Bold").fontSize(13).text("CONTRACT OF EMPLOYMENT", {
            align: "center",
            underline: true,
        });
        doc.moveDown(2);

        // ... (rest of the contract content here — same as previously shared)


        // Sub-title
        doc.font("Helvetica-Bold").fontSize(11).text("MADE AND ENTERED INTO BY AND BETWEEN:");
        doc.moveDown(0.5);

        // Paragraph 1 – Parties
        doc.font("Helvetica").fontSize(11).text(
            `This Agreement is effective when signed by and between ${offerLetter.companyName || "AdzDrio India Services Private Limited"} (hereinafter referred to as the "Company"), a private limited company having its registered office at ${offerLetter.address || "15, D Block, Sector 6, Noida, Uttar Pradesh 201301"}.`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(0.5);

        doc.text(
            `${user.name}, (hereinafter referred to as the "Employee"), D/o ${user.fatherName || "Anil Jha"}, residing at ${user.address || "User Address"}, collectively referred to as the "Parties".`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(1);

        doc.text(
            `The Company has employed ${user.name} since/from ${joinDate} and this agreement is intended for the Contract of Employment disclosed by the Company in the course of employment to ${user.name}.`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(1);

        // Section 1
        doc.font("Helvetica-Bold").text("1. Appointment:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "The EMPLOYEE, who hereby accepts the appointment and is appointed as an Apprentice for the EMPLOYER.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 2
        doc.font("Helvetica-Bold").text("2. Duration:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `This Agreement will become effective as from ${joinDate} and it will continue for an indefinite period until it has been cancelled in terms thereof.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 3
        doc.font("Helvetica-Bold").text("3. Probation:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `The EMPLOYEE's appointment is subject to a 3 (three) month's probationary period during which period the EMPLOYER may terminate the services for any fair reason. 3 days' written notice of termination of service to the EMPLOYEE, prior to the end of the probationary period will be given.`,
            { align: "justify", lineGap: 4 }
        );

        doc.text(
            `Substantive and procedural fairness will ensure that the EMPLOYEE will be given the opportunity to state their case in response to any allegations, and a final decision from the EMPLOYER will be made.`,
            { align: "justify", lineGap: 4 }
        );

        doc.text(
            `However, in case of termination, the EMPLOYER shall pay remuneration for the period worked, deducting proportionate salary in case of leave(s).`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(1);

        // Section 4
        doc.font("Helvetica-Bold").text("4. Service/Nature of Work:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `You will work at a high standard of initiative, creativeness, efficiency, and economy in the organization. The nature of work and responsibilities will be assigned and explained to you by your senior from time to time.`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(2);

        // Signature
        // doc.font("Helvetica-Bold").text("Arun Yadav");
        // doc.font("Helvetica").text("M. Director");
        // doc.font("Helvetica-Oblique").text("[Authorized Signatory]");


        // doc.font("Helvetica").fontSize(11).text(contractBody, {
        //     align: "justify",
        //     lineGap: 4,
        // });

        // Optional signature again (if needed)
        // doc.moveDown(4);
        // doc.font("Helvetica-Bold").text("Arun Yadav");
        // doc.font("Helvetica").text("M. Director");
        // doc.font("Helvetica-Oblique").text("[Authorized Signatory]");

        // 7️⃣ Footer
        const footerHeight = 50;
        const footerY = doc.page.height - footerHeight;
        doc.image(footerImagePath, 0, footerY, {
            width: doc.page.width,
            height: footerHeight,
        });

        // ➕ Add 3rd Page: Continued Contract of Employment
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 5
        doc.font("Helvetica-Bold").text("5. The Employee's Duties:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `The core of the EMPLOYEE's duties towards the EMPLOYER is a duty to obey all lawful and reasonable orders and to perform such work as she / he is directed to perform which falls within his/her vocational ability.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            `Though you have been engaged in a specific position, the company reserves the right to send you on deputation/transfer/assignment to any of the company's branch/client offices in India or abroad, whether existing at the time of your appointment or to be set up in the future.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            `Without limiting the aforesaid duties, the EMPLOYEE is obliged to strictly comply with the provision of this agreement, may not misappropriate the EMPLOYER's property, keep all information entrusted to him/her confidential and have to adhere to the general Code of Conduct that governs all relations with co-employees, clients.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 6
        doc.font("Helvetica-Bold").text("6. Working Hours:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `You will be working in the company for 9 hours including 30 minutes for a lunch break and two times 15 minutes for a tea break.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 7
        doc.font("Helvetica-Bold").text("7. Lock-In Period:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `Your appointment will be subject to a lock-in period of 12 months from the third month of the date of your appointment.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            `By signing this agreement, you will be bound to work/serve the organization for at least 12 months after the expiry of the probation period of three months. In case, you leave the company before the expiry of the lock-in period, the company shall get the right either to hold your salary or charge 60 days salary from you as charges of providing training to you on probation period or any compensation for loss that occurred due to the termination or all.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 8
        doc.font("Helvetica-Bold").text("8. Remuneration:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `The EMPLOYEE will be entitled to the following remuneration: A monthly stipend of Rs.19000/-`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            `The EMPLOYEE hereby gives permission to the EMPLOYER to deduct all obligatory deduction as authorized by statute from the above remuneration.`,
            { align: "justify", lineGap: 4 }
        );

        // Footer for 3rd page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });

        // ➕ Add 4th Page: Continued Contract of Employment
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 9
        doc.font("Helvetica-Bold").text("9. Termination of Service:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "i. Either party can terminate this employment by serving a notice of one or half months on the other, save and accept that the company may at its option pay total salary in lieu of the notice period to terminate employment with immediate effect.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "ii. An unauthorized absence or absence without permission from duty for a continuous period of 3 days would make you lose your lien on employment. In such a case your employment shall automatically come to an end without any notice of termination or notice of pay.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "iii. Resignation tendered by you while you are on leave shall not be accepted by the Company and the Company in such case shall have a right to hold your salary and the same shall be released/paid only after you join the office and complete your notice period.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "iv. In case you resign during your probation period, you should give an advance 3 Days’ notice of the same.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "v. You will be governed by the laid down code of conduct of the company and if there is any breach of the same or non-conformance of contractual obligation or with the terms and conditions laid down in this agreement, your service can be terminated without any notice.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "vi. Notwithstanding any other terms and conditions stipulated herein, the company reserves the right to invoke other legal remedies as it deems fit to protect its legitimate interest in case of any contractual breach by you.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 10
        doc.font("Helvetica-Bold").text("10. Personal Information:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will keep us informed of any change in your residential address, your family status or any other relevant particulars. You would also let us know the name and address of your legal heir/nominee.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 11
        doc.font("Helvetica-Bold").text("11. Appointment in Good Faith:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "It must be specifically understood that this offer is made based on your proficiency in technical/professional skills you have declared to possess per your application for employment and your ability to handle any assignment job independently. In case at a later date, any of your statements/particulars furnished are found to be false or misleading or your performance is not up to the mark or falls short of the minimum standard set by the company, the company shall have the right to terminate your services.",
            { align: "justify", lineGap: 4 }
        );

        // Footer for 4th page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });
        // ➕ Add 5th Page: Continued Contract of Employment
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 12
        doc.font("Helvetica").text(
            "Services forthwith without giving any notice notwithstanding any other terms and conditions stipulated there in",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);
        doc.font("Helvetica").text(
            "The above terms and conditions are based on the company's policy, procedures and other rules currently applicable in India and are subject to amendments and adjustments from time to time. In all matters, including those not specifically covered here such as traveling, retirement, etc., you will be governed by the rules of the company as shall be in force from time to time.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);
        doc.font("Helvetica-Bold").text("12. Training:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will hold yourself in readiness for any training at any place whenever required. Such training would be imparted to you at the company's expense. Kindly note that refusal to participate in a training programme without any extraneous circumstances would lead to automatic termination of your employment.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 13
        doc.font("Helvetica-Bold").text("13. Leave:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will be entitled to leave as per the law in force and as laid down in the Standing Orders of the company. The company follows a strict time schedule, and late comings are discouraged, unless otherwise notified by you in advance. Late marks will be accorded to you for every late entry with one day of absence counted for every four late marks.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 14
        doc.font("Helvetica-Bold").text("14. Restrictions:");
        doc.moveDown(0.5);

        // Subsection i
        doc.font("Helvetica-Bold").text("i. Access to Information:", { continued: false });
        doc.font("Helvetica").text(
            "Information is available on a need-to-know basis for specific groups and the network file server of the company is segregated to allow individual sectors information access for projects and units. Access to this is authorized through access privileges approved by the departmental heads.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);

        // Subsection ii
        doc.font("Helvetica-Bold").text("ii. Restriction on Personal Use:", { continued: false });
        doc.font("Helvetica").text(
            "Use of company resources for personal use is strictly restricted. This includes usage of computer resources, information, internet service, and working time of the company for any personal use.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 15
        doc.font("Helvetica-Bold").text("15. Confidentiality Information:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            'The Parties agree that information disclosed orally or in writing or made available by the Company ("Company") to another Party ("Employee"), including, but not limited to, information acquired from employees; trade secrets; strategic plans; invention plans and disclosures; customer information; computer programs; software codes; databases, suppliers; software, distribution channels, marketing studies, intellectual.',
            { align: "justify", lineGap: 4 }
        );

        // Footer for 5th page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 15 (continued)
        doc.font("Helvetica").text(
            "Property; information relating to process and products, designs, business plans, business opportunities, marketing plans, finances, research, development, know-how or personnel; confidential information originally received from third parties, information relating to any type of technology, and all other material whether written or oral, tangible or intangible, shall be deemed \"Confidential Information\". In addition, the existence and terms of this Agreement shall also be treated as Confidential Information. The parties agree that any Confidential Information disclosed prior to the execution of this Agreement during the course of employment was intended to be and shall be subject to the terms and conditions of this Agreement.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Clause i
        doc.font("Helvetica-Bold").text("i. ", { continued: true });
        doc.font("Helvetica").text(
            "The Employee agrees to keep all of the Employer's business (the company or associate companies/firms, client companies/firms/organizations including development, process reports and reporting system) secrets confidential at all times during and after the term of the Employee's employment. The Employer's business secrets include any information regarding the Employer's customers, supplies, finances, research, development, manufacturing processes, maintained by controlling physical access to computer system, disabling all working stations, floppy disk drives and companywide awareness about the need for protection of intellectual property and sensitive customer information or any other technical or business information.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Clause ii
        doc.font("Helvetica-Bold").text("ii. ", { continued: true });
        doc.font("Helvetica").text(
            "The Employee agrees not to make any unauthorized copies of any of the Employer's business secrets or information without the Employer's consent, nor to remove any of the Employer's business secrets or information from the Employer's facilities.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Clause iii
        doc.font("Helvetica-Bold").text("iii. ", { continued: true });
        doc.font("Helvetica").text(
            "All Confidential Information, and all material items delivered by the Company to the Employee, remains the property of the Company and no license or other rights in the Confidential Information are granted to the Employee by this Agreement or by the act of disclosure.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 16
        doc.font("Helvetica-Bold").text("16. Standing Orders / Rules & Regulations:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will abide by the Standing Orders, rules & regulations and service conditions that may be in force or application to the organization or are framed from time to time by the company.",
            { align: "justify", lineGap: 4 }
        );

        // Footer for 6th page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 17
        doc.font("Helvetica-Bold").text("17. Code of Conduct:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will abide by the Code of Conduct of the company that may be in force or application to the organization or are framed from time to time by the company.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 18
        doc.font("Helvetica-Bold").text("18. Applicable Law and Dispute Resolution:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "The applicable law is usually the law of the place of employment. Disputes could be resolved in court, by arbitration, mediation, or a certain statutory body such as the Labour Tribunal.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Closing statement
        doc.font("Helvetica").text(
            "By signing this Employment Agreement, you are abide to follow the code of conduct and breach of which will be treated as breach of contract and the company has the right to take disciplinary or legal remedies, as may be required and fit.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(2);

        // Date and Place
        doc.font("Helvetica-Bold").text("Date: ", { continued: true }).font("Helvetica").text("03 Sep 2025");
        doc.font("Helvetica-Bold").text("Place: ", { continued: true }).font("Helvetica").text("Noida");
        doc.moveDown(1);

        // Employee name and signature
        doc.font("Helvetica-Bold").text("Employee Name: ", { continued: true }).font("Helvetica").text("Ms. Puja Jha", { underline: true });
        doc.font("Helvetica-Bold").text("Employee Signature:");
        doc.moveDown(3);

        // For Company section
        doc.font("Helvetica-Bold").text("For Company.");
        doc.font("Helvetica").text("AdzDio India Services Pvt. Ltd.");
        if (offerLetter.signtory) {
            const signPath = path.join(pdfDir, `sign_${user.name}.png`);
            const response = await axios.get(offerLetter.signtory, {
                responseType: "arraybuffer",
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            });
            fs.writeFileSync(signPath, Buffer.from(response.data));
            const signatureY = doc.y;
            doc.image(signPath, 50, signatureY, { width: 200 });
            doc.y = signatureY + 100;
        }
        doc.font("Helvetica").text("Authorised Signatory");

        // Footer for last page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });


        doc.end();

        // 8️⃣ Send Email with PDF
        stream.on("finish", async () => {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.hostinger.com",
                port: process.env.SMTP_PORT || 465,
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: `"HR Department" <${process.env.FROM_EMAIL}>`,
                to: user.email,
                subject: "Your Offer Letter - AdzDrio India Services Pvt. Ltd",
                html: `
                    <p>Dear ${user.name},</p>
                    <p>Congratulations! 🎉</p>
                    <p>Please find attached your official offer letter from AdzDrio India Services Pvt. Ltd.</p>
                    <p>Best Regards,<br>HR Department<br><b>AdzDrio India Services Pvt. Ltd</b></p>
                `,
                attachments: [
                    {
                        filename: `${user.name}_OfferLetter.pdf`,
                        path: pdfPath,
                    },
                ],
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({
                success: true,
                message: `Offer letter sent successfully to ${user.email}`,
            });

            // Cleanup
            fs.unlinkSync(pdfPath);
        });
    } catch (error) {
        console.error("Error generating offer letter:", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
const generateAndDownloadOfferLetter = async (req, res) => {
    try {
        const { userId, date } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

        const user = await User.findById(userId)
            .populate("department", "name")
            .populate("designation", "name")
            .populate("assignedService", "name");

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const offerLetter = await OfferLetter.findOne({ company: user.assignedService });
        if (!offerLetter) return res.status(404).json({ success: false, message: "Offer letter not found for this company" });

        const assetsPath = path.join(__dirname, "../assets");
        const headerImagePath = path.join(assetsPath, "header.png");
        const footerImagePath = path.join(assetsPath, "footer.png");
        const pdfDir = path.join(__dirname, "../generated");
        if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

        const pdfPath = path.join(pdfDir, `${user.name}_OfferLetter.pdf`);
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // 1️⃣ HEADER IMAGE
        doc.image(headerImagePath, 0, 0, { width: doc.page.width, height: 150 });

        // 2️⃣ COMPANY INFO (top-right)
        doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
        const infoX = 370;
        doc.text(`Phone: ${offerLetter.phone || ""}`, infoX, 25, { width: 170 });
        doc.text(`Email: ${offerLetter.email || ""}`, infoX, 48, { width: 170 });
        doc.text(`Website: ${offerLetter.website || ""}`, infoX, 70, { width: 170 });
        doc.text(`Address: ${offerLetter.address || ""}`, infoX, 88, { width: 170 });

        doc.moveDown(6);

        // 3️⃣ Address & Date
        doc.fillColor("black").font("Helvetica").fontSize(10);
        doc.text(`Add: ${user.address || "User address"},`, 50, 160);
        // doc.text(`Bihar - ${user.pincode || "000000"}`);

        doc.font("Helvetica-Bold").text(date , 50, 160, {
            align: "right",
        });

        doc.moveDown(2);

        // 4️⃣ Title
        doc.font("Helvetica-Bold").fontSize(13).text("Apprentice Letter", { align: "center", underline: true });
        doc.moveDown(1);

        // 5️⃣ Letter Body (Page 1)
        const joinDate = date;
        const letterBody = `
Dear ${user.name},

We are pleased to appoint you to our organization as an Associate in the ${user.department?.name || "____"} department of the company w.e.f ${joinDate}. On the following terms and conditions are given below.

Your employment with us will be governed by the Terms & Conditions as detailed below.

Your offer has been made based on information furnished by you. However, if there arises any discrepancy in the copies of documents or certificates given by you as proof of the above, we retain the right to review our offer of employment. Employment as per this offer is subject to your being medically fit.

Please sign and return a duplicate copy of this letter as a token of your acceptance.

We congratulate you on your appointment and wish you a long and successful career with us.

We are confident that your contribution will take us further in our journey toward becoming world leaders.

We assure you of our support for your professional development and growth.
        `;

        doc.font("Helvetica").fontSize(11).text(letterBody, {
            align: "justify",
            lineGap: 4,
        });

        doc.moveDown(4);
        doc.font("Helvetica-Bold").text("Arun Yadav");
        doc.font("Helvetica").text("M. Director");

        // Signature Image
        if (offerLetter.signtory) {
            const signPath = path.join(pdfDir, `sign_${user.name}.png`);
            const response = await axios.get(offerLetter.signtory, {
                responseType: "arraybuffer",
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            });
            fs.writeFileSync(signPath, Buffer.from(response.data));
            const signatureY = doc.y;
            doc.image(signPath, 50, signatureY, { width: 200 });
            doc.y = signatureY + 100;
        }

        doc.font("Helvetica-Oblique").text("[Authorized Signatory]", 50, doc.y);

        // ➕ Add 2nd Page: Employment Contract
        doc.addPage();

        // Reversed header image (same as footer, flipped)
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6); // add spacing after header

        // Title
        doc.font("Helvetica-Bold").fontSize(13).text("CONTRACT OF EMPLOYMENT", {
            align: "center",
            underline: true,
        });
        doc.moveDown(2);

        // ... (rest of the contract content here — same as previously shared)


        // Sub-title
        doc.font("Helvetica-Bold").fontSize(11).text("MADE AND ENTERED INTO BY AND BETWEEN:");
        doc.moveDown(0.5);

        // Paragraph 1 – Parties
        doc.font("Helvetica").fontSize(11).text(
            `This Agreement is effective when signed by and between ${offerLetter.companyName || "AdzDrio India Services Private Limited"} (hereinafter referred to as the "Company"), a private limited company having its registered office at ${offerLetter.address || "15, D Block, Sector 6, Noida, Uttar Pradesh 201301"}.`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(0.5);

        doc.text(
            `${user.name}, (hereinafter referred to as the "Employee"), D/o ${user.father || "Anil Jha"}, residing at ${user.address || "User Address"}, collectively referred to as the "Parties".`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(1);

        doc.text(
            `The Company has employed ${user.name} since/from ${joinDate} and this agreement is intended for the Contract of Employment disclosed by the Company in the course of employment to ${user.name}.`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(1);

        // Section 1
        doc.font("Helvetica-Bold").text("1. Appointment:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "The EMPLOYEE, who hereby accepts the appointment and is appointed as an Apprentice for the EMPLOYER.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 2
        doc.font("Helvetica-Bold").text("2. Duration:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `This Agreement will become effective as from ${joinDate} and it will continue for an indefinite period until it has been cancelled in terms thereof.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 3
        doc.font("Helvetica-Bold").text("3. Probation:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `The EMPLOYEE's appointment is subject to a 3 (three) month's probationary period during which period the EMPLOYER may terminate the services for any fair reason. 3 days' written notice of termination of service to the EMPLOYEE, prior to the end of the probationary period will be given.`,
            { align: "justify", lineGap: 4 }
        );

        doc.text(
            `Substantive and procedural fairness will ensure that the EMPLOYEE will be given the opportunity to state their case in response to any allegations, and a final decision from the EMPLOYER will be made.`,
            { align: "justify", lineGap: 4 }
        );

        doc.text(
            `However, in case of termination, the EMPLOYER shall pay remuneration for the period worked, deducting proportionate salary in case of leave(s).`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(1);

        // Section 4
        doc.font("Helvetica-Bold").text("4. Service/Nature of Work:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `You will work at a high standard of initiative, creativeness, efficiency, and economy in the organization. The nature of work and responsibilities will be assigned and explained to you by your senior from time to time.`,
            { align: "justify", lineGap: 4 }
        );

        doc.moveDown(2);

        // Signature
        // doc.font("Helvetica-Bold").text("Arun Yadav");
        // doc.font("Helvetica").text("M. Director");
        // doc.font("Helvetica-Oblique").text("[Authorized Signatory]");


        // doc.font("Helvetica").fontSize(11).text(contractBody, {
        //     align: "justify",
        //     lineGap: 4,
        // });

        // Optional signature again (if needed)
        // doc.moveDown(4);
        // doc.font("Helvetica-Bold").text("Arun Yadav");
        // doc.font("Helvetica").text("M. Director");
        // doc.font("Helvetica-Oblique").text("[Authorized Signatory]");

        // 7️⃣ Footer
        const footerHeight = 50;
        const footerY = doc.page.height - footerHeight;
        doc.image(footerImagePath, 0, footerY, {
            width: doc.page.width,
            height: footerHeight,
        });

        // ➕ Add 3rd Page: Continued Contract of Employment
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 5
        doc.font("Helvetica-Bold").text("5. The Employee's Duties:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `The core of the EMPLOYEE's duties towards the EMPLOYER is a duty to obey all lawful and reasonable orders and to perform such work as she / he is directed to perform which falls within his/her vocational ability.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            `Though you have been engaged in a specific position, the company reserves the right to send you on deputation/transfer/assignment to any of the company's branch/client offices in India or abroad, whether existing at the time of your appointment or to be set up in the future.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            `Without limiting the aforesaid duties, the EMPLOYEE is obliged to strictly comply with the provision of this agreement, may not misappropriate the EMPLOYER's property, keep all information entrusted to him/her confidential and have to adhere to the general Code of Conduct that governs all relations with co-employees, clients.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 6
        doc.font("Helvetica-Bold").text("6. Working Hours:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `You will be working in the company for 9 hours including 30 minutes for a lunch break and two times 15 minutes for a tea break.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 7
        doc.font("Helvetica-Bold").text("7. Lock-In Period:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `Your appointment will be subject to a lock-in period of 12 months from the third month of the date of your appointment.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            `By signing this agreement, you will be bound to work/serve the organization for at least 12 months after the expiry of the probation period of three months. In case, you leave the company before the expiry of the lock-in period, the company shall get the right either to hold your salary or charge 60 days salary from you as charges of providing training to you on probation period or any compensation for loss that occurred due to the termination or all.`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 8
        doc.font("Helvetica-Bold").text("8. Remuneration:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            `The EMPLOYEE will be entitled to the following remuneration: A monthly stipend of Rs. ${user.salary}/-`,
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            `The EMPLOYEE hereby gives permission to the EMPLOYER to deduct all obligatory deduction as authorized by statute from the above remuneration.`,
            { align: "justify", lineGap: 4 }
        );

        // Footer for 3rd page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });

        // ➕ Add 4th Page: Continued Contract of Employment
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 9
        doc.font("Helvetica-Bold").text("9. Termination of Service:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "i. Either party can terminate this employment by serving a notice of one or half months on the other, save and accept that the company may at its option pay total salary in lieu of the notice period to terminate employment with immediate effect.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "ii. An unauthorized absence or absence without permission from duty for a continuous period of 3 days would make you lose your lien on employment. In such a case your employment shall automatically come to an end without any notice of termination or notice of pay.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "iii. Resignation tendered by you while you are on leave shall not be accepted by the Company and the Company in such case shall have a right to hold your salary and the same shall be released/paid only after you join the office and complete your notice period.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "iv. In case you resign during your probation period, you should give an advance 3 Days’ notice of the same.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "v. You will be governed by the laid down code of conduct of the company and if there is any breach of the same or non-conformance of contractual obligation or with the terms and conditions laid down in this agreement, your service can be terminated without any notice.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);
        doc.text(
            "vi. Notwithstanding any other terms and conditions stipulated herein, the company reserves the right to invoke other legal remedies as it deems fit to protect its legitimate interest in case of any contractual breach by you.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 10
        doc.font("Helvetica-Bold").text("10. Personal Information:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will keep us informed of any change in your residential address, your family status or any other relevant particulars. You would also let us know the name and address of your legal heir/nominee.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 11
        doc.font("Helvetica-Bold").text("11. Appointment in Good Faith:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "It must be specifically understood that this offer is made based on your proficiency in technical/professional skills you have declared to possess per your application for employment and your ability to handle any assignment job independently. In case at a later date, any of your statements/particulars furnished are found to be false or misleading or your performance is not up to the mark or falls short of the minimum standard set by the company, the company shall have the right to terminate your services.",
            { align: "justify", lineGap: 4 }
        );

        // Footer for 4th page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });
        // ➕ Add 5th Page: Continued Contract of Employment
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 12
        doc.font("Helvetica").text(
            "Services forthwith without giving any notice notwithstanding any other terms and conditions stipulated there in",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);
        doc.font("Helvetica").text(
            "The above terms and conditions are based on the company's policy, procedures and other rules currently applicable in India and are subject to amendments and adjustments from time to time. In all matters, including those not specifically covered here such as traveling, retirement, etc., you will be governed by the rules of the company as shall be in force from time to time.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);
        doc.font("Helvetica-Bold").text("12. Training:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will hold yourself in readiness for any training at any place whenever required. Such training would be imparted to you at the company's expense. Kindly note that refusal to participate in a training programme without any extraneous circumstances would lead to automatic termination of your employment.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 13
        doc.font("Helvetica-Bold").text("13. Leave:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will be entitled to leave as per the law in force and as laid down in the Standing Orders of the company. The company follows a strict time schedule, and late comings are discouraged, unless otherwise notified by you in advance. Late marks will be accorded to you for every late entry with one day of absence counted for every four late marks.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 14
        doc.font("Helvetica-Bold").text("14. Restrictions:");
        doc.moveDown(0.5);

        // Subsection i
        doc.font("Helvetica-Bold").text("i. Access to Information:", { continued: false });
        doc.font("Helvetica").text(
            "Information is available on a need-to-know basis for specific groups and the network file server of the company is segregated to allow individual sectors information access for projects and units. Access to this is authorized through access privileges approved by the departmental heads.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(0.5);

        // Subsection ii
        doc.font("Helvetica-Bold").text("ii. Restriction on Personal Use:", { continued: false });
        doc.font("Helvetica").text(
            "Use of company resources for personal use is strictly restricted. This includes usage of computer resources, information, internet service, and working time of the company for any personal use.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 15
        doc.font("Helvetica-Bold").text("15. Confidentiality Information:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            'The Parties agree that information disclosed orally or in writing or made available by the Company ("Company") to another Party ("Employee"), including, but not limited to, information acquired from employees; trade secrets; strategic plans; invention plans and disclosures; customer information; computer programs; software codes; databases, suppliers; software, distribution channels, marketing studies, intellectual.',
            { align: "justify", lineGap: 4 }
        );

        // Footer for 5th page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 15 (continued)
        doc.font("Helvetica").text(
            "Property; information relating to process and products, designs, business plans, business opportunities, marketing plans, finances, research, development, know-how or personnel; confidential information originally received from third parties, information relating to any type of technology, and all other material whether written or oral, tangible or intangible, shall be deemed \"Confidential Information\". In addition, the existence and terms of this Agreement shall also be treated as Confidential Information. The parties agree that any Confidential Information disclosed prior to the execution of this Agreement during the course of employment was intended to be and shall be subject to the terms and conditions of this Agreement.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Clause i
        doc.font("Helvetica-Bold").text("i. ", { continued: true });
        doc.font("Helvetica").text(
            "The Employee agrees to keep all of the Employer's business (the company or associate companies/firms, client companies/firms/organizations including development, process reports and reporting system) secrets confidential at all times during and after the term of the Employee's employment. The Employer's business secrets include any information regarding the Employer's customers, supplies, finances, research, development, manufacturing processes, maintained by controlling physical access to computer system, disabling all working stations, floppy disk drives and companywide awareness about the need for protection of intellectual property and sensitive customer information or any other technical or business information.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Clause ii
        doc.font("Helvetica-Bold").text("ii. ", { continued: true });
        doc.font("Helvetica").text(
            "The Employee agrees not to make any unauthorized copies of any of the Employer's business secrets or information without the Employer's consent, nor to remove any of the Employer's business secrets or information from the Employer's facilities.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Clause iii
        doc.font("Helvetica-Bold").text("iii. ", { continued: true });
        doc.font("Helvetica").text(
            "All Confidential Information, and all material items delivered by the Company to the Employee, remains the property of the Company and no license or other rights in the Confidential Information are granted to the Employee by this Agreement or by the act of disclosure.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 16
        doc.font("Helvetica-Bold").text("16. Standing Orders / Rules & Regulations:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will abide by the Standing Orders, rules & regulations and service conditions that may be in force or application to the organization or are framed from time to time by the company.",
            { align: "justify", lineGap: 4 }
        );

        // Footer for 6th page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });
        doc.addPage();

        // Add reversed header image again
        doc.save();
        doc.transform(1, 0, 0, -1, 0, 50);
        doc.image(footerImagePath, 0, -50, {
            width: doc.page.width,
            height: 50,
        });
        doc.restore();

        doc.moveDown(6);

        // Section 17
        doc.font("Helvetica-Bold").text("17. Code of Conduct:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "You will abide by the Code of Conduct of the company that may be in force or application to the organization or are framed from time to time by the company.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Section 18
        doc.font("Helvetica-Bold").text("18. Applicable Law and Dispute Resolution:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text(
            "The applicable law is usually the law of the place of employment. Disputes could be resolved in court, by arbitration, mediation, or a certain statutory body such as the Labour Tribunal.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(1);

        // Closing statement
        doc.font("Helvetica").text(
            "By signing this Employment Agreement, you are abide to follow the code of conduct and breach of which will be treated as breach of contract and the company has the right to take disciplinary or legal remedies, as may be required and fit.",
            { align: "justify", lineGap: 4 }
        );
        doc.moveDown(2);

        // Date and Place
        doc.font("Helvetica-Bold").text("Date: ", { continued: true }).font("Helvetica").text(joinDate);
        doc.font("Helvetica-Bold").text("Place: ", { continued: true }).font("Helvetica").text(offerLetter.address);
        doc.moveDown(1);

        // Employee name and signature
        doc.font("Helvetica-Bold").text("Employee Name: ", { continued: true }).font("Helvetica").text(user?.name, { underline: true });
        doc.font("Helvetica-Bold").text("Employee Signature:");
        doc.moveDown(3);

        // For Company section
        doc.font("Helvetica-Bold").text("For Company.");
        doc.font("Helvetica").text("AdzDio India Services Pvt. Ltd.");
        if (offerLetter.signtory) {
            const signPath = path.join(pdfDir, `sign_${user.name}.png`);
            const response = await axios.get(offerLetter.signtory, {
                responseType: "arraybuffer",
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            });
            fs.writeFileSync(signPath, Buffer.from(response.data));
            const signatureY = doc.y;
            doc.image(signPath, 50, signatureY, { width: 200 });
            doc.y = signatureY + 100;
        }
        doc.font("Helvetica").text("Authorised Signatory");

        // Footer for last page
        doc.image(footerImagePath, 0, doc.page.height - 50, {
            width: doc.page.width,
            height: 50,
        });


        doc.end();

        // 8️⃣ Send Email with PDF
        stream.on("finish", () => {
            // Set response headers
            res.download(pdfPath, `${user.name}_OfferLetter.pdf`, (err) => {
                if (err) {
                    console.error("Download error:", err);
                    res.status(500).json({ success: false, message: "Failed to download PDF" });
                }

                // Optional: Delete file after download
                fs.unlinkSync(pdfPath);
            });
        });

    } catch (error) {
        console.error("Error generating offer letter:", error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
// Helper: upload file buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, originalname, type = "image") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "offerLetters/signatures",
                use_filename: true,
                public_id: originalname.split(".")[0].trim(),
                unique_filename: false,
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};

// ===== CREATE Offer Letter =====
const createOfferLetter = async (req, res) => {
    try {
        const { company, phone, email, website, address } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        let signtoryUrl = null;

        // Upload signtory image if provided
        if (req.files?.signtory?.length > 0) {
            const uploadedSign = await uploadBufferToCloudinary(
                req.files.signtory[0].buffer,
                req.files.signtory[0].originalname,
                "image"
            );
            signtoryUrl = uploadedSign;
        }

        const newOfferLetter = new OfferLetter({
            company,
            phone,
            email,
            website,
            address,
            signtory: signtoryUrl,
        });

        await newOfferLetter.save();

        res.status(201).json({
            success: true,
            message: "Offer letter created successfully",
            data: newOfferLetter,
        });
    } catch (error) {
        console.error("Create Offer Letter Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while creating offer letter",
            error: error.message,
        });
    }
};

// ===== GET ALL =====
const getOfferLetters = async (req, res) => {
    try {
        const offerLetters = await OfferLetter.find()
            .populate("company", "name serviceType")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: offerLetters });
    } catch (error) {
        console.error("Get Offer Letters Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching offer letters",
            error: error.message,
        });
    }
};

// ===== GET BY ID =====
const getOfferLetterById = async (req, res) => {
    try {
        const offerLetter = await OfferLetter.findById(req.params.id).populate(
            "company",
            "name serviceType"
        );

        if (!offerLetter) {
            return res.status(404).json({
                success: false,
                message: "Offer letter not found",
            });
        }

        res.status(200).json({ success: true, data: offerLetter });
    } catch (error) {
        console.error("Get Offer Letter Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching offer letter",
            error: error.message,
        });
    }
};

// ===== UPDATE =====
const updateOfferLetter = async (req, res) => {
    try {
        const {
            company,
            phone,
            email,
            website,
            address,
            existingSigntory,
        } = req.body;

        const updateData = { company, phone, email, website, address };

        // Handle new signature upload
        if (req.files?.signtory?.length > 0) {
            const uploadedSign = await uploadBufferToCloudinary(
                req.files.signtory[0].buffer,
                req.files.signtory[0].originalname,
                "image"
            );
            updateData.signtory = uploadedSign;
        } else if (existingSigntory) {
            updateData.signtory = existingSigntory;
        }

        const updatedOfferLetter = await OfferLetter.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedOfferLetter) {
            return res.status(404).json({
                success: false,
                message: "Offer letter not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Offer letter updated successfully",
            data: updatedOfferLetter,
        });
    } catch (error) {
        console.error("Update Offer Letter Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating offer letter",
            error: error.message,
        });
    }
};

// ===== DELETE =====
const deleteOfferLetter = async (req, res) => {
    try {
        const deletedOfferLetter = await OfferLetter.findByIdAndDelete(req.params.id);

        if (!deletedOfferLetter) {
            return res.status(404).json({
                success: false,
                message: "Offer letter not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Offer letter deleted successfully",
        });
    } catch (error) {
        console.error("Delete Offer Letter Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting offer letter",
            error: error.message,
        });
    }
};

module.exports = {
    createOfferLetter,
    generateOfferLetter,
    generateAndDownloadOfferLetter,
    getOfferLetters,
    getOfferLetterById,
    updateOfferLetter,
    deleteOfferLetter,
};
