/* ****************************************
 * Function to reliably toggle the mobile navigation
 * *************************************** */
function toggleNav() {
    // 1. Get the HTML elements by their specific IDs
    const navList = document.getElementById('navList');
    const hamburger = document.getElementById('hamburgerBtn');

    // 2. Add the click listener ONLY if both elements exist
    if (hamburger && navList) {
        hamburger.addEventListener('click', () => {
            // Toggles the 'open' class which controls the menu visibility (height: 0 vs height: 270px) in the CSS
            navList.classList.toggle('open');
        });
    } else {
        // This is a crucial check! If this message appears in the browser console,
        // it means there's a problem with the IDs in your nav.ejs file.
        console.error("Hamburger elements not found: Check 'nav.ejs' IDs ('hamburgerBtn' and 'navList').");
    }
}

// 3. Ensure the function runs ONLY after the entire HTML document is loaded
document.addEventListener('DOMContentLoaded', toggleNav);