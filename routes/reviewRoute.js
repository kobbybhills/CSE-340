// routes/reviewRoute.js

const express = require("express");
const router = express.Router();
const utilities = require("../utilities/"); 
const reviewController = require("../controllers/reviewController");
const reviewValidate = require("../validators/reviewValidate"); // Import validation middleware

// ----------------------------------------------------
// Existing Route: Process New Review Submission (POST /review/add)
// ----------------------------------------------------
router.post(
    "/add", 
    utilities.checkLogin, // Ensures user is logged in
    reviewValidate.reviewRules(), // Assumes validation rules for adding a review exist
    reviewValidate.checkReviewData, // Assumes validation checks for adding a review exist
    utilities.handleErrors(reviewController.addReview)
);

// ----------------------------------------------------
// New Route: Build Edit Review View (GET /review/edit/:reviewId)
// ----------------------------------------------------
router.get(
    "/edit/:reviewId", 
    utilities.checkLogin, // Ensures user is logged in and populates res.locals.accountData
    utilities.checkReviewOwnership, // Middleware to ensure user owns the review
    utilities.handleErrors(reviewController.buildEditView)
);

// ----------------------------------------------------
// New Route: Process Review Update (POST /review/update)
// ----------------------------------------------------
// NOTE: This route requires the checkUpdateReviewData validation middleware
router.post(
    "/update", 
    utilities.checkLogin, 
    reviewValidate.reviewUpdateRules(), // Assumed validation rules for updating
    utilities.checkReviewOwnership,
    reviewValidate.checkUpdateReviewData, // Assumed validation checks for updating
    utilities.handleErrors(reviewController.updateReview)
);
// ----------------------------------------------------
// New Routes: Delete Review (GET /review/delete/:reviewId and POST /review/delete)
// ----------------------------------------------------

// Route to deliver the delete review confirmation view (GET /review/delete/:reviewId)
router.get(
    "/delete/:reviewId", 
    utilities.checkLogin,
    utilities.checkReviewOwnership, // Middleware to ensure user owns the review 
    utilities.handleErrors(reviewController.buildDeleteView)
);

// Route to process the review deletion (POST /review/delete)
router.post(
    "/delete", 
     utilities.checkLogin,
     utilities.checkReviewOwnership, // Middleware to ensure user owns the review
     utilities.handleErrors(reviewController.deleteReview)
);

module.exports = router;