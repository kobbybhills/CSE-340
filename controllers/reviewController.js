// Import the new review model and any utility functions
const reviewModel = require("../models/review-model");
const utilities = require("../utilities/");
const invModel = require("../models/inventory-model"); // 💥 NEW: You need to import the inventory model to fetch the vehicle
const reviewCont = {};

/* ****************************************
 * Deliver edit review view
 * *************************************** */
reviewCont.buildEditView = async function (req, res, next) {
    try {
        const review_id = parseInt(req.params.reviewId);
        const nav = await utilities.getNav();
        
        // 1. Fetch the specific review data
        const reviewData = await reviewModel.getReviewByReviewId(review_id);

        if (!reviewData) {
            req.flash("notice", "Review not found.");
            return res.redirect("/account");
        }

        // 2. Check for Authorization (Optional but good practice: ensure user owns the review)
        // This check usually happens in a middleware but is added here for immediate protection.
        if (reviewData.user_id !== res.locals.accountData.account_id) {
            req.flash("error", "You are not authorized to edit this review.");
            return res.redirect("/account");
        }

        // 3. Format the date for display
        const reviewDate = new Date(reviewData.created_at).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const title = `Edit Review of ${reviewData.inv_make} ${reviewData.inv_model}`;
        
        res.render("./review/edit-review", {
            title,
            nav,
            errors: null,
            review_id: reviewData.review_id,
            review_text: reviewData.body, // Use 'body' from DB as the text input value
            review_rating: reviewData.rating,
            inv_make: reviewData.inv_make,
            inv_model: reviewData.inv_model,
            reviewDate,
            // Hidden fields needed for POST submission:
            inv_id: reviewData.inv_id,
            user_id: reviewData.user_id,
        });

    } catch (error) {
        console.error("Error building edit view:", error);
        next(error);
    }
}


/* ****************************************
 * Process Review Submission
 * *************************************** */
reviewCont.addReview = async function (req, res, next) {
  // Extract data from the request body
  const { inv_id, user_id, rating, review_text } = req.body;

  // --- Check for Validation Errors (Passed from reviewValidate.checkReviewData middleware) ---
  const errors = res.locals.errors;

  if (errors && errors.length > 0) {
    // 💥 CORRECT ERROR HANDLING: If validation fails, re-render the detail page with errors

    // 1. Fetch the necessary data for the detail page re-render:
    const nav = await utilities.getNav();
    const vehicle = await invModel.getInventoryById(inv_id); // Fetch vehicle details
    const detailViewHTML = await utilities.buildSingleVehicleDisplay(vehicle); // Build display HTML
    const reviews = await reviewModel.getReviewsByInvId(inv_id); // Fetch existing reviews

    // 2. Pass all necessary data back to the view
    return res.render("./inventory/detail", {
      title: `${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}`,
      nav,
      detailViewHTML,
      vehicle, // Required for hidden inputs
      reviews, // Required for the reviews list
      errors, // Passed the errors back to the view
      // The submitted form data should be available via res.locals.account_
      // but since only two fields are submitted, we'll rely on the default EJS form behavior.
    });
  }
  // --- End of Validation Error Check ---

  // The submitted data is clean, proceed with model function
  const numericRating = parseInt(rating); // Ensure rating is a number

  // Call the new model function (Requirement 2)
  const reviewResult = await reviewModel.createReview(
    inv_id,
    user_id,
    numericRating,
    review_text
  );

  // --- Start of Success/Failure Handling ---
  if (reviewResult) {
    req.flash(
      "notice",
      "Review successfully submitted and added to the database!"
    );
  } else {
    // Handle database insertion failure
    req.flash("notice", "Error: Review failed to submit. Please try again.");
  }

  // 💥 CRITICAL: Always redirect to the GET route after POST success/failure
  res.redirect(`/inv/detail/${inv_id}`);
  // --- End of Success/Failure Handling ---
};

/* ****************************************
 * Process Review Update
 * *************************************** */
