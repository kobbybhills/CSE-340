'use strict'

// Variable name changed to match the actual ID used in the HTML
let classificationList; 

// Wait for the DOM to load before attaching event listener
document.addEventListener("DOMContentLoaded", function () {
    // Correctly targets the element with id="classificationList"
    classificationList = document.querySelector("#classificationList");
    
    // Check if the element exists
    if (classificationList) { 
        classificationList.addEventListener("change", (e) => {
            let classification_id = e.target.value;

            // Check if a valid classification ID is selected (i.e., not the empty string)
            if (classification_id) { 
                let inventoryURL = `/inv/getInventory/${classification_id}`;
                
                // Fetch the vehicle data as JSON
                fetch(inventoryURL)
                .then(function (response) {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error("Network response was not ok.");
                })
                .then(function (data) {
                    // Success: Build the HTML table
                    buildInventoryList(data);
                })
                .catch(function (error) {
                    console.log('There was a problem fetching inventory: ', error.message);
                    document.getElementById("inventoryDisplay").innerHTML = 
                        '<p class="notice">Sorry, no inventory data was found.</p>';
                });
            } else {
                // If "Choose a Classification" is selected, clear the table.
                document.getElementById("inventoryDisplay").innerHTML = '';
            }
        });
    }
});

/* ****************************************
 * Function to build the table of inventory items
 * **************************************** */
function buildInventoryList(data) {
    let inventoryDisplay = document.getElementById("inventoryDisplay");
    
    if (!inventoryDisplay) return; 
    
    if (!data || data.length === 0) {
        inventoryDisplay.innerHTML = '<p class="notice">No vehicles found for this classification.</p>';
        return;
    }

    let dataTable = '<thead>';
    dataTable += '<tr><th>Name</th><td>&nbsp;</td><td>&nbsp;</td></tr>';
    dataTable += '</thead>';
    dataTable += '<tbody>';

    data.forEach(function (element) {
        dataTable += `<tr><td>${element.inv_make} ${element.inv_model}</td>`;
        
        // Create Edit Link - ADDED class='action-link'
        dataTable += `<td><a href='/inv/edit/${element.inv_id}' class='action-link edit-link' title='Click to modify'>Modify</a></td>`;
        
        // Create Delete Link - ADDED class='action-link'
        dataTable += `<td><a href='/inv/delete/${element.inv_id}' class='action-link delete-link' title='Click to delete'>Delete</a></td></tr>`;
    });

    dataTable += '</tbody>';
    inventoryDisplay.innerHTML = dataTable;
}