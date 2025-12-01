const invModel = require("../models/inventory-model")


const Util = {}





/* ************************


 * Constructs the nav HTML unordered list


 ************************** */


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


Util.buildClassificationGrid = async function(data){


    let grid


    if(data.length > 0){


      grid = '<ul id="inv-display">'


      data.forEach(vehicle => { 


        grid += '<li>'


        grid +=  '<a href="../../inv/detail/'+ vehicle.inv_id 


        + '" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model 


        + 'details"><img src="' + vehicle.inv_thumbnail 


        +'" alt="Image of '+ vehicle.inv_make + ' ' + vehicle.inv_model 


        +' on CSE Motors" /></a>'


        grid += '<div class="namePrice">'


        grid += '<hr />'


        grid += '<h2>'


        grid += '<a href="../../inv/detail/' + vehicle.inv_id +'" title="View ' 


        + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' 


        + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'


        grid += '</h2>'


        grid += '<span>$' 


        + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'


        grid += '</div>'


        grid += '</li>'


      })


      grid += '</ul>'


    } else { 


      grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>'


    }


    return grid


  }


/* ****************************************
 * Build the vehicle detail HTML
 * Assignment 3, Task 1
 **************************************** */
Util.buildSingleVehicleDisplay = async (vehicle) => {
  let svd = '<section id="vehicle-display">'
  svd += "<div>"
  svd += '<section class="imagePrice">'
  svd +=
    "<img src='" +
    vehicle.inv_image +
    "' alt='Image of " +
    vehicle.inv_make +
    " " +
    vehicle.inv_model +
    " on cse motors' id='mainImage'>"
  svd += "</section>"
  svd += '<section class="vehicleDetail">'
  svd += "<h3> " + vehicle.inv_make + " " + vehicle.inv_model + " Details</h3>"
  svd += '<ul id="vehicle-details">'
  svd +=
    "<li><h4>Price: $" +
    new Intl.NumberFormat("en-US").format(vehicle.inv_price) +
    "</h4></li>"
  svd += "<li><h4>Description:</h4> " + vehicle.inv_description + "</li>"
  svd += "<li><h4>Color:</h4> " + vehicle.inv_color + "</li>"
  svd +=
    "<li><h4>Miles:</h4> " +
    new Intl.NumberFormat("en-US").format(vehicle.inv_miles) +
    "</li>"
  svd += "</ul>"
  svd += "</section>"
  svd += "</div>"
  svd += "</section>"
  return svd
}






/* ****************************************


 * Middleware For Handling Errors


 * Wrap other function in this for 


 * General Error Handling


 **************************************** */


Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)





module.exports = Util