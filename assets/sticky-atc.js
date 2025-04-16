if (!window.Eurus.loadedScript.includes('sticky-atc.js')) {
  window.Eurus.loadedScript.push('sticky-atc.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xStickyATC', (sectionId, is_combined) => ({
        openDetailOnMobile: false,
        currentAvailableOptions: [],
        options: [],
        init() {
          if (!is_combined) {
            this.variants = xParseJSON(this.$el.getAttribute('x-variants-data'));
          }

          document.addEventListener(`eurus:product-page-variant-select:updated:${sectionId}`, (e) => {
            if (is_combined) {
              this.renderVariant(e.detail.html);
            } else {
              this.currentAvailableOptions = e.detail.currentAvailableOptions,
              this.options = e.detail.options;
            }

            this.renderProductPrice(e.detail.html);
            this.renderMedia(e.detail.html);
          });
        },
        renderProductPrice(html) {
          const destinations = document.querySelectorAll(`.price-sticky-${sectionId}`);
          if(document.getElementById('certificate_product') && document.getElementById('certificate_product').checked){  
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
            var selectedvariant;
            $(this.variants).each(function(i,e){
              if(e.title == $('.product-info .variant-selects input:checked').val())  {
                selectedvariant = e;
              }
            });
            console.log(selectedvariant);
            var currencyFormat = window.Eurus.currencyCodeEnabled ? window.Eurus.moneyWithCurrencyFormat : window.Eurus.moneyFormat;
            var compareprice = parseInt(document.getElementById('certificate_product').getAttribute('data-price')) + parseInt(selectedvariant.compare_at_price);
            var price = parseInt(document.getElementById('certificate_product').getAttribute('data-price')) + parseInt(selectedvariant.price);
            var prchtml = '';
            prchtml += `<div class="main-product-price price leading-none" data-price="${parseInt(selectedvariant.price)}" data-compareprice="${parseInt(selectedvariant.compare_at_price)}">
            <div class="no-collage:mb-2">
              <div class="hidden">${formatMoney(price, currencyFormat)}</div>`;
            if(compareprice > price){
              prchtml += `<div class="">
                  <small class="cap rtl:inline-block">
                    <s class="rtl:leading-tight">${formatMoney(compareprice, currencyFormat)}</s>
                  </small>
                  <span class="price-sale selection:bg-text-[rgb(var(--colors-price-sale),0.2)] ml-1 rtl:mr-1 rtl:ml-0">${formatMoney(price, currencyFormat)}</span>
                </div>`;
            }else{
              prchtml += `<p class="price">
                  <span>${formatMoney(price, currencyFormat)}</span>
                </p>`;
            }
            prchtml += `</div></div>`;
            destinations.forEach((destination) => {
              const source = html.getElementById('price-sticky-' + sectionId);
              if (source && destination) destination.innerHTML = prchtml;
            })
          }else{
           destinations.forEach((destination) => {
              const source = html.getElementById('price-sticky-' + sectionId);
              if (source && destination) destination.innerHTML = source.innerHTML;
            }) 
          }          
        },
        renderMedia(html) {
          const destination = document.getElementById('product-image-sticky-' + sectionId);
          const source = html.getElementById('product-image-sticky-' + sectionId);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        renderVariant(html) {
          const destination = document.getElementById('variant-update-sticky-' + sectionId);
          const source = html.getElementById('variant-update-sticky-' + sectionId);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        changeOptionSticky(event) {
          const input = event.target.selectedOptions[0];
          const inputId = input.id;
          const targetUrl = input.dataset.productUrl;
          document.dispatchEvent(new CustomEvent(`eurus:product-page-variant-select-sticky:updated:${sectionId}`, {
            detail: {
              inputId: inputId,
              targetUrl: targetUrl
            }
          }));
        }
      }))
    })
  })
}