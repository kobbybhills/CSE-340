const utilities = require("../utilities/")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

/* ****************************************
 * Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
    try {
        let nav = await utilities.getNav();
        res.render("account/login", {
            title: "Login",
            nav,
            errors: null,
            // Ensure data persistence for failed login attempts
            account_email: req.body.account_email || "", 
        });
    } catch (error) {
        next(error);
    }
}

/* ****************************************
 * Deliver registration view
 * *************************************** */
async function buildRegister(req, res, next) {
    try {
        let nav = await utilities.getNav();
        res.render("account/register", {
            title: "Register",
            nav,
            errors: null,
        });
    } catch (error) {
        next(error);
    }
}

/* ****************************************
 * Process Registration (Runs ONLY IF validation middleware PASSES)
 * *************************************** */
async function registerAccount(req, res, next) {
    try {
        const { account_firstname, account_lastname, account_email, account_password } = req.body;

        const hashedPassword = await bcrypt.hash(account_password, 10);
        
        const regResult = await accountModel.registerAccount(
            account_firstname,
            account_lastname,
            account_email,
            hashedPassword
        );

        if (!regResult) {
            // This should only happen if DB query fails unexpectedly
            throw new Error('Registration failed due to database error.'); 
        }

        req.flash(
            "success",
            `Congratulations, ${account_firstname}! You're now registered. Please log in.`
        );
        return res.redirect("/account/login");

    } catch (error) {
        next(error);
    }
}

/* ****************************************
 * Process login request (Runs ONLY IF validation middleware PASSES)
 * *************************************** */
async function accountLogin(req, res, next) {
    try {
        const { account_email, account_password } = req.body;
        const accountData = await accountModel.getAccountByEmail(account_email);

        if (!accountData) {
            req.flash("error", "Invalid credentials");
            return res.status(400).render("account/login", {
                title: "Login",
                nav: await utilities.getNav(),
                errors: null,
                account_email,
            });
        }

        const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);
        if (!passwordMatch) {
            req.flash("error", "Invalid credentials");
            return res.status(400).render("account/login", {
                title: "Login",
                nav: await utilities.getNav(),
                errors: null,
                account_email,
            });
        }

        // Create token payload
        const tokenPayload = {
            account_id: accountData.account_id,
            account_firstname: accountData.account_firstname,
            account_lastname: accountData.account_lastname,
            account_email: accountData.account_email,
            account_type: accountData.account_type || 'Client', // Default to 'Client'
        };

        const accessToken = jwt.sign(
            tokenPayload,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        // Set JWT cookie (using secure, HTTP-only settings)
        res.cookie("jwt", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000, // 1 hour
        });

        req.flash("success", `Welcome back, ${accountData.account_firstname}!`);
        // FIX: Redirect without the trailing slash to resolve 404 issue on success
        return res.redirect("/account"); 

    } catch (error) {
        next(error);
    }
}

/* ****************************************
 * Deliver account management view
 * *************************************** */
async function buildManagement(req, res, next) {
    try {
        let nav = await utilities.getNav();
        res.render("account/management", {
            title: "Account Management",
            nav,
            errors: null,
        });
    } catch (error) {
        next(error);
    }
}

/* ****************************************
 * Process account logout
 * *************************************** */
async function accountLogout(req, res, next) {
    try {
        // Clear the JWT cookie
        res.clearCookie("jwt");
        
        // Clear locals (optional but ensures clean state)
        res.locals.loggedIn = 0
        res.locals.accountData = null

        req.flash("success", "You have been logged out.");
        res.redirect("/");
    } catch (error) { next(error); }
}

/* ****************************************
 * Deliver update view
 * *************************************** */
async function buildUpdateView(req, res, next) {
    try {
        const nav = await utilities.getNav();
        const account = res.locals.accountData; 
        
        if (!account) {
            req.flash("notice", "Please log in.");
            return res.redirect("/account/login");
        }
        
        res.render("account/update", {
            title: "Update Account",
            nav,
            errors: null,
            // Pass current data from JWT (res.locals.accountData)
            account_firstname: account.account_firstname,
            account_lastname: account.account_lastname,
            account_email: account.account_email,
            account_id: account.account_id,
        });
    } catch (error) { next(error); }
}

/* ****************************************
 * Process account info update
 * *************************************** */
async function updateAccountInfo(req, res, next) {
    try {
        const nav = await utilities.getNav();
        const { account_id, account_firstname, account_lastname, account_email } = req.body;

        const updateResult = await accountModel.updateAccountInfo(
            account_id, account_firstname, account_lastname, account_email
        );

        if (!updateResult) {
            req.flash("notice", "Update failed. Email may already exist or database error.");
            return res.status(500).render("account/update", {
                title: "Update Account",
                nav,
                errors: null,
                account_firstname,
                account_lastname,
                account_email,
                account_id
            });
        }

        // 1. Re-fetch fresh data from DB
        const fresh = await accountModel.getAccountById(account_id);
        
        // 2. Re-sign JWT
        const payload = {
            account_id: fresh.account_id,
            account_firstname: fresh.account_firstname,
            account_lastname: fresh.account_lastname,
            account_email: fresh.account_email,
            account_type: fresh.account_type || "Client",
        };
        const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
        
        // 3. Set new cookie
        res.cookie("jwt", token, {
            httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 3600000
        });

        req.flash("success", "Account information updated successfully.");
        // FIX: Redirect without the trailing slash to resolve 404 issue on success
        return res.redirect("/account");
    } catch (error) { next(error); }
}

/* ****************************************
 * Process password update
 * *************************************** */
async function updatePassword(req, res, next) {
    try {
        const { account_id, account_password } = req.body;

        const hashed = await bcrypt.hash(account_password, 10);
        const updateResult = await accountModel.updatePassword(account_id, hashed);

        if (!updateResult) {
            req.flash("notice", "Password update failed. Database error.");
            return res.status(500).render("account/update", {
                title: "Update Account",
                nav: await utilities.getNav(),
                errors: null,
                account_id
            });
        }

        req.flash("success", "Password updated successfully.");
        // FIX: Redirect without the trailing slash to resolve 404 issue on success
        return res.redirect("/account"); 
    } catch (error) { next(error); }
}


/* ****************************************
 * Export all controller functions
 * *************************************** */
module.exports = {
    buildLogin,
    buildRegister,
    registerAccount,
    accountLogin,
    buildManagement,
    accountLogout,
    buildUpdateView,
    updateAccountInfo,
    updatePassword
};