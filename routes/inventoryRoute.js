// Needed Resources 
const express = require("express")
const router = new express.Router() 
const inventoryController = require("../controllers/inventoryController")
const utilities = require("../utilities")
// Import the validation file
const inventoryValidate = require("../utilities/inventory-validation") 

/* ************************************
 * Route to build the Inventory Management view (Task 1)
 * URL: /inv/
 * ************************************ */
router.get(
    "/", 
    utilities.checkLogin, 
    utilities.checkAuthorization, // <-- CRITICAL FIX: Only Admin/Employee can access
    utilities.handleErrors(inventoryController.buildManagement)
)


/* ************************************
 * Route to deliver inventory data as JSON for AJAX (THE MISSING ROUTE)
 * URL: /inv/getInventory/:classification_id
 * ************************************ */
router.get(
    "/getInventory/:classification_id",
    utilities.handleErrors(inventoryController.getInventoryJSON)
);


/* ************************************
 * Route to build Add Classification views/process (Task 2)
 * URL: /inv/add-classification
 * ************************************ */
// GET: Route to deliver the Add Classification view
router.get(
    "/add-classification", 
    utilities.checkLogin, 
    utilities.checkAuthorization, // <-- SECURED
    utilities.handleErrors(inventoryController.buildAddClassification)
)

// POST: Route to handle the new classification submission
router.post(
    "/add-classification",
    utilities.checkLogin, 
    utilities.checkAuthorization, // <-- SECURED
    inventoryValidate.classificationRules(), // Server-side validation
    inventoryValidate.checkClassificationData, // Check validation results (reloads form on error)
    utilities.handleErrors(inventoryController.processNewClassification)
)


/* ************************************
 * Route to build Add Inventory views/process (Task 3)
 * URL: /inv/add-inventory
 * ************************************ */
// GET: Route to deliver the Add Inventory view
router.get(
    "/add-inventory", 
    utilities.checkLogin, 
    utilities.checkAuthorization, // <-- SECURED
    utilities.handleErrors(inventoryController.buildAddInventory)
)

// POST: Route to handle the new inventory item submission
router.post(
    "/add-inventory",
    utilities.checkLogin, 
    utilities.checkAuthorization, // <-- SECURED
    inventoryValidate.inventoryRules(), // Server-side validation
    inventoryValidate.checkInventoryData, // Check validation results (reloads form on error)
    utilities.handleErrors(inventoryController.processNewInventory)
)


/* ************************************
 * Route to build Edit Inventory views/process (Task 4)
 * URL: /inv/edit/:invId, /inv/update-inventory
 * ************************************ */
// GET: Route to deliver the Edit Inventory view
router.get(
    "/edit/:invId", 
    utilities.checkLogin, 
    utilities.checkAuthorization, // <-- SECURED
    utilities.handleErrors(inventoryController.buildEditView)
);

// POST: Route to handle the updated inventory item submission
router.post(
    "/update", // The controller expects "/update" or the form action must match
    utilities.checkLogin, 
    utilities.checkAuthorization, // <-- SECURED
    inventoryValidate.inventoryRules(), // Validation rules
    inventoryValidate.checkUpdateData,         // Check validation results
    utilities.handleErrors(inventoryController.processUpdateInventory)
);


/* ************************************
 * Route to build Delete Confirmation views/process (Task 5)
 * URL: /inv/delete/:invId, /inv/delete
 * ************************************ */
// GET: Route to build the Delete Confirmation view
router.get(
    "/delete/:invId",
    utilities.checkLogin, 
    utilities.checkAuthorization, // <-- SECURED
    utilities.handleErrors(inventoryController.buildDeleteView)
);

// POST: Route to process the deletion
router.post(
    "/delete",
    utilities.checkLogin, 
    utilities.checkAuthorization, // <-- SECURED
    utilities.handleErrors(inventoryController.processDeleteInventory)
);


/* ****************************************
 * Route to build inventory by classification view (Existing)
 * **************************************** */
router.get("/type/:classificationId", utilities.handleErrors(inventoryController.buildByClassificationId));


/* ****************************************
 * Route to build vehicle detail view (Existing)
 * **************************************** */
router.get("/detail/:inv_id", 
utilities.handleErrors(inventoryController.buildDetail))

/* ****************************************
 * Error Route (Existing)
 * **************************************** */
router.get(
    "/broken",
    utilities.handleErrors(inventoryController.throwError)
)

module.exports = router;