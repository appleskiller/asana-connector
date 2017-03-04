"use strict";
var express = require("express");
var router = express.Router();
router.post("/signin", function (req, res) {
    console.log(1);
});
router.get("/signout", function (req, res) {
    req.session.destroy(function (err) {
        res.redirect("/");
    });
});
module.exports = router;
//# sourceMappingURL=login.js.map