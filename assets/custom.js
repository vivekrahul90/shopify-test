$(document).ready(function(){
  function formatMoney(cents, format = "") {
    if (typeof cents === "string") {
      cents = cents.replace(".", "");
    }
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/, formatString = format || window.themeVariables.settings.moneyFormat;
    function defaultTo(value2, defaultValue) {
      return value2 == null || value2 !== value2 ? defaultValue : value2;
    }
    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultTo(precision, 2);
      thousands = defaultTo(thousands, ",");
      decimal = defaultTo(decimal, ".");
      if (isNaN(number) || number == null) {
        return 0;
      }
      number = (number / 100).toFixed(precision);
      let parts = number.split("."), dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands), centsAmount = parts[1] ? decimal + parts[1] : "";
      return dollarsAmount + centsAmount;
    }
    let value = "";
    switch (formatString.match(placeholderRegex)[1]) {
      case "amount":
        value = formatWithDelimiters(cents, 2);
        break;
      case "amount_no_decimals":
        value = formatWithDelimiters(cents, 0);
        break;
      case "amount_with_space_separator":
        value = formatWithDelimiters(cents, 2, " ", ".");
        break;
      case "amount_with_comma_separator":
        value = formatWithDelimiters(cents, 2, ".", ",");
        break;
      case "amount_with_apostrophe_separator":
        value = formatWithDelimiters(cents, 2, "'", ".");
        break;
      case "amount_no_decimals_with_comma_separator":
        value = formatWithDelimiters(cents, 0, ".", ",");
        break;
      case "amount_no_decimals_with_space_separator":
        value = formatWithDelimiters(cents, 0, " ");
        break;
      case "amount_no_decimals_with_apostrophe_separator":
        value = formatWithDelimiters(cents, 0, "'");
        break;
    }
    if (formatString.indexOf("with_comma_separator") !== -1) {
      return formatString.replace(placeholderRegex, value);
    } else {
      return formatString.replace(placeholderRegex, value);
    }
  }
  var currencyFormat = window.Eurus.currencyCodeEnabled ? window.Eurus.moneyWithCurrencyFormat : window.Eurus.moneyFormat;
  $('.size-chart_modal-opener').click(function(){
     $('#size-chart_modal').css('display', 'flex');
  });
  $('.size-chart_modal-close').click(function(){
     $('#size-chart_modal').css('display', 'none');
  });
  
  $('body').on('click','.select-size_btn',function(){
      $('html,body').animate({
        scrollTop: $(".ringsizecustom_options").offset().top - 200
      }, 100);
     $('.ringsizecustom_options').addClass('shake');
    setTimeout(function(){
      $('.ringsizecustom_options').removeClass('shake');
    },1000);
  });
  
  $('body').on('change','#certificate_product', function(){
    if($(this).is(':checked')){                  
      var compareprice = parseInt($(this).attr('data-price')) + parseInt($('body .product-info .main-product-price').attr('data-compareprice'));
      var price = parseInt($(this).attr('data-price')) + parseInt($('body .product-info .main-product-price').attr('data-price'));      
    }else{
      var compareprice = parseInt($('body .product-info .main-product-price').attr('data-compareprice'));
      var price = parseInt($('body .product-info .main-product-price').attr('data-price'));      
    }
    console.log(price);
    var prchtml = '';
    prchtml += `<div class="main-product-price price leading-none" data-price="${parseInt($('body .product-info .main-product-price').attr('data-price'))}" data-compareprice="${parseInt($('body .product-info .main-product-price').attr('data-compareprice'))}">
    <div class="no-collage:mb-2">
      <div class="hidden">${formatMoney(price, currencyFormat)}</div>`;
    if(compareprice > price){
      var saving = Math.round((compareprice - price) * 100.0 / compareprice)
      prchtml += `<div class="pricing_wrapper_custom ">
          <span class="price-sale selection:bg-text-[rgb(var(--colors-price-sale),0.2)]">${formatMoney(price, currencyFormat)}</span>
          <small class="comp_price cap rtl:inline-block mr-1 rtl:ml-1 rtl:mr-0 ">
            <s class="rtl:leading-tight">${formatMoney(compareprice, currencyFormat)}</s>
          </small>
          <span class="saving">${saving}% OFF</span>
        </div>`;
    }else{
      prchtml += `<p class="price price-sale">
          <span>${formatMoney(price, currencyFormat)}</span>
        </p>`;
    }
    prchtml += `</div></div>`;
    $('body .product-info .main-product-price').parent().html(prchtml);
    if($('body .stickybar_price_wrapper').length > 0){
      var stickyprchtml = '';      
      stickyprchtml += `<div class="price leading-none" data-price="${parseInt($('body .product-info .main-product-price').attr('data-price'))}" data-compareprice="${parseInt($('body .product-info .main-product-price').attr('data-compareprice'))}">
      <div class="no-collage:mb-2">
        <div class="hidden">${formatMoney(price, currencyFormat)}</div>`;
      if(compareprice > price){
        stickyprchtml += `<div class="pt-1">            
            <span class="price-sale selection:bg-text-[rgb(var(--colors-price-sale),0.2)] ml-1 rtl:mr-1 rtl:ml-0">${formatMoney(price, currencyFormat)}</span>
            <small class="cap rtl:inline-block hidden-phone-themebased">
              <s class="rtl:leading-tight">${formatMoney(compareprice, currencyFormat)}</s>
            </small>
          </div>`;
      }else{
        stickyprchtml += `<p class="price price-sale">
            <span>${formatMoney(price, currencyFormat)}</span>
          </p>`;
      }
      stickyprchtml += `</div></div>`;
      $('body .stickybar_price_wrapper').html(stickyprchtml); 
    }    
  });

  $('body').on('change','#certificate_item_properties', function(e){
    e.preventDefault();    
     var _this = $(this);
    _this.closest('.certificate_product_prop').addClass('has_loader');
    var subitemkey = $(this).attr('data-subitemkey'), 
        subitemindex = $(this).attr('data-subitemindex'), 
        subitempid = $(this).attr('data-subitempid'),
        mainitemkey = $(this).attr('data-mainitemkey'), 
        mainitempid = $(this).attr('data-mainitempid'), 
        prevcertiid = $(this).attr('data-prevcertiid'),
      vitemprop = $(this).attr('data-vitemprop'),
        mainitemqty = $(this).attr('data-mainitemqty');
    if($(this).prop('checked')){
      var randomId = function(length = 10) {
        return Math.random().toString(36).substring(2, length+2);
      };
      var randomid = randomId(100); 
      $.ajax({
        url: '/cart/change.js',
        method: 'POST',
        async: false,
        data: {
          id: mainitemkey, // Line item key
          quantity: mainitemqty, // Keep the item quantity the same
          properties: {                
            "_certificate_item": "main",
            "Add certificate for ₹50": "Yes",
            "_bundleid": randomid
          }
        },
        dataType: 'json',
        success: function (response) {
          console.log(vitemprop);
          const sections = Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id);
          const sectionsUrl = window.location.pathname;
          const certData = {
            items: [
              {
                id: vitemprop,
                quantity: mainitemqty,
                properties: {
                  '_certificate_item': 'sub',
                  '_bundleid': randomid,
                  '_mainqty': mainitemqty
                }
              }
            ],
            sections: sections,
            sections_url: sectionsUrl
          };

          fetch(`/cart/add.js`, {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify(certData),
          })
          .then(response => {
              if (!response.ok) {
                throw new Error('Failed to update cart items');
                _this.closest('.certificate_product_prop').removeClass('has_loader');
              }
              return response.json();
            })
          .then(state => {
            window.handleCartResponse(state, mainitempid);
          }).catch((error) => {
            console.error('Error:', error);
              _this.closest('.certificate_product_prop').removeClass('has_loader');
          })
          
        },
        error: function (xhr, status, error) {
          console.error("Error removing property:", xhr.responseJSON || error);
          // alert("Failed to remove property.");
        }
      });
    }else{ 
      function _postUpdateItem(itemId, line, qty, itemproductid, mainitemkey,mainitemqty, wait = 500) {
        clearTimeout(this.t);
        const func = () => {
          console.log(mainitemkey);
          $.ajax({
            url: '/cart/change.js',
            method: 'POST',
            async: false,
            data: {
              id: mainitemkey, // Line item key
              quantity: mainitemqty, // Keep the item quantity the same
              properties: {                
                "_certificate_item": "",
                "Add certificate for ₹50": "No",
                "_bundleid": "",
                "_previtemid": prevcertiid
              }
            },
            dataType: 'json',
            success: function (response) {
              console.log("Line item property removed successfully:", response);
              // alert("Property removed successfully!");
            },
            error: function (xhr, status, error) {
              console.error("Error removing property:", xhr.responseJSON || error);
              // alert("Failed to remove property.");
            }
          });

          const updates = {};
          updates[itemId] = qty;
          const sections = Alpine.store('xCartHelper').getSectionsToRender().map(s => s.id);          
          const updateData = {
            updates: updates, // Pass the updates object directly
            sections: sections // Include sections if needed for re-rendering
          };
          
            fetch(`${Shopify.routes.root}cart/update.js`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(updateData)
            })
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to update cart items');
                _this.closest('.certificate_product_prop').removeClass('has_loader');
              }
              return response.json();
            })
            .then(state => {
              console.log(state);
              const parsedState = state;

              function _addErrorMessage(itemId, message) {
                const lineItemError = document.getElementById(`LineItemError-${itemId}`);
                if (!lineItemError) return;
                lineItemError.classList.remove('hidden');
                lineItemError
                  .getElementsByClassName('cart-item__error-text')[0]
                  .innerHTML = message;
              }
            
              if (parsedState.status == '422') {
                _addErrorMessage(itemId, parsedState.message);
                this.updateCart(line);
              } else {
                const items = document.querySelectorAll('.cart-item');
                if (parsedState.errors) {
                  _addErrorMessage(itemId, parsedState.errors);
                  return;
                }
                
                Alpine.store('xCartHelper').getSectionsToRender().forEach((section => {
                  const sectionElement = document.querySelector(section.selector);
                  if (sectionElement) {
                    if (parsedState.sections[section.id])
                      sectionElement.innerHTML = getSectionInnerHTML(parsedState.sections[section.id], section.selector);
                  }
                }));
                  
                const currentItemCount = Alpine.store('xCartHelper').currentItemCount
                Alpine.store('xCartHelper').currentItemCount = parsedState.item_count;
                if (currentItemCount != parsedState.item_count) {
                  document.dispatchEvent(new CustomEvent("eurus:cart:items-changed"));
                }

                const lineItemError = document.getElementById(`LineItemError-${itemId}`);
                if (lineItemError) {lineItemError.classList.add('hidden');}
                
                const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
                
                
                if (items.length === parsedState.items.length && updatedValue !== parseInt(qty)) {
                  let message = '';
                  if (typeof updatedValue === 'undefined') {
                    message = window.Eurus.cart_error;
                  } else {
                    message = window.Eurus.cart_quantity_error_html.replace('[quantity]', updatedValue);
                  }
                  _addErrorMessage(itemId, message);
                }
              }
              let loadingEl = document.getElementById(`loading-${itemId}`);
              let removeEl = document.getElementById(`remove-${itemId}`);
              if(removeEl){
                removeEl.style.display = 'block';
              }
              if (loadingEl) {
                loadingEl.classList.add('hidden');
              }
              this.loading = false;
              _this.closest('.certificate_product_prop').removeClass('has_loader');
            })
            .catch(error => {
              console.error('Error updating cart:', error);
              _this.closest('.certificate_product_prop').removeClass('has_loader');
            });
        }

        this.t = setTimeout(() => {
          func();
        }, wait);
      }
      _postUpdateItem(subitemkey, subitemindex, 0, subitempid,mainitemkey, mainitemqty);
    }
  });

  $('body').on('change','.all_gift_wrap #gift_wrap_all', function(e){
    e.preventDefault();    
    var _this = $(this);    
    var subitemkey = $(this).attr('data-vid'),
        mainitempid = $(this).attr('data-mainitempid');
    _this.closest('.all_gift_wrap').addClass('has_loader');
    if($(this).prop('checked')){
      const sections = Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id);
      const sectionsUrl = window.location.pathname;
      console.log(subitemkey);
      const certData = {
        items: [
          {
            id: subitemkey,
            quantity: 1            
          }
        ],
        sections: sections,
        sections_url: sectionsUrl
      };

      fetch(`/cart/add.js`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(certData),
      })
      .then(response => {
          if (!response.ok) {
            throw new Error('Failed to update cart items');            
          }
          return response.json();
        })
      .then(state => {
        window.handleCartResponse(state, mainitempid);
        _this.closest('.all_gift_wrap').removeClass('has_loader');
      }).catch((error) => {
        console.error('Error:', error);
        _this.closest('.all_gift_wrap').removeClass('has_loader');
      });
    }else{ 
      if(_this.closest('#CartDrawer').length > 0){
        _this.closest('#CartDrawer').find(`.itemid_${subitemkey} .item-remove_btn`).trigger('click');
      }else{
        _this.closest('#MainContent').find(`.itemid_${subitemkey} [aria-label="button-remove"]`).trigger('click');  
      }
      
    }
  });

  $('body').on('click','.discount_finder_item_details .code_wrapper', function(){
    var $temp = $("<input>");
    var __this = $(this);
    $("#update-cart").append($temp);
    $temp.val(__this.find('.discount_code').text()).select();
    document.execCommand("copy");
    $temp.remove();    
    __this.find('.code_copy').text('Copied');
    setTimeout(function(){
      __this.find('.code_copy').text('Copy');
    },2000);
  });

  $.fn.isInViewport = function() {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();

    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
  };

  $(window).scroll(function(){
    if ($('.section-footer').isInViewport()) {      
      $('.fixed_nav,.sticky_add_to_cart').addClass('forcehidden');
    }else{
      $('.fixed_nav,.sticky_add_to_cart').removeClass('forcehidden');
    }
  });
  
  
  $('body').on('click','.available-offer-popup .close-offerbox', function(){
    $('.available-offer-popup').removeClass('active');
  });
  $('body').on('click','.available_offers_popup .offerpopup_mainbutton', function(){
    $('.available-offer-popup').addClass('active');
  });

  $('body').on('click','.available-offer-popup .discount_finder_item_cta_btn', function(){
    if($(this).closest('.offer-content').find('.additional-bank-desc').is(':visible')){
     $(this).closest('.offer-content').find('.additional-bank-desc').slideUp(); 
      $(this).find('.add_discount_cta_btn').text('View More');
    }else{
     $(this).closest('.offer-content').find('.additional-bank-desc').slideDown();
      $(this).find('.add_discount_cta_btn').text('View Less');
    }    
  });

  $('body').on('click','.buy_products-trust_badge',function(){
   $(this).parents('.product-info').find('input[name="quantity"]').val(2);
   $(this).parents('.product-info').find('button[name="add"]').trigger('click');
   $(this).parents('.product-info').find('input[name="quantity"]').val(1);
  });
});