reviewCont.updateReview = async function (req, res, next) {
    // Extract data from the request body. We use 'review_text' for the body field.
    const { review_id, rating, review_text, inv_id, user_id } = req.body;
    const numericRating = parseInt(rating); // Ensure rating is a number

    // --- Check for Validation Errors (Middleware assumed: reviewValidate.checkUpdateReviewData) ---
    const errors = res.locals.errors;
    
    if (errors && errors.length > 0) {
        // If validation fails, re-render the edit view with sticky data and errors
        
        // 1. Fetch the necessary data for the re-render (since review data may not be full from the POST body)
        const nav = await utilities.getNav();
        const reviewData = await reviewModel.getReviewByReviewId(review_id); // Re-fetch all data
        
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

        return res.render("./review/edit-review", {
            title,
            nav,
            errors, // Pass errors back
            review_id,
            review_text, // Use submitted data for stickiness
            review_rating: numericRating, // Use submitted data for stickiness
            inv_make: reviewData.inv_make,
            inv_model: reviewData.inv_model,
            reviewDate,
            // Hidden fields:
            inv_id: reviewData.inv_id,
            user_id: reviewData.user_id,
        });
    }
    // --- End of Validation Error Check ---

    // Data is clean, proceed with update
    const updateResult = await reviewModel.updateReview(
        review_id,
        numericRating,
        review_text
    );

    // --- Start of Success/Failure Handling ---
    if (updateResult) {
        req.flash("success", "Review successfully updated!");
        // Redirect to account management dashboard
        res.redirect("/account"); 
    } else {
        // Handle database insertion failure
        req.flash("notice", "Error: Review update failed. Please try again.");
        // Redirect to the edit view (GET) so the user can try again
        res.redirect(`/review/edit/${review_id}`);
    }
    // --- End of Success/Failure Handling ---
};

/* ****************************************
 * Process Review Deletion
 * *************************************** */
reviewCont.deleteReview = async function (req, res, next) {
    const { review_id } = req.body;
    const reviewId = parseInt(review_id); // Ensure it's an integer

    // 1. Authorization Check (Re-check if user owns the review before deletion)
    // Although the delete button is only shown to the owner, 
    // we must always re-validate on the POST endpoint to prevent CSRF/spoofing attacks.
    const reviewData = await reviewModel.getReviewByReviewId(reviewId);

    if (!reviewData || reviewData.user_id !== res.locals.accountData.account_id) {
        req.flash("error", "Deletion failed. You are not authorized to delete this review.");
        return res.redirect("/account");
    }
    
    // 2. Call the model function
    const deleteResult = await reviewModel.deleteReview(reviewId);

    // 3. Handle Success/Failure
    if (deleteResult) {
        req.flash("success", "Review successfully deleted.");
        // Redirect back to the account management dashboard
        res.redirect("/account"); 
    } else {
        // Handle database deletion failure
        req.flash("notice", "Error: Deletion failed. Please try again.");
        // Redirect back to the account management dashboard
        res.redirect("/account");
    }
};

/* ****************************************
 * Deliver delete review confirmation view
 * *************************************** */
reviewCont.buildDeleteView = async function (req, res, next) {
    try {
        const review_id = parseInt(req.params.reviewId);
        const nav = await utilities.getNav();
        
        // 1. Fetch the specific review data (requires the JOIN to get vehicle make/model)
        const reviewData = await reviewModel.getReviewByReviewId(review_id);

        if (!reviewData) {
            req.flash("notice", "Review not found.");
            return res.redirect("/account");
        }

        // 2. Check for Authorization
        if (reviewData.user_id !== res.locals.accountData.account_id) {
            req.flash("error", "You are not authorized to delete this review.");
            return res.redirect("/account");
        }

        const reviewDate = new Date(reviewData.created_at).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const title = `Delete Review of ${reviewData.inv_make} ${reviewData.inv_model}`;
        
        res.render("./review/delete-confirm", {
            title,
            nav,
            errors: null,
            review_id: reviewData.review_id,
            review_text: reviewData.body, 
            review_rating: reviewData.rating,
            inv_make: reviewData.inv_make,
            inv_model: reviewData.inv_model,
            reviewDate,
        });

    } catch (error) {
        console.error("Error building delete view:", error);
        next(error);
    }
}

module.exports = reviewCont;

