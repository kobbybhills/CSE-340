// validators/reviewValidate.js
const utilities = require("../utilities/");
const reviewModel = require("../models/review-model");
const { body, validationResult } = require("express-validator");
const reviewValidate = {};

/* ****************************************
 * Review Rules (Used for Add Review)
 * *************************************** */
reviewValidate.reviewRules = () => {
  return [
    // rating is required and must be between 1 and 5
    body("rating")
      .trim()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be a whole number between 1 and 5."),

    // review_text (or body) is required and must not be empty
    body("review_text")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Review text is required."),
  ];
};

/* ****************************************
 * Review Update Rules (Used for Update Review)
 * *************************************** */
reviewValidate.reviewUpdateRules = () => {
  // Can reuse the same rules as the review is updated with the same constraints
  return [
    // rating is required and must be between 1 and 5
    body("rating")
      .trim()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be a whole number between 1 and 5."),

    // review_text (or body) is required and must not be empty
    body("review_text")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Review text is required."),
  ];
};


/* ****************************************
 * Check data and return to detail view or proceed (For ADD Review)
 * NOTE: Your original file was missing this check, assuming you need it for the /add route
 * *************************************** */
reviewValidate.checkReviewData = async (req, res, next) => {
    // This is the check for the /review/add route
    const { inv_id, rating, review_text } = req.body;
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next(); // Validation passed, proceed to controller
    }

    // Validation FAILED - Re-render the detail view with errors and sticky data
    // NOTE: The controller needs to fetch vehicle and review data for the re-render.
    // We rely on the controller logic (reviewController.addReview) to handle the re-render details.
    
    // We must pass the errors object to the controller via res.locals for consistency.
    res.locals.errors = errors;
    next(); 
    // The reviewController.addReview logic will now detect res.locals.errors and handle the re-render.
};


/* ****************************************
 * Check data and return to edit view or proceed (For UPDATE Review)
 * *************************************** */
reviewValidate.checkUpdateReviewData = async (req, res, next) => {
    // ... (Your existing, correct logic goes here) ...
    const { review_id, rating, review_text, inv_id, user_id } = req.body;
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next(); // Validation passed, proceed to controller
    }

    // Validation FAILED - Re-render the edit view with errors and sticky data
    const nav = await utilities.getNav();
    const reviewData = await reviewModel.getReviewByReviewId(review_id); 
    
    if (!reviewData) {
        req.flash("notice", "Error: Review data corrupted during validation check.");
        return res.redirect("/account");
    }

    const reviewDate = new Date(reviewData.created_at).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const title = `Edit Review of ${reviewData.inv_make} ${reviewData.inv_model}`;
    
    res.render("./review/edit-review", {
        title,
        nav,
        errors, 
        review_id,
        review_text,
        review_rating: rating,
        inv_make: reviewData.inv_make,
        inv_model: reviewData.inv_model,
        reviewDate,
        inv_id: reviewData.inv_id,
        user_id: reviewData.user_id,
    });
};

module.exports = reviewValidate;