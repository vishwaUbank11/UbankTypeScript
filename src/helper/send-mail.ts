import nodemailer from 'nodemailer';
import path from 'path';
import ejs from 'ejs';

let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: "mark@ubankconnect.com",
    pass: "ziczkpuzpyyemklv",
  },
});

let renderTemplate = (data: any, relativePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    ejs.renderFile(
      path.join(__dirname, "../views", `${relativePath}.ejs`),
      data,
      (err, template) => {
        if (err) {
          console.log("Error in rendering template", err);
          return reject(err);
        }
        resolve(template);
      }
    );
  });
};

export const sendMail = async (data: { email: string; subject: string; mobile_no: string; name: string; usercode: string; Password: string }, file: string) => {
  try {
    const htmlString = await renderTemplate(data, file);

    await transporter.sendMail({
      from: '"Ubankconnect" <mark@ubankconnect.com>',
      to: data.email,
      subject: data.subject,
      html: htmlString,
    });

    console.log("Message sent successfully to", data.email);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};
