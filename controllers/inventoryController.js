const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")
const { validationResult } = require("express-validator")

const invCont = {}

/* ***************************
 * Build inventory by classification view (Existing)
 * *************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  let nav = await utilities.getNav()

  // CRITICAL FIX: Check if data is empty before accessing data[0]
  if (!data || data.length === 0) {
    // Fetch all classifications to validate the classification ID
    const classificationData = await invModel.getClassifications()
    const className = classificationData.rows.find(
      (c) => c.classification_id == classification_id
    )?.classification_name

    // If classification is invalid or no name found
    if (!className) {
      next({ status: 404, message: "Sorry, that classification was not found." })
      return
    }

    const grid =
      '<p class="notice">Sorry, no vehicles could be found for this classification.</p>'

    res.render("./inventory/classification", {
      title: `${className} vehicles`,
      nav,
      grid,
    })
    return
  }

  // Normal successful load
  const grid = await utilities.buildClassificationGrid(data)
  const className = data[0].classification_name

  res.render("./inventory/classification", {
    title: `${className} vehicles`,
    nav,
    grid,
  })
}

/* ***************************
 * Build vehicle detail view (Existing)
 * *************************** */
invCont.buildDetail = async function (req, res) {
  // Route parameter is :inv_id, so we use req.params.inv_id
  const invId = req.params.inv_id 
  const vehicle = await invModel.getInventoryById(invId)
  
  // CRITICAL: Check if vehicle data was found before continuing
  if (!vehicle) {
    const nav = await utilities.getNav()
    res.render("errors/error", {
      title: "Vehicle Not Found",
      message: "Sorry, the vehicle you requested does not exist.",
      nav
    });
    return;
  }
  
  // FIX APPLIED HERE: Variable name changed to match the EJS view: detailViewHTML
  const detailViewHTML = await utilities.buildSingleVehicleDisplay(vehicle)
  let nav = await utilities.getNav()

  const vehicleTitle = `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`

  res.render("./inventory/detail", {
    title: vehicleTitle,
    nav,
    detailViewHTML, // Pass the corrected variable name
  })
}

/* ****************************************
 * Process intentional error (Existing)
 * **************************************** */
invCont.throwError = async function (req, res) {
  throw new Error("I am an intentional error")
}

/* ============================
 *   NEW FUNCTIONS (Assignment 4 & 5)
 * ============================ */

/* ***************************
 * Build the inventory management view (Task 1)
 * URL: /inv
 * *************************** */
invCont.buildManagement = async function (req, res) {
  const nav = await utilities.getNav()
  const classificationList = await utilities.buildClassificationList()

  res.render("inventory/management", {
    title: "Inventory Management",
    nav,
    errors: null,
    classificationList,
  })
}

/* ***************************
 * Build the add classification view (Task 2 - Delivery)
 * URL: /inv/add-classification
 * *************************** */
invCont.buildAddClassification = async function (req, res) {
  const nav = await utilities.getNav()

  res.render("inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: null,
    classification_name: null,
  })
}

/* ***************************
 * Process New Classification (Task 2 - Processing)
 * *************************** */
invCont.processNewClassification = async function (req, res) {
  const nav = await utilities.getNav()
  const { classification_name } = req.body
  const errors = res.locals.errors

  if (errors) {
    return res.render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors,
      classification_name,
    })
  }

  const result = await invModel.addClassification(classification_name)

  if (result) {
    req.flash(
      "notice",
      `The new classification "${classification_name}" was successfully added.`
    )
    return res.redirect("/inv/")
  }

  req.flash("notice", "Sorry, adding the classification failed.")
  res.status(501).render("inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: null,
    classification_name,
  })
}

/* ***************************
 * Build the add inventory view (Task 3 - Delivery)
 * URL: /inv/add-inventory
 * *************************** */
invCont.buildAddInventory = async function (req, res) {
  const nav = await utilities.getNav()
  const classificationList = await utilities.buildClassificationList()

  res.render("inventory/add-inventory", {
    title: "Add New Vehicle",
    nav,
    classificationList,
    errors: null,

    // Sticky initial fields
    inv_make: null,
    inv_model: null,
    inv_year: null,
    inv_description: null,
    inv_image: "/images/vehicles/no-image.png",
    inv_thumbnail: "/images/vehicles/no-image-tn.png",
    inv_price: null,
    inv_miles: null,
    inv_color: null,
  })
}

/* ****************************************
 * Process New Inventory (Task 3 - Processing)
 * **************************************** */
invCont.processNewInventory = async function (req, res) {
  const nav = await utilities.getNav()

  const {
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id,
  } = req.body

  const errors = res.locals.errors
  const classificationList = await utilities.buildClassificationList(
    classification_id
  )

  // Validation failed
  if (errors) {
    return res.render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,
      errors,

      // Sticky fields
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
    })
  }

  const result = await invModel.addInventory(
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id
  )

  if (result) {
    req.flash(
      "notice",
      `The new vehicle ${inv_make} ${inv_model} was successfully added.`
    )
    return res.redirect("/inv/")
  }

  // Database failure
  req.flash("notice", "Sorry, adding the vehicle failed.")
  res.status(501).render("inventory/add-inventory", {
    title: "Add New Vehicle",
    nav,
    classificationList,
    errors: null,

    // Sticky on failure
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id,
  })
}

/* ***************************
 * Build Edit Inventory View (Task 4 - Delivery)
 * URL: /inv/edit/:invId
 * ************************** */
