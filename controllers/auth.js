const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const dotenv = require("dotenv");
const moment = require("moment");
moment.locale("fr");
const mongoose = require("mongoose");

let limitPage = 1;

//models
const { User } = require("../models/users");
const { Posts } = require("../models/posts");
const { Category } = require("../models/catergory");
const { CodeConfirm, ramdomCode } = require("../models/code");
const { Comments } = require("../models/comments");
const Fawn = require("fawn");
const async = require("async");
const { sendCode } = require("./sendMail");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
//config Dotenv
dotenv.config({ path: "./config/config.env" });
//init fawn
Fawn.init(mongoose);

require("./sendMail");

exports.getSingUp = (req, res, next) => {
  res.status(200).send({
    title: "SignUp",
  });
};

exports.getLogIn = (req, res, next) => {
  res.status(200).send({
    title: "LogIn",
  });
};

exports.getForgetPassword = (req, res, next) => {
  res.status(200).send({
    user: req.user,
  });
};

exports.postSignUp = (req, res, next) => {
  const { name, username, password, email } = req.body;
  const schema = Joi.object().keys({
    username: Joi.string().min(3).max(50).required(),
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(5).max(255).required(),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).send(validation.error.details[0].message);
    return;
  }
  User.findOne({email})
    .then((user) => {
      if (user) {
        return res.status(400).send("Utilisateur existe déjà");
      } else {
        const newUser = new User({
          name,
          username,
          email,
          password,
          // isAdmin: true,
          // isSuperAdmin: true,
          // isVerified: false,
          createdAt: moment(Date.now()).format("LL"),
        });
        const newCode = new CodeConfirm({
          userId: newUser._id,
          code: ramdomCode,
        });
        sendCode(ramdomCode, newUser);
        //hash password
        bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            //here I just set password to hash
            newUser.password = hash;
            // here I save user
            try {
              new Fawn.Task()
                .save("users", newUser)
                .save("codes", newCode)
                .run();
              const payload = {
                _id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email,
                isAdmin: newUser.isAdmin,
                isSuperAdmin: newUser.isSuperAdmin,
                isVerified: newUser.isVerified,
              };
              const token = jwt.sign(payload, process.env.SECRET_TOKEN);
              return res.header("x-auth-token", token).send({ newUser, token });
            } catch (err) {
              return res
                .status(500)
                .send("Un problème est survenu au niveau du server");
            }
          })
        );
      }
    })
    .catch((err) => console.log(err));
};

exports.postLogin = (req, res, next) => {
  const { password, email } = req.body;
  const schema = Joi.object().keys({
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(5).max(255).required(),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).send(validation.error.details[0].message);
    return;
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) return res.status(400);
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;

        if (isMatch) {
          const payload = {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            isSuperAdmin: user.isSuperAdmin,
            isVerified: user.isVerified,
          };
          const token = jwt.sign(payload, process.env.SECRET_TOKEN);
          return res.header("x-auth-token", token).status(200).send(payload);
        } else {
          return res.status(401).send("email ou password incorrect ");
        }
      });
    })
    .catch((err) => console.log(err));
};

