/**********************************************
 * This server.js file is the primary file of the
 * application. It is used to control the project.
 **********************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const env = require("dotenv").config();
const app = express();
const staticRoute = require("./routes/static"); // Renamed 'static' to 'staticRoute' to avoid conflict later
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");
const utilities = require("./utilities/index");
const session = require("express-session");
const pool = require("./database/");
const path = require("path");
const cookieParser = require("cookie-parser"); // <-- NEW: Required for JWT

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/layout"); // not at views root

/* ***********************
 * Middleware
 *************************/

// Body Parsers - MUST be at the top for form handling
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Management
app.use(
    session({
        store: new (require("connect-pg-simple")(session))({
            createTableIfMissing: true,
            pool,
        }),
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true,
        name: "sessionId",
    })
);

// Flash Messages Middleware
app.use(require("connect-flash")());
app.use(function (req, res, next) {
    res.locals.messages = require("express-messages")(req, res);
    next();
});

// Cookie Parser Middleware (MUST BE BEFORE JWT CHECK)
app.use(cookieParser()); // <-- ADDED: To read the JWT cookie

// JWT Token Check Middleware (MUST BE BEFORE RESTRICTED ROUTES)
app.use(utilities.checkJWTToken); // <-- ADDED: To verify token and set res.locals.loggedin

/* ***********************
 * Static File Middleware (CRITICAL ADDITION)
 * ***********************/
// Tells Express to look inside the 'public' folder for files like CSS, JS, and images.
app.use(express.static(path.join(__dirname, "public"))); 


/* ***********************
 * Routes
 *************************/

// Static routes
app.use(staticRoute); 

// Home route
app.get("/", utilities.handleErrors(baseController.buildHome));

// Inventory routes
app.use("/inv", inventoryRoute);

// Account routes
app.use("/account", accountRoute);

// File Not Found Route - must be last
app.use(async (req, res, next) => {
    next({ status: 404, message: "Sorry, we appear to have lost that page." });
});

/* ***********************
 * Express Error Handler
 * Must be last middleware
 *************************/
app.use(async (err, req, res, next) => {
    let nav = await utilities.getNav();
    console.error(`Error at "${req.originalUrl}": ${err.message}`);

    let message =
        err.status == 404
            ? err.message
            : "Oh no! There was a crash. Maybe try a different route?";

    res.render("errors/error", {
        title: err.status || "Server Error",
        message,
        nav,
    });
});

/* ***********************
 * Local Server Information
 * Values from .env file
 *************************/
const port = process.env.PORT;
const host = process.env.HOST;

/* ***********************
 * Start Server
 *************************/
app.listen(port, () => {
    console.log(`App listening on ${host}:${port}`);
});