invCont.buildEditView = async function (req, res, next) {
    const inv_id = parseInt(req.params.invId);
    const nav = await utilities.getNav();
    
    // Fetch vehicle data
    const vehicleData = await invModel.getInventoryById(inv_id);
    
    if (!vehicleData) {
        // Handle case where ID is invalid
        req.flash("notice", "Vehicle not found.");
        return res.redirect("/inv/");
    }

    // Build classification list, pre-selecting the vehicle's current classification
    const classificationSelect = await utilities.buildClassificationList(
        vehicleData.classification_id
    );
    
    // Format price for display
    const inv_price = parseFloat(vehicleData.inv_price).toFixed(2);
    const itemName = `${vehicleData.inv_make} ${vehicleData.inv_model}`;
    
    res.render("inventory/edit", { // Renamed view to 'edit' assuming this is the correct EJS file
        title: "Edit " + itemName,
        nav,
        classificationSelect: classificationSelect,
        errors: null,
        // Pass all database fields to the view for sticky data
        inv_id: vehicleData.inv_id,
        inv_make: vehicleData.inv_make,
        inv_model: vehicleData.inv_model,
        inv_year: vehicleData.inv_year,
        inv_description: vehicleData.inv_description,
        inv_image: vehicleData.inv_image,
        inv_thumbnail: vehicleData.inv_thumbnail,
        inv_price: inv_price,
        inv_miles: vehicleData.inv_miles,
        inv_color: vehicleData.inv_color,
        classification_id: vehicleData.classification_id, // Added classification_id for sticky select
    });
};

/* ***************************
 * Process the update inventory data (Task 4 - Processing)
 * ************************** */
invCont.processUpdateInventory = async function (req, res) {
    const nav = await utilities.getNav();
    const { 
        inv_id, inv_make, inv_model, inv_year, inv_description, inv_image,
        inv_thumbnail, inv_price, inv_miles, inv_color, classification_id 
    } = req.body;

    const errors = res.locals.errors; // Use res.locals.errors after validation middleware
    
    // Convert inv_price and inv_year to correct data types if necessary before passing to model
    const numeric_inv_price = parseFloat(inv_price);
    const numeric_inv_year = parseInt(inv_year);

    if (errors && errors.length > 0) {
        const classificationSelect = await utilities.buildClassificationList(classification_id);
        const itemName = `${inv_make} ${inv_model}`;

        req.flash("notice", "Please fix errors below to update vehicle.");
        // Re-render the edit view with sticky data and errors
        return res.render("inventory/edit", { // Renamed view to 'edit'
            title: "Edit " + itemName,
            nav,
            classificationSelect,
            errors,
            // Pass all body data back for stickiness
            inv_make, inv_model, inv_year, inv_description, inv_image,
            inv_thumbnail, inv_price, inv_miles, inv_color, inv_id, classification_id
        });
    }

    const updateResult = await invModel.updateInventory(
        inv_id, inv_make, inv_model, numeric_inv_year, inv_description, inv_image,
        inv_thumbnail, numeric_inv_price, inv_miles, inv_color, classification_id
    );

    if (updateResult) {
        const itemName = `${updateResult.inv_make} ${updateResult.inv_model}`;
        req.flash("notice", `The ${itemName} was successfully updated.`);
        // Redirect back to management view
        res.redirect("/inv/");
    } else {
        const classificationSelect = await utilities.buildClassificationList(classification_id);
        const itemName = `${inv_make} ${inv_model}`;
        req.flash("notice", "Sorry, the update failed.");
        // Re-render on failure
        res.status(501).render("inventory/edit", { // Renamed view to 'edit'
            title: "Edit " + itemName,
            nav,
            classificationSelect,
            errors: null,
            // Pass all body data back for stickiness
            inv_make, inv_model, inv_year, inv_description, inv_image,
            inv_thumbnail, inv_price, inv_miles, inv_color, inv_id, classification_id
        });
    }
};

/* ***************************
 * Build the Delete Confirmation view (Task 5 - Delivery)
 * URL: /inv/delete/:invId
 * ************************** */
invCont.buildDeleteView = async function (req, res, next) {
    const inv_id = parseInt(req.params.invId);
    const nav = await utilities.getNav();
    const vehicleData = await invModel.getInventoryById(inv_id);
    
    if (!vehicleData) {
        req.flash("notice", "Vehicle not found.");
        return res.redirect("/inv/");
    }

    const itemName = `${vehicleData.inv_make} ${vehicleData.inv_model}`;
    
    res.render("inventory/delete-confirm", {
        title: "Delete " + itemName,
        nav,
        errors: null,
        inv_id: vehicleData.inv_id,
        inv_make: vehicleData.inv_make,
        inv_model: vehicleData.inv_model,
        inv_year: vehicleData.inv_year,
        inv_price: new Intl.NumberFormat('en-US').format(vehicleData.inv_price),
    });
};

/* ***************************
 * Process the delete operation (Task 5 - Processing)
 * ************************** */
invCont.processDeleteInventory = async function (req, res) {
    const { inv_id, inv_make, inv_model } = req.body;
    
    // Note: No validation is typically needed for a simple delete operation
    const deleteResult = await invModel.deleteInventory(inv_id);

    if (deleteResult) {
        const itemName = `${inv_make} ${inv_model}`;
        req.flash("notice", `The ${itemName} was successfully deleted.`);
        res.redirect("/inv/");
    } else {
        req.flash("notice", "Sorry, the deletion failed.");
        res.redirect("/inv/");
    }
};


/* ***************************
 * Return Inventory by Classification As JSON (For AJAX request)
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  const classification_id = parseInt(req.params.classification_id)
  const invData = await invModel.getInventoryByClassificationId(classification_id)
  
  // Check if data was returned and has at least one inventory item
  if (invData.length > 0) {
    return res.json(invData)
  } else {
    // Return an empty array or 404 if no data
    return res.status(404).json({ error: "No inventory data returned" })
  }
}


module.exports = invCont