exports.postForgetPassword = (req, res, next) => {
  const { email } = req.body;
  async.waterfall(
    [
      (done) => {
        crypto.randomBytes(20, (err, buf) => {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      (token, done) => {
        User.findOne({ email }, (err, user) => {
          if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgot");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.SEND_MAIL_AUTH,
            pass: process.env.SEND_MAIL_PASSWORD,
          },
        });
        var mailOptions = {
          to: user.email,
          from: process.env.SEND_MAIL_AUTH,
          subject: "Esthy-Plume Restaurer le mot de passe",
          test:
            "the message" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "reset now.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return res.status(400).send(err);
    }
  );
};

exports.resetPassword = (req, res) => {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    (err, user) => {
      if (!user) {
        return res.status(400).send("l'utilisateur n'exist");
      }
      res.status(200).send({
        user: req.user,
      });
    }
  );
};
exports.editPorfil = async (req, res, next) => {
  const {
    name,
    username,
    lastName,
    entreprise,
    ville,
    country,
    postalCode,
    aboutMe,
    profilImage,
    password,
    email,
  } = req.body;
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(50),
    username: Joi.string().min(5).max(255),
    email: Joi.string().min(5).max(255).email(),
    password: Joi.string().min(5).max(255),
    lastName: Joi.string().min(5).max(255),
    entreprise: Joi.string().min(5).max(255),
    country: Joi.string().min(5).max(255),
    postalCode: Joi.number(),
    profilImage: Joi.string().min(5).max(255),
    aboutMe: Joi.string().min(5).max(255),
    ville: Joi.string().min(5).max(255),
  });
  const newUser = req.user;
  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).send(validation.error.details[0].message);
    return;
  }

  const user = await User.findById({ _id: newUser._id });
  if (!user) return res.status(400).send("enregistrez vous d'abord");

  User.findByIdAndUpdate(
    newUser._id,
    {
      name: name,
      username: username,
      email: email,
      password: password,
      lastName: lastName,
      entreprise: entreprise,
      country: country,
      postalCode: postalCode,
      profilImage: profilImage,
      aboutMe: aboutMe,
      ville: ville,
    },
    {
      new: true,
    },
    (err, user) => {
      const payload = {
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        lastName: newUser.lastName,
        entreprise: newUser.entreprise,
        country: newUser.country,
        postalCode: newUser.postalCode,
        profilImage: newUser.profilImage,
        aboutMe: newUser.aboutMe,
        ville: newUser.ville,
        isAdmin: newUser.isAdmin,
        isSuperAdmin: newUser.isSuperAdmin,
        isVerified: newUser.isVerified,
      };
      const token = jwt.sign(payload, process.env.SECRET_TOKEN);
      user.save();
      if (err) return res.status(400).send("rien n'a été modifié ");
      res.status(200).send({
        user,
        token,
      });
    }
  );
};

exports.deleteUser = (req, res, next) => {};

exports.postCategory = (req, res, next) => {
  const { name } = req.body;
  console.log(req.body);
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(50).required(),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).send(validation.error.details[0].message);
    return;
  }
  User.findOne({ name: name })
    .then((category) => {
      if (category) {
        return res.status(400).send("categorie existe déjà");
      } else {
        const newCategory = new Category({
          name,
        });
        newCategory
          .save()
          .then((category) => {
            res.status(200).send(category);
          })
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));
};

exports.postPosts = async (req, res, next) => {
  const { title, imagesUrl, body, categoryId } = req.body;
  const schema = Joi.object().keys({
    title: Joi.string().min(3).max(50).required(),
    imagesUrl: Joi.string().required(),
    body: Joi.string().required(),
    categoryId: Joi.string().required(),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).send(validation.error.details[0].message);
    return;
  }
  const auth = await User.findById(req.user._id);
  if (!auth) return res.status(400).send("L'utilisateur n'existe pas");

  const category = await Category.findById(categoryId);
  if (!category) return res.status(400).send("La categorie n'existe pas");

  let newPost = new Posts({
    title,
    imagesUrl,
    body,
    auth: {
      _id: auth._id,
      name: auth.name,
    },
    category: {
      _id: category._id,
      name: category.name,
    },
    postedAt: moment(Date.now()).format("LLLL"),
  });
  try {
    new Fawn.Task().save("posts", newPost).run();
    res.status(200).send(newPost);
  } catch (err) {
    res.status(500).send("Un problème est survenu au niveau du server");
  }
};

exports.getAllUsers = async (req, res, next) => {
  const users = await User.find();
  if (users) {
    users.sort( (a, b)=> {
      const titleA = a.name.toLowerCase();
      const titleB = b.name.toLowerCase();
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      if (titleA === titleB) return 0;
    });
    res.send(users);
  } else {
    return res.status(400);
  }
};

exports.getAllPosts = async (req, res, next) => {
  const posts = await Posts.find()
    .limit(limitPage)
    .sort([["_id", -1]]);
  if (posts) {
    posts.sort(function (a, b) {
      const dateA = a.postedAt;
      const dateB = b.postedAt;
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });
    limitPage = limitPage + 1;
    res.send(posts);
  } else {
    return res.status(400);
  }
};

exports.getAllPosts2 = async (req, res, next) => {
  const posts = await Posts.find();
  if (posts) {
    res.send(posts).status(200);
  } else {
        return res.status(400).send("error");
  }
};

exports.getAllPostsByCategory = async (req, res, next) => {
  const { categoryId } = req.body;
  Posts.find({
    "category._id": categoryId,}
 , function (err,data) {
    if (err) {
        err.status = 406;
        return next(err);
    }
    return res.status(200).send(data)
})
};

exports.getAllCategories = async (req, res, next) => {
  let category = await Category.find();
  if (Category) {
    res.status(200).send(category);
  } else {
    res.status(400).send("no category");
  }
};
/* exports.readMore = async (req, res, next) => {
  const posts = await Posts.find()
    .limit(limitPage)
    .sort([["_id", -1]]);
  if (posts) {
    limitPage += limitPage;
    res.send(posts);
  } else {
    return res.status(400).send("Find de touts les posts");
  }
}; */

