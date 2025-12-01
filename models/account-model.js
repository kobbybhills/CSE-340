const pool = require("../database")

/* ***********************
 * Register New Account
 * *************************/
async function registerAccount(account_firstname, account_lastname, account_email, account_password){
    try {
        // NOTE: Default account_type MUST be 'Client' for security
        const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *"
        return await pool.query(sql, [account_firstname, account_lastname, account_email, account_password]);
    }catch(error){
        return error.message
    }
}

/* ***********************
 * Check for existing Email
 * *************************/
async function checkExistingEmail(account_email){
    try{
        const sql = "SELECT * FROM account WHERE account_email = $1";
        const email = await pool.query(sql, [account_email]);
        return email.rowCount;
    }catch(error) {
        return error.message
    }
}

/* *****************************
* Return account data using email address
* ***************************** */
async function getAccountByEmail(account_email){
    try{
        const result = await pool.query(
            `SELECT account_id,
                    account_firstname,
                    account_lastname,
                    account_email,
                    account_password,
                    account_type    
            FROM account
            WHERE account_email = $1`,
            [account_email]
        )
        return result.rows[0]
    }catch (error) {
        // Return a custom error object or null rather than error.message for more flexible error handling in controller
        return null 
    }
}

/* *****************************
* Return account data using account ID
* ***************************** */
async function getAccountById(account_id) {
    try {
        // The password must be retrieved here so the controller can re-sign the JWT 
        const sql = 'SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_id = $1';
        const result = await pool.query(sql, [account_id]);
        return result.rows[0];
    } catch (error) {
        return null;
    }
}

/* *****************************
* Update account info (name, email)
* ***************************** */
async function updateAccountInfo(account_id, account_firstname, account_lastname, account_email) {
    try {
        const sql = `
            UPDATE account
            SET account_firstname = $1,
                account_lastname = $2,
                account_email = $3
            WHERE account_id = $4
            RETURNING account_id
        `;
        const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_id]);
        // Return true if any row was updated
        return result.rowCount > 0;
    } catch (error) {
        // Log the error but return false to signal failure (e.g., duplicate email)
        console.error("UpdateAccountInfo error", error);
        return false; 
    }
}

/* *****************************
* Update password
* ***************************** */
async function updatePassword(account_id, hashedPassword) {
    try {
        const sql = `
            UPDATE account
            SET account_password = $1
            WHERE account_id = $2
            RETURNING account_id
        `;
        const result = await pool.query(sql, [hashedPassword, account_id]);
        // Return true if any row was updated
        return result.rowCount > 0;
    } catch (error) {
        console.error("UpdatePassword error", error);
        return false;
    }
}


module.exports = {
    registerAccount,
    checkExistingEmail,
    getAccountByEmail,
    getAccountById,
    updatePassword,
    updateAccountInfo
}