const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

exports.sendCode = (code, user) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SEND_MAIL_AUTH,
      pass: process.env.SEND_MAIL_PASSWORD,
    },
  });

  var mailOptions = {
    from: process.env.SEND_MAIL_AUTH,
    to: user.email,
    subject:
      "Code de verification pour la creation de votre compte sur le site Esthyplume.",
    html: `<h2>Welcome ${user.name}!</h2>
            <h3>L'equipe Esthyplume vous souhaite la bienvenu!</h3>
            <p>Vous y êtes presque pour finaliser la creation de votre compte.</h2>
            <p>Veuillez juster entrer ce code de vérification sur la page concernée depuis notre siteweb.</h2>
            <h2><strong>CODE: ${code}</strong></h2>
            <p>Merci.</p>
            `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
