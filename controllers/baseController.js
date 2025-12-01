const utilities = require("../utilities/");
const baseController = {};

/* ****************************************
 * Deliver home view
 * *************************************** */
baseController.buildHome = async function(req, res){
    const nav = await utilities.getNav();
    // Flash message included for assignment testing purposes
    req.flash("notice", "This is a flash message.") 
    res.render("index", {title: "Home", nav});
}

module.exports = baseController;