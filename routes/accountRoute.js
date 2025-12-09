// routes/accountRoute.js
const express = require("express");
const router = new express.Router();

const accountController = require("../controllers/accountController");
const utilities = require("../utilities");
const accountValidate = require("../utilities/account-validation");

// ===============================
//  Deliver Login View
// ===============================
router.get(
    "/login",
    utilities.handleErrors(accountController.buildLogin)
);

// ===============================
//  Deliver Registration View
// ===============================
router.get(
    "/register",
    utilities.handleErrors(accountController.buildRegister)
);

// ===============================
//  Process Registration Data
// ===============================
router.post(
    "/register",
    accountValidate.registrationRules(),
    accountValidate.checkRegData,
    utilities.handleErrors(accountController.registerAccount)
);

// ===============================
//  Process Login Data
// ===============================
router.post(
    "/login",
    accountValidate.loginRules(),
    accountValidate.checkLoginData,
    utilities.handleErrors(accountController.accountLogin)
);

// ===============================
//  Process Logout (Task 7)
// ===============================
router.get(
    "/logout",
    utilities.handleErrors(accountController.accountLogout)
);

// ===============================
//  Account Management View (Task 3)
//  Requires Authentication
// ===============================
router.get(
    "/",
    utilities.checkLogin,
    utilities.handleErrors(accountController.buildManagement)
);

// ===============================
//  Update Account View (Task 4)
//  NOTE: Changed to use a simple path for the logged-in user (no :account_id needed)
//  The account ID is available via res.locals.accountData from the JWT.
// ===============================
router.get(
    "/update", // <-- Simplified path for the logged-in user
    utilities.checkLogin,
    utilities.handleErrors(accountController.buildUpdateView)
);

// ===============================
//  Process Account Info Update (Task 5)
//  FIXED PATH: Using the unique '/update-info' path
// ===============================
router.post(
    "/update-info", // <-- Unique path
    utilities.checkLogin,
    accountValidate.accountUpdateRules(),
    accountValidate.checkAccountUpdateData,
    utilities.handleErrors(accountController.updateAccountInfo)
);

// ===============================
//  Process Password Update (Task 5)
//  FIXED PATH: Using the unique '/update-password' path
// ===============================
router.post(
    "/update-password", // <-- Unique path
    utilities.checkLogin,
    accountValidate.passwordUpdateRules(),
    accountValidate.checkPasswordUpdateData,
    utilities.handleErrors(accountController.updatePassword)
);

// ===============================
//  Export the Router
// ===============================
module.exports = router;