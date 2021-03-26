const { User } = require("../models/users");
const jwt = require("jsonwebtoken");

exports.isSuperAdmin = (req, res, next) => {
  let user = req.user;
  console.log(user);
  if (user.isSuperAdmin == true) {
    User.findByIdAndUpdate(
      { _id: req.params.user_Id },
      {
        isAdmin: true,
        isVerified:true
      },
      {
        new: true,
      },
      (err, admin) => {
        const payload = {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          isAdmin: admin.isAdmin,
          isSuperAdmin: admin.isSuperAdmin,
          isVerified: admin.isVerified,
        };
        const token = jwt.sign(payload, process.env.SECRET_TOKEN);

        admin.save();
        res.status(200).send(token);
      }
    );
  } else {
    return res.status(400).send("you are not permitted");
  }
};
