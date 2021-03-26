// const express = require("express");
// const router = express.Router();
// const authUser = require("../controllers/auth");
// const authToken = require("../middlewares/auth");

// //get request
// router.get("/signup", authUser.getSingUp);
// router.get("/login", authUser.getLogIn);
// router.get("/posts", authUser.getAllPosts);
// router.get("/:post_Id", authUser.getOnePost);
// router.get("/search", authUser.findPostBySearch);
// router.get("/otherposts", authUser.readMore);

// //posts request
// router.post("/signup", authUser.postSignUp);
// router.post("/login", authUser.postLogin);
// router.post("/:post_Id", authToken.verifyToken, authUser.postComment);
// router.post("/postcategory", authUser.getAllPostsByCategory);
// router.post("/verification", authToken.verifyToken, authUser.isVerfied);

// module.exports = router;
