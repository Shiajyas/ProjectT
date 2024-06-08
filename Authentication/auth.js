const User = require("../models/userSchema");

const isLogged = (req, res, next) => {
    console.log(req.session.user,">>>>>>>>>>>>>isLoged")
    if (req.session.user) {

       
        User.findById(req.session.user).lean()
            .then((data) => {
                if (data && data.isBlocked === false) {
                    next();
                } else {
                    res.redirect("/login");
                }
            })
            .catch((error) => {
                console.error("Error in isLogged middleware:", error);
                res.status(500).send("Internal Server Error");
            });
    } else {
        res.redirect("/login");
    }
};

const isAdmin = (req, res, next) => {
    if (req.session.admin) {
        User.findOne({ isAdmin: "1" }).lean()
            .then((data) => {
                if (data) {
                    next();
                } else {
                    res.redirect("/admin/login");
                }
            })
            .catch((error) => {
                console.error("Error in isAdmin middleware:", error);
                res.status(500).send("Internal Server Error");
            });
    } else {
        res.redirect("/admin/login");
    }
};

const disableCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
};

module.exports = {
    isLogged,
    isAdmin,
    disableCache
};
