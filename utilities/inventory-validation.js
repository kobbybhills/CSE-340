const utilities = require(".")
const { body, validationResult } = require("express-validator")
const validate = {}
const inventoryModel = require("../models/inventory-model")

/* **********************************
 * Classification Data Validation Rules
 * ********************************* */
validate.classificationRules = () => {
  return [
    // classification_name is required and must be a string
    body("classification_name")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please provide a classification name.")
      .custom(async (classification_name) => {
        const classificationExists = await inventoryModel.checkExistingClassification(classification_name)
        if (classificationExists){
          throw new Error("Classification already exists. Please choose a different name.")
        }
      })
      .matches(/^[A-Za-z0-9]+$/) // Only allows letters and numbers (no spaces or special characters)
      .withMessage("Classification name must contain only letters and numbers and cannot have spaces.")
  ]
}

/* **********************************
 * Check classification data and return errors or continue to add classification
 * ********************************* */
validate.checkClassificationData = async (req, res, next) => {
  const { classification_name } = req.body
  let errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("./inventory/add-classification", {
      errors: errors.array(),
      title: "Add New Classification",
      nav,
      messages: req.flash(),
      classification_name, // Make classification_name sticky
    })
    return
  }
  next()
}

/* **********************************
 * Inventory Data Validation Rules (Add/Update Vehicle)
 * ********************************* */
validate.inventoryRules = () => {
  return [
    // inv_make is required and must be a string
    body("inv_make")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Make must be at least 3 characters."),

    // inv_model is required and must be a string
    body("inv_model")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Model must be at least 3 characters."),

    // inv_description is required
    body("inv_description")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Description is required."),

    // inv_image must be a valid file path
    body("inv_image")
      .trim()
      .matches(/^\/images\/vehicles\/.+\.(png|jpe?g)$/i)
      .withMessage("Image URL must be a valid path (e.g., /images/vehicles/file.jpg)."),

    // inv_thumbnail must be a valid file path
    body("inv_thumbnail")
      .trim()
      .matches(/^\/images\/vehicles\/.+-(tn)\.(png|jpe?g)$/i)
      .withMessage("Thumbnail URL must be a valid path (e.g., /images/vehicles/file-tn.jpg)."),

    // inv_price must be a positive number
    body("inv_price")
      .trim()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number and cannot be empty."),

    // inv_year must be a 4-digit year
    body("inv_year")
      .trim()
      .isLength({ min: 4, max: 4 })
      .withMessage("Year must be a 4-digit number.")
      .isInt()
      .withMessage("Year must be a number."),

    // inv_miles must be a positive integer
    body("inv_miles")
      .trim()
      .isInt({ min: 0 })
      .withMessage("Mileage must be a positive whole number."),

    // inv_color is required
    body("inv_color")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Color is required."),

    // classification_id is required and must be an integer
    body("classification_id")
      .trim()
      .isInt({ min: 1 })
      .withMessage("Classification is required."),
  ]
}


/* **********************************
 * Check inventory data and return errors or continue to add inventory
 * Used for ADD NEW INVENTORY
 * ********************************* */
validate.checkInventoryData = async (req, res, next) => {
  const { classification_id, inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color } = req.body
  let errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    let classificationList = await utilities.buildClassificationList(classification_id)
    res.render("./inventory/add-inventory", {
      errors: errors.array(),
      title: "Add New Vehicle",
      nav,
      messages: req.flash(),
      // Make all fields sticky
      classificationList,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
    })
    return
  }
  next()
}

/* **********************************
 * Check update data and return errors or continue to update inventory
 * Used for UPDATE EXISTING INVENTORY
 * ********************************* */
validate.checkUpdateData = async (req, res, next) => {
  const { classification_id, inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, inv_id } = req.body
  let errors = validationResult(req)
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    let classificationList = await utilities.buildClassificationList(classification_id)
    const itemName = `${inv_make} ${inv_model}`
    res.render("./inventory/edit-inventory", {
      errors: errors.array(),
      title: "Edit " + itemName,
      nav,
      messages: req.flash(),
      // Make all fields sticky
      classificationList: classificationList,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      inv_id,
    })
    return
  }
  next()
}

module.exports = validate