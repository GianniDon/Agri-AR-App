const express = require("express");
const router = express.Router();
const {createUser, loginUser, verifyEmail, updatePassword} = require("../controller/userController.js")

router.post('/register', createUser);


router.post('/login', loginUser);





router.post('/verify-email', verifyEmail)


router.post('/update-password', updatePassword)
module.exports = router;