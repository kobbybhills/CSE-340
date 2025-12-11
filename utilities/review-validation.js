// utilities/review-validation.js

// 💥 CRITICAL FIX: Include validationResult in the require statement
const { body, validationResult } = require("express-validator") 
const validate = {}

validate.reviewRules = () => {
    return [
        // Rating is required and must be an integer between 1 and 5
        body("rating")
            .trim()
            .isInt({ min: 1, max: 5 })
            .withMessage("Rating must be a whole number between 1 and 5."),

        // Review text is required and should not be too long
        body("review_text")
            .trim()
            .isLength({ min: 1, max: 500 })
            .withMessage("Review text is required and cannot exceed 500 characters."),
    ]
}

/* ******************************
 * Check data and return to view if errors are found
 * ***************************** */
validate.checkReviewData = async (req, res, next) => {
    // This line now works because validationResult is imported above
    const errors = validationResult(req) 

    if (errors.isEmpty()) {
        return next()
    }
    
    // Set errors for the controller to use
    res.locals.errors = errors.array()
    next()
}

module.exports = validate