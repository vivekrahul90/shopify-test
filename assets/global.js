// document.addEventListener("DOMContentLoaded", function () {
//   // Listen for click events on the entire document
//   document.addEventListener("click", function (event) {
//     // Check if the clicked element has the attribute `data-essential-upsell-element="add-to-cart-button"`
//     const targetButton = event.target.closest('[data-essential-upsell-element="add-to-cart-button"]');
//     if (targetButton) {
//       console.log("Add-to-cart button clicked:", targetButton);

//       // Query the remove buttons
//       const removeButton = document.querySelector(
//         ".pid-9546342236457 .item-remove_btn" // Replace with the correct class hierarchy
//       );
//       const removeCartButton = document.querySelector(
//         ".pid-9546342236457 button[aria-label='button-remove']" // Adjusted for correct syntax
//       );

//       // Check and trigger click on the first button
//       if (removeButton) {
//         console.log("Clicking the first remove button:", removeButton);
//         removeButton.click();
//       } else {
//         console.warn("Remove button (.item-remove_btn) not found!");
//       }

//       // Check and trigger click on the second button
//       if (removeCartButton) {
//         console.log("Clicking the second remove button:", removeCartButton);
//         removeCartButton.click();
//       } else {
//         console.warn("Remove button (.button-remove) not found!");
//       }
//     }
//   });
// });