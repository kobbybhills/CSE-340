const invModel = require("../models/inventory-model")
const reviewModel = require("../models/review-model");
const jwt = require("jsonwebtoken")
require("dotenv").config()

const Util = {}

/* ************************
 * Constructs the nav HTML
 * ************************ */
Util.getNav = async function (req, res, next) {
  let data = await invModel.getClassifications()
  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}

/* **************************************
 * Build the classification view HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
  let grid
  if (data.length > 0) {
    grid = '<ul id="inv-display">'
    data.forEach((vehicle) => {
      grid += "<li>"
      grid +=
        '<a href="../../inv/detail/' +
        vehicle.inv_id +
        '" title="View ' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        ' details"><img src="' +
        vehicle.inv_thumbnail +
        '" alt="Image of ' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        ' on CSE Motors" /></a>'
      grid += '<div class="namePrice">'
      grid += "<hr />"
      grid += "<h2>"
      grid +=
        '<a href="../../inv/detail/' +
        vehicle.inv_id +
        '" title="View ' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        ' details">' +
        vehicle.inv_make +
        " " +
        vehicle.inv_model +
        "</a>"
      grid += "</h2>"
      grid +=
        "<span>$" +
        new Intl.NumberFormat("en-US").format(vehicle.inv_price) +
        "</span>"
      grid += "</div>"
      grid += "</li>"
    })
    grid += "</ul>"
  } else {
    grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}

/* **************************************
 * Build the single vehicle detail HTML
 * ************************************ */
Util.buildSingleVehicleDisplay = async function (vehicle) {
  let html = ""
  
  const inv = vehicle;

  if (inv) {
    html += '<div class="vehicle-detail-container">'

    // 1. Image Section
    html += '<div class="vehicle-image">'
    html +=
      '<img src="' +
      inv.inv_image +
      '" alt="Image of ' +
      inv.inv_make +
      " " +
      inv.inv_model +
      ' on CSE Motors" />'
    html += '</div>'
    
    // 2. Details Section
    html += '<div class="vehicle-details-text">'
    
    html += '<h2 class="details-heading">' + inv.inv_make + ' ' + inv.inv_model + ' Details</h2>'
    
    // Price (made prominent)
    html += '<span class="detail-price">Price: $' + new Intl.NumberFormat("en-US").format(inv.inv_price) + '</span>'

    // Details List (using ul/li and the .detail-list class)
    html += '<ul class="detail-list">'
    
    html += '<li><strong>Description:</strong> ' + inv.inv_description + '</li>'
    html += '<li><strong>Color:</strong> ' + inv.inv_color + '</li>'
    html += '<li><strong>Miles:</strong> ' + new Intl.NumberFormat("en-US").format(inv.inv_miles) + '</li>'
    
    html += '</ul>'

    html += '</div>' // End vehicle-details-text
    html += '</div>' // End vehicle-detail-container
  } else {
    html = '<p class="notice">Sorry, the vehicle details could not be found.</p>'
  }

  return html
}



/* ****************************************
 * Middleware to check if user owns the review (or is Admin/Employee)
 * ************************************ */
Util.checkReviewOwnership = async (req, res, next) => {
    // 1. Get the Review ID. It could come from the URL parameter (GET) or the form body (POST).
    const review_id = req.params.reviewId || req.body.review_id;
    if (!review_id) {
        req.flash("error", "Error: Review ID missing from request.");
        return res.redirect("/account");
    }

    // 2. Get the logged-in user's ID and type
    const account_id = res.locals.accountData.account_id;
    const account_type = res.locals.accountData.account_type;

    // 3. Allow Admin/Employee to proceed regardless of ownership
    if (account_type === 'Admin' || account_type === 'Employee') {
        return next();
    }
    
    // 4. Fetch the review data
    const reviewData = await reviewModel.getReviewByReviewId(review_id);

    // 5. Check if the review exists and if the user is the owner
    if (reviewData && reviewData.user_id === account_id) {
        // User is the owner, proceed
        next();
    } else {
        // Review not found or user is NOT the owner (Client trying to manipulate another's review)
        req.flash("error", "Access denied. You do not have permission to modify this review.");
        return res.redirect("/account");
    }
};


/* ****************************************
 * Middleware to check token validity
 * (Runs on every request to load account data if token is present)
 **************************************** */
