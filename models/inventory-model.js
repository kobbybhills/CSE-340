const pool = require("../database/")

/* ***************************
 * Get all classification data
 * ************************** */
async function getClassifications(){
  // Note: RETURNING * is not needed here as we are just selecting data
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}

/* ***************************
 * Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getclassificationsbyid error " + error)
  }
}

/* ***************************
 * Get inventory and classification data by inv_id
 * ************************** */
async function getInventoryById(invId) {
  try {
    const data = await pool.query(
      "SELECT * FROM public.inventory AS i JOIN public.classification AS c ON i.classification_id = c.classification_id WHERE i.inv_id = $1",
      [invId]
    )
    return data.rows[0]
  } catch (error) {
    console.error(error)
  }
}

/* ***************************
 * Insert a new classification (Task 2)
 * ************************** */
async function addClassification(classification_name){
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *"
    const result = await pool.query(sql, [classification_name])
    // The query returns the result object. The rowCount property indicates success.
    return result.rowCount // <-- CRITERIA 6 FIX: Returns 1 on success.
  } catch (error) {
    console.error("addClassification error: " + error.message)
    return 0 // Returns 0 on failure.
  }
}

/* ***************************
 * Insert a new vehicle/inventory item (Task 3)
 * ************************** */
async function addInventory(
  inv_make,
  inv_model,
  inv_year,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_miles,
  inv_color,
  classification_id
) {
  try {
    const sql = `
      INSERT INTO inventory (
        inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail,
        inv_price, inv_miles, inv_color, classification_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`
    
    const values = [
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id
    ]

    const result = await pool.query(sql, values)
    // The query returns the result object. The rowCount property indicates success.
    return result.rowCount // <-- CRITERIA 6 FIX: Returns 1 on success.
  } catch (error) {
    console.error("addInventory error: " + error.message)
    return 0 // Returns 0 on failure.
  }
}

/* *****************************
 * Update Inventory Data (Task 4)
 * **************************** */
async function updateInventory(
    inv_id,
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id
) {
    try {
        const sql = `
            UPDATE inventory SET 
                inv_make = $1, inv_model = $2, inv_description = $3, 
                inv_image = $4, inv_thumbnail = $5, inv_price = $6, 
                inv_year = $7, inv_miles = $8, inv_color = $9, 
                classification_id = $10 
            WHERE inv_id = $11 
            RETURNING *`;

        const data = await pool.query(sql, [
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color,
            classification_id,
            inv_id // inv_id is the last parameter for the WHERE clause
        ]);

        return data.rowCount; // Returns 1 on success, 0 on failure
    } catch (error) {
        console.error("model error: " + error);
        return 0;
    }
}

/* *****************************
 * Delete Inventory Item (Task 5)
 * **************************** */
async function deleteInventory(inv_id) {
    try {
        const sql = 'DELETE FROM inventory WHERE inv_id = $1';
        const data = await pool.query(sql, [inv_id]);
        return data.rowCount; // Returns 1 if successful, 0 if no row was deleted
    } catch (error) {
        // Log the error but throw a custom, simpler error for the controller
        console.error("deleteInventory error: " + error);
        return 0;
    }
}


/* *****************************
 * Check for existing classification name
 * Used by inventory validation middleware
 * **************************** */
async function checkExistingClassification(classification_name){
  try {
    const sql = "SELECT * FROM classification WHERE classification_name = $1"
    const classification = await pool.query(sql, [classification_name])
    return classification.rowCount
  } catch (error) {
    return 0
  }
}


/* ***************************
 * Export required functions
 * ************************** */
module.exports = {
  getClassifications, 
  getInventoryByClassificationId, 
  getInventoryById,
  addClassification,
  addInventory,  
  updateInventory, 
  deleteInventory,
  checkExistingClassification // <-- Added for validation
};