//POST COMMENT

exports.postComments = async (req, res, next) => {
  const { comment } = req.body;

  const schema = Joi.object().keys({
    comment: Joi.string().required(),
  });
  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).send(validation.error.details[0].message);
    return;
  }

  const user = await User.findById({ _id: req.user._id });

  if (!user) return res.status(400).send("L'utilisateur n'existe pas");
  const post = await Posts.findById({ _id: req.params.post_Id });
  if (!post) return res.status(400).send("Le post n'existe pas");

  const newComment = new Comments({
    user: {
      _id: user._id,
      name: user.name,
    },
    post: {
      _id: post._id,
      title: post.title,
    },
    comment,
    commentedAt: moment(Date.now()).format("LLLL"),
  });

  try {
    new Fawn.Task().save("comments", newComment).run();
    res.status(200).send(newComment);
  } catch (err) {
    res.status(500);
  }
};

exports.getAllCommentByPost = async (req, res, next) => {
  const comment = await Comments.find()
    .where("post._id")
    .equals(req.params.post_Id);
  if (comment) {
    res.send(comment);
  } else {
    return res.status(400);
  }
};

exports.findPostBySearch = async (req, res, next) => {
  const { title } = req.query;
  const search = title.toLowerCase();
  const posts = await Posts.find();
  let filtered = posts.filter((post) => post.title.includes(search));
  if (filtered) return res.status(200).send(filtered);
  res.status(400);
};

exports.getOnePost = (req, res, next) => {
  Posts.findById({ _id: req.params.post_Id })
    .then((post) => {
      //    const countComment = Comment.find({_id:Comment.post._id})
      // console.log(post.category._id);

      res.status(200).send({
        post,
        // countComment
      });
    })
    .catch((err) => res.status(400).send("Le post n'existe pas"));
};

exports.editPost = async (req, res, next) => {
  const { title, imagesUrl, body, categoryId, authId } = req.body;
  const schema = Joi.object().keys({
    title: Joi.string().min(3).max(50).required(),
    imagesUrl: Joi.string().required(),
    body: Joi.string().required(),
    authId: Joi.string().required(),
    categoryId: Joi.string().required(),
  });

  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).send(validation.error.details[0].message);
    return;
  }
  const auth = await User.findById(authId);
  if (!auth) return res.status(400).send("L'utilisateur n'existe pas");
  const category = await Category.findById(categoryId);
  if (!category) return res.status(400).send("La categorie n'existe pas");

  Posts.findByIdAndUpdate(
    { _id: req.params.post_Id },
    { title: title, body: body, imagesUrl: imagesUrl },
    {
      new: true,
      upsert: true,
    },
    function (err, post) {
      if (err) {
        res.status(400).send(err);
      }
      res.status(200).send(post);
    }
  );
};

exports.deletePost = (req, res, next) => {
  Posts.deleteOne({ _id: req.params.post_Id })
    .then(() => {
      res.status(200).send({
        user: req.user,
      });
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.deleteComment = (req, res, next) => {
  Comments.deleteOne({ _id: req.params.comment_Id })
    .then(() => {
      res.status(200).send({
        user: req.user,
      });
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

//is Admin middleware


exports.isVerified = async (req, res, next) => {
  const { code } = req.body;
  const  user  = req.user
  console.log(user.isAdmin);
  const schema = Joi.object().keys({
    code: Joi.required(),
  });
  const validation = schema.validate(req.body);
  if (validation.error) {
    res.status(400).send(validation.error.details[0].message);
    return;
  }
  let userCode = await CodeConfirm.findOne({ userId: user._id });

  if (!userCode) return res.status(400).send("le code n'a pas été envoi");

  const currentUser = User.findOne({ userId: user._id });
  if (!currentUser) return res.status(400).send("l'utlisateur n'existe pas");
  if (userCode.code === code) {
    User.findByIdAndUpdate(
      user._id,
      {
        isVerified: true,
      },
      {
        new: true,
      },
      (err, verifiedUser) => {
        const payload = {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
          isVerified: user.isVerified,
        };
        const token = jwt.sign(payload, process.env.SECRET_TOKEN);

        verifiedUser.save();
        if (err) return res.status(400).send("code invalide");
        res.status(200).send(verifiedUser);
        next();
      }
    );
  }
};