Util.checkJWTToken = (req, res, next) => {
  if (req.cookies.jwt) {
    jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
        if (err) {
          req.flash("Please log in")
          res.clearCookie("jwt")
          return res.redirect("/account/login")
        }
        res.locals.accountData = accountData
        res.locals.loggedin = 1
        next()
      }
    )
  } else {
    next()
  }
}

/* ****************************************
 * Middleware to check if user is logged in
 * (Used to restrict access to any page)
 * ************************************ */
Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    next()
  } else {
    req.flash("notice", "Please log in to access the restricted area.")
    return res.redirect("/account/login")
  }
}

/* ****************************************
 * Build the HTML table of reviews for the account management view
 * **************************************** */
Util.buildUserReviewTable = async function (reviews) {
    
    // If no reviews exist, show a notice
    if (!reviews || reviews.length === 0) {
        return '<p class="notice">You have not submitted any reviews yet.</p>';
    }

    // Begin building table markup
    let table = `
        <table class="review-management-table">
            <thead>
                <tr>
                    <th>Reviewed Item</th>
                    <th>Review Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    reviews.forEach(review => {
        
        // Format review date
        const reviewDate = new Date(review.created_at).toLocaleDateString(
            'en-US',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }
        );

        table += `
            <tr>
                <td>${review.inv_make} ${review.inv_model}</td>
                <td>${reviewDate}</td>
                <td>
                    <a href="/review/edit/${review.review_id}" title="Click to edit">Edit</a>
                    |
                    <a href="/review/delete/${review.review_id}" title="Click to delete">Delete</a>
                </td>
            </tr>
        `;
    });

    table += `
            </tbody>
        </table>
    `;

    return table;
};


/* ****************************************
 * Check Account Type Middleware (Task 2: Authorization)
 * (Used to restrict access to Employee/Admin pages)
 * ************************************ */
Util.checkAuthorization = (req, res, next) => {
    // Check if user is logged in AND has the correct account type
    if (res.locals.loggedin && 
        (res.locals.accountData.account_type === 'Employee' || 
         res.locals.accountData.account_type === 'Admin')) {
        next(); // User is authorized, proceed
    } else {
        req.flash("notice", "You do not have the necessary permissions to access the management page.");
        // Redirect to login is specified in the task on failure
        return res.redirect("/account/login"); 
    }
}

/* ****************************************
 * Build the HTML display for vehicle reviews
 * **************************************** */
Util.buildReviewList = async function (reviews) {
    if (!reviews || reviews.length === 0) {
        return '<p class="notice">Be the first to leave a review!</p>';
    }

    let html = '<h3>All Reviews (' + reviews.length + ')</h3>';
    html += '<ul class="review-list">';

    reviews.forEach(review => {
        // Format the review submission date
        const reviewDate = new Date(review.created_at).toLocaleDateString(
            'en-US',
            { year: 'numeric', month: 'long', day: 'numeric' }
        );

        // Display the user's rating as stars (assuming 'rating' is 1-5)
        const starRating = '⭐'.repeat(review.rating);

        html += '<li>';
        html += '<div class="review-header">';
        html += `<p class="reviewer-name">${starRating} Reviewed by ${review.account_firstname} ${review.account_lastname.charAt(0)}.</p>`; // Displays "J." for last name
        html += `<p class="review-date">Posted on: ${reviewDate}</p>`;
        html += '</div>';
        html += `<p class="review-body">${review.body}</p>`;
        html += '</li>';
    });

    html += '</ul>';
    return html;
};


/* ****************************************
 * Middleware For Handling Errors
 * Wrap all async functions in this middleware to catch errors
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

/* ****************************************
 * Build Classification List
 **************************************** */
Util.buildClassificationList = async function (classification_id = null) {
  let data = await invModel.getClassifications()
  let list =
    '<select name="classification_id" id="classificationList" required>'
  list += '<option value="">Choose a Classification</option>'
  data.rows.forEach((row) => {
    list += '<option value="' + row.classification_id + '"'
    if (
      classification_id != null &&
      row.classification_id == classification_id
    ) {
      list += " selected"
    }
    list += ">" + row.classification_name + "</option>"
  })
  list += "</select>"
  return list
}


module.exports = Util