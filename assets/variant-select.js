if (!window.Eurus.loadedScript.includes('variant-select.js')) {
  window.Eurus.loadedScript.push('variant-select.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xVariantSelect', (
        element,
        sectionId,
        isProductPage,
        unavailableText,
        productUrl,
        productId,
        showFirstImageAvaiable,
        chooseOption,
        productBundle,
        handleSectionId,
        firstAvailableVariantId,
        pageParam
      ) => ({
        variants: null,
        currentVariant: {},
        options: [],
        currentAvailableOptions: [],
        cachedResults: [],
        quickViewSectionId: 'quick-view',
        handleSectionId: sectionId,
        paramVariant: false,
        mediaGallerySource: [],
        isChange: false,
        optionConnect: "",
        mediaOption: "",
        initVariant() {
          this.variants = JSON.parse(this.$el.querySelector('[type="application/json"]').textContent);

          if (chooseOption) {
            this.handleSectionId = 'choose-option';
          }
          if (productBundle) {
            this.handleSectionId = handleSectionId;
          }

          document.addEventListener('eurus:cart:items-changed', () => {
            this.cachedResults = [];
            Alpine.store('xUpdateVariantQuanity').updateQuantity(sectionId, productUrl, this.currentVariant?.id);
          });

          this.$watch('options', () => {
            this._updateVariantSelector();
          });
        },
        initMedia() {
          this._updateMasterId();
          this._updateMedia();
        },
        _updateVariantSelector() {
          this._updateMasterId();
          this._updateVariantStatuses();
          if (!this.currentVariant) {
            this._dispatchUpdateVariant();
            this._setUnavailable();
            return;
          }
          if (firstAvailableVariantId != this.currentVariant.id) {
            this.paramVariant = true;
          }
          if (isProductPage && this.paramVariant) {
            window.history.replaceState({}, '', `?variant=${this.currentVariant.id}`);
          }
          if (chooseOption == '' && !isProductPage) { 
            this._updateImageVariant();
          }
          this._updateVariantInput();
          this._updateProductForms();
          this._setAvailable();
          Alpine.store('xPickupAvailable').updatePickUp(sectionId, this.currentVariant.id);

          const cacheKey = sectionId + '-' + this.currentVariant.id;
          if (this.cachedResults[cacheKey]) {
            const html = this.cachedResults[cacheKey];
            this._renderPriceProduct(html);
            this._renderSkuProduct(html);
            this._renderProductBadges(html);
            this._renderInventoryStatus(html);

            this._updateMedia(html);
            this._renderBuyButtons(html);
            this._setMessagePreOrder(html)
            this._setEstimateDelivery(html);
            this._setCartEstimateDelivery(html);
            this._setPreorderProperties(html);
            this._setBackInStockAlert(html);
            this._setPickupPreOrder(html);
            if (this.currentVariant.featured_media != null ) {
              this._updateColorSwatch(html);
            }
            this._dispatchUpdateVariant();
            this._dispatchVariantSelected(html);
            Alpine.store('xUpdateVariantQuanity').render(html, sectionId);
          } else {
            const variantId = this.currentVariant.id;
            
            let url = chooseOption?`${productUrl}?variant=${variantId}&section_id=${this.handleSectionId}&page=${pageParam}`:`${productUrl}?variant=${variantId}&section_id=${this.handleSectionId}`
            
            fetch(url)
              .then((response) => response.text())
              .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                if (this.currentVariant && variantId == this.currentVariant.id
                  && html.getElementById(`x-product-template-${productId}-${sectionId}`)) {
                  this._renderPriceProduct(html);
                  this._renderSkuProduct(html);
                  this._renderProductBadges(html);
                  this._renderInventoryStatus(html);
                  if (showFirstImageAvaiable) {
                    this._updateMedia(html);
                  } else if (this.isChange) {
                    this._updateMedia(html);
                  }
                  this._renderBuyButtons(html);
                  this._setMessagePreOrder(html);
                  this._setEstimateDelivery(html);
                  this._setPickupPreOrder(html);
                  this._setCartEstimateDelivery(html);
                  this._setPreorderProperties(html);
                  this._setBackInStockAlert(html);
                  if (this.currentVariant.featured_media != null ) {
                    this._updateColorSwatch(html);
                  }
                  Alpine.store('xUpdateVariantQuanity').render(html, sectionId);
                  this.cachedResults[cacheKey] = html;
                  
                  this._dispatchUpdateVariant(html);
                  this._dispatchVariantSelected(html);
                } else if (this.currentVariant && variantId == this.currentVariant.id) {
                  this._dispatchUpdateVariant(html);
                }
              });
          }
        },
        _dispatchVariantSelected(html) {
          document.dispatchEvent(new CustomEvent(`eurus:product-page-variant-select:updated:${sectionId}`, {
            detail: {
              currentVariantStatus: this.currentVariant?.available,
              currentAvailableOptions: this.currentAvailableOptions,
              options: this.options,
              html: html
            }
          }));
        },
        _updateVariantStatuses() {
          const selectedOptionOneVariants = this.variants.filter(
            (variant) => this.options[0] === this._decodeOptionValue(variant.option1)
          );
        
          this.options.forEach((option, index) => {
            this.currentAvailableOptions[index] = [];
            if (index === 0) return;
        
            const previousOptionSelected = this.options[index - 1];
            selectedOptionOneVariants.forEach((variant) => {
              if (
                variant.available &&
                this._decodeOptionValue(variant[`option${index}`]) === previousOptionSelected
              ) {
                this.currentAvailableOptions[index].push(
                  this._decodeOptionValue(variant[`option${index + 1}`])
                );
              }
            });
        
            // Auto-select next available option if current is unavailable
            if (!this.currentAvailableOptions[index].includes(this.options[index])) {
              this.options[index] = this.currentAvailableOptions[index][0] || null; // Set to first available option
            }
          });
        },
        _decodeOptionValue(option) {
          if (option) {
            return option
                    .replaceAll('\\/', '/');
          }
        },
        _renderInventoryStatus(html) {
          const destination = document.getElementById('block-inventory-' + sectionId);
          const source = html.getElementById('block-inventory-' + sectionId);
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _updateMedia(html) {
          let mediaWithVariantSelected = document.getElementById("product-media-" + sectionId) && document.getElementById("product-media-" + sectionId).dataset.mediaWithVariantSelected;

          if (!chooseOption && !productBundle && !mediaWithVariantSelected) {
            let splideEl = document.getElementById("x-product-" + sectionId);
            let slideVariant = ""
            let index = ""
            let activeEL = ""
            if (this.currentVariant && this.currentVariant.featured_media != null) {
              slideVariant = document.getElementsByClassName(this.currentVariant.featured_media.id + '-' + sectionId);
              index = parseInt(slideVariant[0].getAttribute('index'));
              activeEL = document.getElementById('postion-image-' + sectionId + '-' + this.currentVariant.featured_media.id);
            } else {
              slideVariant = splideEl.querySelector(".featured-image");
              index = parseInt(slideVariant.getAttribute('index'));
              activeEL = document.querySelector(`#stacked-${sectionId} .featured-image`);
            }
            if (splideEl) {
              if (splideEl.splide && slideVariant) {
                splideEl.splide.go(index)
              } else {
                document.addEventListener(`eurus:media-gallery-ready:${sectionId}`, () => {
                  if (splideEl.splide)
                    splideEl.splide.go(index);
                });
              }
            }
            if (!activeEL) return;
            

            if (html && !mediaWithVariantSelected) {
              let mediaGalleryDestination = html.getElementById(`stacked-${ sectionId }`);
              let mediaGallerySource = document.getElementById(`stacked-${ sectionId }`);

              if (mediaGallerySource && mediaGalleryDestination) {
                let firstChildSource = mediaGallerySource.querySelectorAll('div[data-media-id]')[0];
                let firstChildDestination = mediaGalleryDestination.querySelectorAll('div[data-media-id]')[0];
                if (firstChildDestination.dataset.mediaId != firstChildSource.dataset.mediaId && firstChildSource.dataset.index != 1) {
                  let sourceIndex = parseInt(firstChildSource.dataset.index);  
                  let positionOld = mediaGallerySource.querySelector(`div[data-media-id]:nth-of-type(${sourceIndex + 1})`);
                  mediaGallerySource.insertBefore(firstChildSource, positionOld);
                }

                mediaGallerySource.prepend(activeEL);
              }
            }
          }

          if (mediaWithVariantSelected) {
            this.updateMultiMediaWithVariant();
          }
        },
        _updateColorSwatch(html) {
          const showSwatchWithVariantImage = document.querySelector(`#variant-update-${ sectionId }`).dataset.showSwatchWithVariantImage;
          const destination = document.querySelector(`#variant-update-${ sectionId } [data-swatch="true"]`);
          if(destination && showSwatchWithVariantImage) {
            const source = html.querySelector(`#variant-update-${ sectionId } [data-swatch="true"]`);
            if (source) destination.innerHTML = source.innerHTML;
          }
        },
        _validateOption() {
          const mediaWithOption = document.querySelector(`#shopify-section-${sectionId} [data-media-option]`);
          if (mediaWithOption)
            this.mediaOption = mediaWithOption.dataset.mediaOption
        },
        updateMultiMediaWithVariant() {
          this._validateOption()
          if (!this.currentVariant)
            return;

          const variantInput = document.querySelector(`#shopify-section-${sectionId} [data-option-name="${this.mediaOption}"]`);

          if (!variantInput) {
            let variantMedias = ""
            if (!this.currentVariant.featured_media?.id) {
              variantMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-option].featured-image, #shopify-section-${ sectionId } [data-media-option].featured-image`); 
            } else {
              variantMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-option="${sectionId}-${this.currentVariant.featured_media.id}"], #shopify-section-${ sectionId } [data-media-option="${sectionId}-${this.currentVariant.featured_media.id}"]`);
            }
            let mediaActive = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-option=""], #shopify-section-${ sectionId } [data-media-option=""]`);
            let productMedias = document.querySelectorAll( `#ProductModal-${ sectionId } [data-media-option], #shopify-section-${ sectionId } [data-media-option]`);
            const newMedias = Array.prototype.concat.call( ...mediaActive, ...variantMedias)
            this._setActiveMedia(productMedias, newMedias, variantMedias);
            document.dispatchEvent(new CustomEvent("reload-thumbnail-" + sectionId));
          } else {
            const variantOptionIndex = variantInput && variantInput.dataset.optionIndex;
            const optionValue = this._handleText(this.currentVariant.options[variantOptionIndex]);
            var optionConnect = this.mediaOption + '-' + optionValue;
            
            this.optionIndex = variantOptionIndex;

            const mediaActive = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-type=""], #shopify-section-${ sectionId } [data-media-type=""]`)
            let variantMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-type="${optionConnect}"], #shopify-section-${ sectionId } [data-media-type="${optionConnect}"]`);     
            let showFeatured = false;
            if (!variantMedias.length) {
              variantMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-type].featured-image, #shopify-section-${ sectionId } [data-media-type].featured-image`); 
              showFeatured = true;
            }
  
            if (!variantMedias.length) {
              document.querySelectorAll( `#ProductModal-${ sectionId } [data-media-type], #shopify-section-${ sectionId } [data-media-type]`).forEach(function(media){
                media.classList.add('media_active');
                media.classList.add('splide__slide')
              });
              document.dispatchEvent(new CustomEvent("reload-thumbnail-" + sectionId));
              return;
            }
  
            const newMedias = Array.prototype.concat.call(...variantMedias , ...mediaActive)
            let productMedias = document.querySelectorAll( `#shopify-section-${ sectionId } [data-media-type], #ProductModal-${ sectionId } [data-media-type]`);
            
            this._setActiveMedia(productMedias, newMedias);
           
            if (this.optionConnect != optionConnect) {
              document.dispatchEvent(new CustomEvent("reload-thumbnail-" + sectionId));
              this.optionConnect = optionConnect;
            }
            
            if (showFeatured) {
              this._goToFirstSlide();
            }
          }
        },
        _setActiveMedia(productMedias, newMedias, activeMedia) {
          productMedias.forEach(function(media){
            media.classList.remove('media_active');
            media.classList.remove('splide__slide');
          });
          Array.from(newMedias).reverse().forEach(function(newMedia, position) {
            newMedia.classList.add('media_active');
            if (newMedia.classList.contains('media-slide')) {
              newMedia.classList.add('splide__slide');
            }
            let parent = newMedia.parentElement;
            if (activeMedia) {
              if (parent.firstChild != newMedia && Array.from(activeMedia).includes(newMedia)) {
                parent.prepend(newMedia);
              }
            } else {
              if (parent.firstChild != newMedia) {
                parent.prepend(newMedia);
              }
            }
          });

          if (activeMedia) {
            let parent = activeMedia.parentElement;
            parent && parent.prepend(activeMedia);
          }
        },
        _handleText(someString) {
          if (someString) {
            return someString.toString().replace('ı', 'i').replace('ß', 'ss').normalize('NFD').replace('-', ' ').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, "-");
          }
        },
        _goToFirstSlide() {
          if (this.currentVariant && !this.currentVariant.featured_image) {
            let splideEl = document.getElementById("x-product-" + sectionId);
            if (splideEl) {
              if (splideEl.splide && this.currentVariant && this.currentVariant.featured_image != null) {
                splideEl.splide.go(0);
              }
            }

            let activeEL = document.querySelector(`#stacked-${sectionId} .featured-image`);
            let stackedEL = document.getElementById('stacked-' + sectionId);
            if(stackedEL && activeEL) stackedEL.prepend(activeEL);
          }
        },
        onChange() {
          if (!this.isChange) {
            this.isChange = this.$el.parentNode.dataset.optionName;
          }
        },
        _updateMasterId() {
          this.currentVariant = this.variants.find((variant) => {
            return (
              variant.available &&
              !variant.options.map((option, index) => {
                return this.options[index] === option.replaceAll('\\/', '/');
              }).includes(false)
            );
          });
        
          if (!this.currentVariant) {
            this._setUnavailable(); // Call method to handle unavailable variants
          }
        },
        _updateVariantInput() {
          const productForms = document.querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}, #product-form-sticky-${sectionId}`);
          productForms.forEach((productForm) => {
            const input = productForm.querySelector('input[name="id"]');
            if (!input) return;
            input.value = this.currentVariant.id;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          })
        },
        _updateProductForms() {
          const productForms = document.querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}, #product-form-sticky-${sectionId}`);
          productForms.forEach((productForm) => {
            const input = productForm.querySelector('input[name="id"]');
            if (input) {
              input.value = this.currentVariant.id;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        },
        _renderPriceProduct(html) {
          console.log('insndnsindininsin')
          if(document.getElementById('certificate_product') && document.getElementById('certificate_product').checked ){            
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
            var compareprice = parseInt(document.getElementById('certificate_product').getAttribute('data-price')) + parseInt(this.currentVariant.compare_at_price);
            var price = parseInt(document.getElementById('certificate_product').getAttribute('data-price')) + parseInt(this.currentVariant.price);
            var prchtml = '';
            prchtml += `<div class="main-product-price price leading-none" data-price="${parseInt(this.currentVariant.price)}" data-compareprice="${parseInt(this.currentVariant.compare_at_price)}">
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
            const destination = document.getElementById('price-' + sectionId);
            destination.innerHTML = prchtml;
          }else{
            console.log('price-' + sectionId);
            const destination = document.getElementById('price-' + sectionId);
            const source = html.getElementById('price-' + sectionId);
            if (source && destination) destination.innerHTML = source.innerHTML;
          }
         
          const discounted_price_text = document.getElementById('discounted_price_text-' + sectionId);
          const new_discounted_price_text = html.getElementById('discounted_price_text-' + sectionId);
          if(discounted_price_text) discounted_price_text.innerHTML = new_discounted_price_text.innerHTML;
        },
        _renderSkuProduct(html) {
          const destination = document.getElementById('sku-' + sectionId);
          const source = html.getElementById('sku-' + sectionId);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _renderProductBadges(html) {
          const destination = document.getElementById('x-badges-' + sectionId);
          const source = html.getElementById('x-badges-'+ sectionId);
          
          if (source && destination) destination.innerHTML += source.innerHTML;
        },
        _renderBuyButtons(html) {
          const productForms = document.querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}, #product-form-sticky-${sectionId}`);
          const atcSource = html.getElementById('x-atc-button-' + sectionId);
          productForms.forEach((productForm) => {
            const atcDestination = productForm.querySelector('.add_to_cart_button');
            if (!atcDestination) return;
            
            if (atcSource && atcDestination) atcDestination.innerHTML = atcSource.innerHTML;
    
            if (this.currentVariant.available) {
              /// Enable add to cart button
              if (html.getElementById('form-gift-card-' + sectionId)) {
                document.getElementById('Recipient-checkbox-' + sectionId).checked && atcDestination.disabled ? atcDestination.setAttribute('disabled', 'disabled') : atcDestination.removeAttribute('disabled');
              } else {
                atcDestination.removeAttribute('disabled');
              }
            } else {
              atcDestination.setAttribute('disabled', 'disabled');
            }
          });
          const paymentButtonDestination = document.getElementById('x-payment-button-' + sectionId);
          const paymentButtonSource = html.getElementById('x-payment-button-' + sectionId);
          if (paymentButtonSource && paymentButtonDestination) {
            if (paymentButtonSource.classList.contains('hidden')) {
              paymentButtonDestination.classList.add('hidden');
            } else {
              paymentButtonDestination.classList.remove('hidden');
            }
          }
        },
        _setMessagePreOrder(html) {
          const msg = document.querySelector(`.pre-order-${sectionId}`);
          if (!msg) return;
          msg.classList.add('hidden');
          const msg_pre = html.getElementById(`pre-order-${sectionId}`);
          if (msg_pre) {
            msg.classList.remove('hidden');
            msg.innerHTML = msg_pre.innerHTML;
          }
        },
        _setEstimateDelivery(html) {
          const est = document.getElementById(`x-estimate-delivery-${sectionId}`);
          if (!est) return;
          const est_res = html.getElementById(`x-estimate-delivery-${sectionId}`);
          if (est_res.classList.contains('disable-estimate')) {
            est.classList.add('hidden');
          } else {
            est.classList.remove('hidden');
          }
        },
        _setPreorderProperties(html) {
          const preorder = document.getElementById(`preorder-${sectionId}`);
          const preorder_res = html.getElementById(`preorder-${sectionId}`);
          if (preorder && preorder_res) preorder.innerHTML = preorder_res.innerHTML;
        },
        _setCartEstimateDelivery(html) {
          const est = document.getElementById(`cart-edt-${sectionId}`);
          const est_res = html.getElementById(`cart-edt-${sectionId}`);
          if (est && est_res) est.innerHTML = est_res.innerHTML;
        },
        _setBackInStockAlert(html) {
          const destination = document.getElementById(`back_in_stock_alert-${sectionId}`);
          const source = html.getElementById(`back_in_stock_alert-${sectionId}`);
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _setPickupPreOrder(html) {
          const pickup = document.getElementById(`pickup-pre-order-${sectionId}`);
          if (!pickup) return;
          const pickup_res = html.getElementById(`pickup-pre-order-${sectionId}`);
          if (pickup_res.classList.contains('disable-pickup')) {
            pickup.classList.add('hidden');
          } else {
            pickup.classList.remove('hidden');
          }
        },
        _setUnavailable() {
          const price = document.getElementById(`price-` + sectionId);
          if (price) price.classList.add('hidden');

          const priceDesktop = document.getElementById(`price-sticky-${sectionId}`);
          if (priceDesktop) priceDesktop.classList.add('hidden');
          
          const inventory = document.getElementById(`block-inventory-` + sectionId);
          if (inventory) inventory.classList.add('hidden');
  
          const badges = document.getElementById(`x-badges-` + sectionId);
          if (badges) badges.classList.add('hidden');
  
          const pickup = document.getElementById(`pickup-` + sectionId);
          if (pickup) pickup.classList.add('hidden');
  
          const quantity = document.getElementById('x-quantity-' + sectionId);
          if (quantity) quantity.classList.add('unavailable');

          const msg_pre = document.querySelector(`.pre-order-${sectionId}`);
          if (msg_pre) msg_pre.classList.add('hidden');
          

          this._setBuyButtonUnavailable();
        },
        _setAvailable() {
          const price = document.getElementById(`price-` + sectionId);
          if (price) price.classList.remove('hidden');
  
          const inventory = document.getElementById(`block-inventory-` + sectionId);
          if (inventory) inventory.classList.remove('hidden');
  
          const badges = document.getElementById(`x-badges-` + sectionId);
          if (badges) badges.classList.remove('hidden');
  
          const pickup = document.getElementById(`pickup-` + sectionId);
          if (pickup) pickup.classList.remove('hidden');
  
          const quantity = document.getElementById('x-quantity-' + sectionId);
          if (quantity) quantity.classList.remove('unavailable');
        },
        _setBuyButtonUnavailable() {
          const productForms = document.querySelectorAll(`#product-form-${sectionId},  #product-form-sticky-${sectionId}`);
          productForms.forEach((productForm) => {
            const addButton = productForm.querySelector('.add_to_cart_button');
            if (!addButton) return;
            addButton.setAttribute('disabled', 'disabled');
            const addButtonText = addButton.querySelector('.x-atc-text');
            if (addButtonText) addButtonText.textContent = unavailableText;
          });
        },
        _dispatchUpdateVariant(html="") {
          document.dispatchEvent(new CustomEvent(`eurus:product-card-variant-select:updated:${sectionId}`, {
            detail: {
              currentVariant: this.currentVariant,
              currentAvailableOptions: this.currentAvailableOptions,
              options: this.options,
              html: html
            }
          }));
        },
        _updateImageVariant() {
          if (this.currentVariant != null) {
            let featured_image = ""
            if (this.currentVariant.featured_image != null) {
              featured_image = this.currentVariant.featured_image.src;
            }
            Alpine.store('xPreviewColorSwatch').updateImage(this.$el, productUrl, featured_image, this.currentVariant.id)
          }
        },
        initEventSticky() {
          document.addEventListener(`eurus:product-page-variant-select-sticky:updated:${sectionId}`, (e) => {
            this.updateVariantSelector(e.detail.inputId, e.detail.targetUrl);
          });
        },
        changeSelectOption(event) {
          const input = event.target.selectedOptions[0];
          const inputId = input.id;
          const targetUrl = input.dataset.productUrl;
          this.updateVariantSelector(inputId, targetUrl);
        },
        updateVariantSelector(inputId, targetUrl) {
          if (chooseOption) {
            this.handleSectionId = 'choose-option';
          }
          if (productBundle) {
            this.handleSectionId = handleSectionId;
          }
          this.currentVariant = this._getVariantData(inputId);
          
    
          let callback = () => {};
          if (targetUrl == '') {
            targetUrl = element.dataset.url;
          }
          if (element.dataset.url !== targetUrl) {
            this._updateURL(targetUrl);
            callback = (html) => {
              this._handleSwapProduct(sectionId, html);
              this._handleSwapQuickAdd(html);
              this._renderCardBundle(html);
              this._renderCardFBT(html);
            };
          } else if (!this.currentVariant) {
            this._setUnavailable();
            callback = (html) => {
              this._updateOptionValues(html);
            };
          } else {
            this._updateMedia();
            this._updateURL(targetUrl);
            this._updateVariantInput();
            callback = this._handleUpdateProductInfo(sectionId);
          }
    
          this._renderProductInfo(targetUrl, callback);
        },
        _renderProductInfo(url, callback) {
          let params = this.currentVariant
            ? `variant=${this.currentVariant?.id}`
            : `option_values=${this._getSelectedOptionValues().join(',')}`;
          if (chooseOption) {
            params = this.currentVariant
            ? `variant=${this.currentVariant?.id}&page=${pageParam}`
            : `option_values=${this._getSelectedOptionValues().join(',')}&page=${pageParam}`;
          }
          const link = `${url}?section_id=${this.handleSectionId}&${params}`;
      
          if (this.cachedResults[link]) {
            const html = this.cachedResults[link];
            callback(html);
          } else {
            fetch(link)
              .then((response) => response.text())
              .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                callback(html);
                this.cachedResults[link] = html;
              })
          }
        },
        _handleUpdateProductInfo() {
          return (html) => {
            this._renderPriceProduct(html);
            this._renderProductBadges(html);
            this._renderInventoryStatus(html);
            this._renderBuyButtons(html);
            this._setMessagePreOrder(html);
            this._setEstimateDelivery(html);
            this._setPickupPreOrder(html);
            Alpine.store('xUpdateVariantQuanity').render(html, this.handleSectionId);
            this._dispatchUpdateVariant(html);
            this._dispatchVariantSelected(html);
            this._updateOptionValues(html);
            Alpine.store('xPickupAvailable').updatePickUp(sectionId, this.currentVariant.id);
            this._renderCardBundle(html);
            this._renderCardFBT(html);
          };
        },
        _updateOptionValues(html) {
          const variantSelects = html.querySelector('.variant-selects');
          if (variantSelects) element.innerHTML = variantSelects.innerHTML;
        },
        _getVariantData(inputId) {
          return JSON.parse(this._getVariantDataElement(inputId).textContent);
        },
      
        _getVariantDataElement(inputId) {
          return element.querySelector(`script[type="application/json"][data-resource="${inputId}"]`);
        },
        _updateURL(url) {
          if (!isProductPage) return;
          window.history.replaceState({}, '', `${url}${this.currentVariant?.id ? `?variant=${this.currentVariant.id}` : ''}`);
        },
        _getSelectedOptionValues() {
          return Array.from(element.querySelectorAll('select, fieldset input:checked')).map(
            (element) => element.dataset.optionValueId
          );
        },
        _renderCardBundle(html) {
          const destination = element.closest(".x-product-bundle-data");
          const card = html.getElementById('card-product-bundle-'+ this.handleSectionId);
          if (!card) return;
          const source = card.querySelector(".x-product-bundle-data");
          
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _renderCardFBT(html) {
          const destination = element.closest(".card-product-fbt");
          const source = html.querySelector('.card-product-fbt-clone .card-product-fbt');
          
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _handleSwapProduct(sectionId, html) {
          const destination = document.querySelector('.x-product-' + sectionId);
          const source = html.querySelector('.x-product-' + sectionId);
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _handleSwapQuickAdd(html) {
          const destination = element.closest(".choose-options-content");
          const source = html.querySelector('.choose-options-content');
          if (source && destination) destination.innerHTML = source.innerHTML;
        }
      }))
    });
  });

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xStickyATC', (sectionId) => ({
        openDetailOnMobile: false,
        currentAvailableOptions: [],
        options: [],
        init() {
          this.variants = xParseJSON(this.$el.getAttribute('x-variants-data'));
          console.log('hdhuhuhd');

          document.addEventListener('eurus:product-page-variant-select:updated', (e) => {
            this.currentAvailableOptions = e.detail.currentAvailableOptions,
            this.options = e.detail.options;
            console.log(e.detail);

            this.renderProductPrice(e.detail.html);
            this.renderMedia(e.detail.html);
          });
        },
        renderProductPrice(html) {
          const destinations = document.querySelectorAll(`.price-sticky-${sectionId}`);
          destinations.forEach((destination) => {            
            const source = html.getElementById('price-sticky-' + sectionId);
            if (source && destination) destination.innerHTML = source.innerHTML;
          })  
        },
        renderMedia(html) {
          const destination = document.getElementById('product-image-sticky-' + sectionId);
          const source = html.getElementById('product-image-sticky-' + sectionId);
  
          if (source && destination) destination.innerHTML = source.innerHTML;
        }
      }))
    })
  });

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xPickupAvailable', {
        updatePickUp(id, variantId) {
          const container = document.getElementsByClassName('pick-up-'+ id)[0];
          if (!container) return;
  
          fetch(window.Shopify.routes.root + `variants/${variantId}/?section_id=pickup-availability`)
            .then(response => response.text())
            .then(text => {
              const pickupAvailabilityHTML = new DOMParser()
                .parseFromString(text, 'text/html')
                .querySelector('.shopify-section');
  
              container.innerHTML = pickupAvailabilityHTML.innerHTML;
            })
            .catch(e => {
              console.error(e);
            }); 
        }
      });
    });
  });
  
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xUpdateVariantQuanity', {
        updateQuantity(sectionId, productUrl, currentVariant) {
          const quantity = document.getElementById('x-quantity-' + sectionId);
          if (!quantity) return;
          const url = currentVariant ? `${productUrl}?variant=${currentVariant}&section_id=${sectionId}` :
                        `${productUrl}?section_id=${sectionId}`;
          fetch(url)
            .then((response) => response.text())
            .then((responseText) => {
              let html = new DOMParser().parseFromString(responseText, 'text/html');
              this.render(html, sectionId);
            });
        },
        render(html, sectionId) {
          const destination = document.getElementById('x-quantity-' + sectionId);
          const source = html.getElementById('x-quantity-'+ sectionId);
          if (source && destination) destination.innerHTML = source.innerHTML;
        }
      });
    });
  });
}