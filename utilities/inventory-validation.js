const { body, validationResult } = require("express-validator");
const utilities = require("./index");
const validate = {};

/* *********************************
 * Classification Name Validation Rules
 * ********************************* */
validate.classificationRules = () => {
    return [
        body("classification_name")
            .trim()
            .escape()
            .notEmpty()
            .isAlphanumeric()
            .withMessage("Classification name must be alphanumeric with no spaces")
            .isLength({ min: 1 })
            .withMessage("Please provide a classification name.")
    ]
}

/* *********************************
 * Check Classification Data and return errors or continue
 * ********************************* */
validate.checkClassificationData = async (req, res, next) => {
    const { classification_name } = req.body;
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav();
        res.render("inventory/add-classification", {
            title: "Add Classification",
            nav,
            errors: errors.array(),
            classification_name,
        });
        return;
    }
    next();
}

/* *********************************
 * Inventory Data Validation Rules
 * ********************************* */
validate.inventoryRules = () => {
    return [
        body("classification_id")
            .notEmpty()
            .withMessage("Classification is required"),
            
        body("inv_make")
            .trim()
            .escape()
            .notEmpty()
            .isLength({ min: 3 })
            .withMessage("Make must be at least 3 characters"),
            
        body("inv_model")
            .trim()
            .escape()
            .notEmpty()
            .isLength({ min: 3 })
            .withMessage("Model must be at least 3 characters"),
            
        body("inv_year")
            .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
            .withMessage("Please enter a valid year"),
            
        body("inv_description")
            .trim()
            .escape()
            .notEmpty()
            .withMessage("Description is required"),
            
        body("inv_price")
            .isFloat({ min: 0 })
            .withMessage("Price must be a positive number"),
            
        body("inv_miles")
            .isInt({ min: 0 })
            .withMessage("Miles must be a positive number"),
            
        body("inv_color")
            .trim()
            .escape()
            .notEmpty()
            .withMessage("Color is required")
    ]
}

/* *********************************
 * Check Inventory Data and return errors or continue
 * ********************************* */
validate.checkInventoryData = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav();
        // NOTE: classificationList depends on your utilities, ensure it is available
        let classificationList = await utilities.buildClassificationList(req.body.classification_id); 
        res.render("inventory/add-inventory", {
            title: "Add Inventory",
            nav,
            classificationList,
            errors: errors.array(),
            ...req.body
        });
        return;
    }
    next();
}

/* *********************************
 * Check Update Data and return errors or continue
 * Used specifically for the /inv/update POST route
 * ********************************* */
validate.checkUpdateData = async (req, res, next) => {
    const { 
        inv_id, classification_id, inv_make, inv_model, inv_year, 
        inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color 
    } = req.body;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav();
        // The classification list needs to be built with the user's selected value for display
        let classificationList = await utilities.buildClassificationList(classification_id); 
        const itemName = `${inv_make} ${inv_model}`;

        req.flash("notice", "Please fix the errors below.");

        res.render("inventory/edit-inventory", {
            title: "Edit " + itemName,
            nav,
            classificationList,
            errors: errors.array(),
            // Pass back all submitted data for form retention
            inv_id, inv_make, inv_model, inv_year, inv_description,
            inv_image, inv_thumbnail, inv_price, inv_miles,
            inv_color, classification_id
        });
        return;
    }
    next();
}


module.exports = validate;