if($(".continuous-timer-main").length > 0){
  
  // Set the countdown duration (1 hour in milliseconds)
  var countDownHours = parseInt(document.getElementById("continuous_timer").getAttribute("sale_countdown_time_hours"));
  var countDownMinutes = parseInt(document.getElementById("continuous_timer").getAttribute("sale_countdown_time_minutes"));
  var countDownDuration = (countDownHours * 60 * 60 * 1000) + (countDownMinutes * 60 * 1000);
  
  // Check if there's a stored start time in localStorage
  var storedStartTime = localStorage.getItem("startTime");
  var startTime;
  
  // If there's no stored start time, initialize it to the current time
  if (storedStartTime) {
    startTime = parseInt(storedStartTime, 10);
  } else {
    startTime = new Date().getTime();
    localStorage.setItem("startTime", startTime);
  }
  
  // Update the countdown every 1 second
  var x = setInterval(function () {
    // Get the current time
    var now = new Date().getTime();
  
    // Calculate the time elapsed since the start time
    var elapsed = now - startTime;
  
    // Find the remaining time in the current countdown
    var distance = countDownDuration - (elapsed % countDownDuration);
  
    // Time calculations for hours, minutes, and seconds
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
    // Build the display string
    var display = "";
    if (hours > 0) {
      display += ` &nbsp;<span>${hours}h</span>`;
    }
    display += ` &nbsp;<span>${minutes}m</span>` + ` &nbsp;<span>${seconds}s</span>`;
  
    // Output the result in an element with id="demo"
    document.getElementById("continuous_timer").innerHTML = display;
  
    // Reset the start time if a new countdown cycle begins
    if (distance <= 0) {
      startTime = new Date().getTime();
      localStorage.setItem("startTime", startTime);
    }
  }, 1000);
}


document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.querySelector(".share-btn");
  const popup = document.querySelector(".media-popup");
  const closeBtn = document.querySelector("span.close");
  const dshareBtn = document.querySelector(".desk-share");
  const dpopup = document.querySelector(".desk-pop");
  const dcloseBtn = document.querySelector(".desk-close");
  const dbody = document.querySelector(".temp-custom-product");

  // Show popup when clicking "Share"
  shareBtn.addEventListener("click", () => {
    popup.style.display = "block";
  });

  // Hide popup when clicking "X"
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
  });

  // Hide popup when clicking outside of it
  window.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.style.display = "none";
    }
  });
   dshareBtn.addEventListener("click", () => {
    dpopup.style.display = "block";
     dbody.style.overflow = "hidden";
     // dbody.style.opacity = "0";
     
  });

  // Hide popup when clicking "X"
  dcloseBtn.addEventListener("click", () => {
    dpopup.style.display = "none";
     dbody.style.overflow = "auto";
    
  });

  // Hide popup when clicking outside of it
  window.addEventListener("click", (e) => {
    if (e.target === dpopup) {
      dpopup.style.display = "none";
    }
  });
});
