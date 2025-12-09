const invModel = require("../models/inventory-model")
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