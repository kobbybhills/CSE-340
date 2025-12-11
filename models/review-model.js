const pool = require("../database/"); 

/* ***************************
 * Insert a new review
 * ************************** */
async function createReview(inv_id, user_id, rating, body) {
  try {
    const sql =
      "INSERT INTO reviews (inv_id, user_id, rating, body) VALUES ($1, $2, $3, $4) RETURNING *";
    const result = await pool.query(sql, [inv_id, user_id, rating, body]);
    return result.rowCount; 
  } catch (error) {
    console.error("createReview error: " + error.message);
    return 0; // Return 0 on failure
  }
}

/* ***************************
 * Get all reviews written by a specific user
 * ************************** */
async function getReviewsByAccountId(account_id) {
    try {
        const sql = `
            SELECT 
                r.id AS review_id,  /* <-- FIXED: Using r.id and aliasing it to review_id */
                r.created_at, 
                r.rating, 
                r.body, 
                i.inv_make, 
                i.inv_model,
                i.inv_id
            FROM reviews r
            JOIN inventory i ON r.inv_id = i.inv_id 
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
        `;
        const data = await pool.query(sql, [account_id]);
        return data.rows;
    } catch (error) {
        console.error("getReviewsByAccountId error: " + error.message);
        return []; // Return empty array on failure
    }
}

/* ***************************
 * Get all reviews for a specific item
 * ************************** */
async function getReviewsByInvId(inv_id) {
  try {
    const sql = `
            SELECT r.id AS review_id, r.created_at, r.rating, r.body, r.inv_id, r.user_id, a.account_firstname, a.account_lastname  /* <-- FIXED: Using r.id AS review_id */
            FROM reviews r
            JOIN account a ON r.user_id = a.account_id 
            WHERE r.inv_id = $1
            ORDER BY r.created_at DESC
        `;
    const data = await pool.query(sql, [inv_id]);
    return data.rows;
  } catch (error) {
    console.error("getReviewsByInvId error: " + error.message);
    return []; // Return empty array on failure
  }
}

/* ***************************
 * Get a single review by its ID
 * ************************** */
async function getReviewByReviewId(review_id) {
    try {
        const sql = `
            SELECT 
                r.id AS review_id,
                r.rating, 
                r.body, 
                i.inv_make, 
                i.inv_model,
                r.user_id,
                r.inv_id,
                a.account_firstname,
                r.created_at /* Added created_at for the delete view logic */
            FROM reviews r
            JOIN inventory i ON r.inv_id = i.inv_id 
            JOIN account a ON r.user_id = a.account_id 
            WHERE r.id = $1 /* <-- FIXED: Using r.id in the WHERE clause */
        `;
        const data = await pool.query(sql, [review_id]);
        return data.rows[0]; // We expect only one review
    } catch (error) {
        console.error("getReviewByReviewId error: " + error.message);
        return null; 
    }
}
/* ***************************
 * Update a review
 * ************************** */
async function updateReview(review_id, rating, body) {
    try {
        const sql =
            "UPDATE reviews SET rating = $1, body = $2, created_at = NOW() WHERE id = $3 RETURNING *"; /* <-- FIXED: Using id in WHERE clause */
        const result = await pool.query(sql, [
            rating,
            body,
            review_id,
        ]);
        return result.rowCount; // Should return 1 on success
    } catch (error) {
        console.error("updateReview error: " + error.message);
        return 0; // Return 0 on failure
    }
}

/* ***************************
 * Delete a specific review
 * ************************** */
async function deleteReview(review_id) {
    try {
        const sql = 'DELETE FROM reviews WHERE id = $1'; /* <-- FIXED: Using id in WHERE clause */
        const result = await pool.query(sql, [review_id]);
        return result.rowCount; // Should return 1 on successful deletion
    } catch (error) {
        console.error("deleteReview error: " + error.message);
        return 0; // Return 0 on failure
    }
}

/* ***************************
 * Export required functions
 * ************************** */
module.exports = {
  createReview,
  getReviewsByInvId,
  getReviewsByAccountId,
  getReviewByReviewId,
  updateReview,
  deleteReview,
};