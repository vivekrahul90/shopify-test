if (!window.Eurus.loadedScript.includes('coupon-code.js')) {
  window.Eurus.loadedScript.push('coupon-code.js');
  
  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data("xCounponCodeList", (sectionId) => ({
        loading: true,
        load() {
          this.loading = true;
          let url = `${window.location.pathname}?section_id=${sectionId}`;
          fetch(url, {
            method: 'GET'
          }).then(
            response => response.text()
          ).then(responseText => {
            const html = (new DOMParser()).parseFromString(responseText, 'text/html');
            const contentId = `x-promo-code-list-${sectionId}`;
            const newContent = html.getElementById(contentId);
            if (newContent && !document.getElementById(contentId)) {
              container.appendChild(newContent);
            }
            this.loading = false;
          })
        }
      }));
      
      Alpine.data("xCounponCode", () => ({
        coppySuccess: false,
        loading: false,
        disableCoupon: false,
        disableComing: false,
        discountCode: "",
        errorMessage: false,
        appliedDiscountCode: false,
        load(discountCode) {
          this.setAppliedButton(discountCode)
          document.addEventListener(`eurus:cart:discount-code:change`, (e) => {
            this.setAppliedButton(discountCode)
          })
        },
        copyCode() {
          if (this.coppySuccess) return;

          const discountCode = this.$refs.code_value.textContent.trim();
          navigator.clipboard.writeText(discountCode).then(
            () => {
              this.coppySuccess = true;

              setTimeout(() => {
                this.coppySuccess = false;
              }, 5000);
            },
            () => {
              alert('Copy fail');
            }
          );
        },
        applyCouponCode(discountCode, isCart=false) {
          Alpine.store('xCounponCodeDetail').discountFaild = false;
          Alpine.store('xCounponCodeDetail').discountApplied =  false;
          Alpine.store('xCounponCodeDetail').discountCorrect = false;
          Alpine.store('xCounponCodeDetail').getDiscountCode();
          let appliedDiscountCodes = JSON.parse(JSON.stringify(Alpine.store('xCounponCodeDetail').appliedDiscountCodes))
          const appliedDiscount = document.querySelectorAll(".discount-title");
          let checkedDiscount = false;
          if (appliedDiscount.length > 0) {
            appliedDiscount.forEach((discount) => {
              if (discount.innerText == discountCode) checkedDiscount = true;
            });
          }
          if (checkedDiscount) {
            Alpine.store('xCounponCodeDetail').discountApplied = true;
            document.querySelector("#x-cart-discount-field").value = '';
            this.discountCode = '';
            setTimeout(() => {
              Alpine.store('xCounponCodeDetail').discountApplied = false;
            }, 3000);
            return true;
          }
          if (discountCode) {
            let discountCodes = appliedDiscountCodes.length > 0 ? [...appliedDiscountCodes, discountCode].join(",") : discountCode;
            document.cookie = `eurus_discount_code=${discountCodes}; path=/`;

            this.loading = true;
            let cartDrawer = false;
            let cartPage = false;
            fetch(`/checkout?discount=${discountCodes}`)
            .then(() => {
              fetch('/cart/update.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  "sections":  Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id)
                }),
              }).then(response=>{
                return response.json();
              }).then((response) => {
                if (response.status != '422') {
                  Alpine.store('xCartHelper').getSectionsToRender().forEach((section => {
                    const sectionElement = document.querySelector(section.selector);
                    if (sectionElement) {
                      if (response.sections[section.id]) {
                        sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
                        if (section.selector == '#CartDrawer' || section.selector == '#main-cart-footer' ) {
                          cartDrawer = getSectionInnerHTML(response.sections[section.id], section.selector);
                        }
                        if(section.selector == '#main-cart-items') {
                          cartPage =  getSectionInnerHTML(response.sections[section.id], section.selector);
                        }
                      }
                    }
                  }));
                  checkedDiscount = false;
                  const parser = new DOMParser();
                  if (cartPage) {
                    const cartPageHtml = parser.parseFromString(cartPage, 'text/html');
                    const discountTitleCartPage = cartPageHtml.querySelectorAll(".discount-title");
                    if (discountTitleCartPage.length > 0) {
                      discountTitleCartPage.forEach((discount) => {
                        if (discount.innerText == discountCode) checkedDiscount = true;
                      });
                    }
                  }
                  if (cartDrawer) { 
                    const cartDrawerHtml = parser.parseFromString(cartDrawer, 'text/html');
                    const discountTitle = cartDrawerHtml.querySelectorAll(".discount-title");
                    if (discountTitle.length > 0) {
                      discountTitle.forEach((discount) => {
                        if (discount.innerText == discountCode) checkedDiscount = true;
                      });
                    }
                  }
                  if (checkedDiscount) {
                    Alpine.store('xCounponCodeDetail').discountCorrect = true;
                  } else {
                    Alpine.store('xCounponCodeDetail').discountFaild = true;
                  }
                  Alpine.store('xCounponCodeDetail').appliedDiscountCodes.push(discountCode)
                  Alpine.store('xCartHelper').currentItemCount = parseInt(document.querySelector('#cart-icon-bubble span').innerHTML);
                  document.dispatchEvent(new CustomEvent(`eurus:cart:discount-code:change`));
                  if (isCart == false) {
                    this.setAppliedButton(discountCode)
                    if (Alpine.store('xCartHelper').currentItemCount == 0) {
                      const elementError = this.$el.closest('.promo-code-item').querySelector('.error-message');
                      this.errorMessage = true;
                      elementError.classList.remove('hidden', 'opacity-0');
                      elementError.classList.add('block', 'opacity-100');
  
                      setTimeout(function() {
                        elementError.classList.remove('block', 'opacity-100');
                        elementError.classList.add('hidden', 'opacity-0');
                      }, 3000);
                    } else {
                      this.errorMessage = false;
                      Alpine.store('xMiniCart').openCart();
                    }
                  }
                }
              }).finally(() => {
                this.loading = false;
                setTimeout(() => {
                  Alpine.store('xCounponCodeDetail').discountFaild = false;
                }, 5000);
                setTimeout(() => {
                  Alpine.store('xCounponCodeDetail').discountCorrect = false;
                }, 3000);
              });
            })
            .catch(function(error) {
              console.error('Error:', error);
            })
          }
        },
        handleScheduleCoupon(el) {
          let settings = xParseJSON(el.getAttribute('x-countdown-data'));
          let timeSettings = Alpine.store('xHelper').handleTime(settings);
          if (timeSettings.distance < 0 && settings.set_end_date) {
            this.disableCoupon = true;
          } else if ( timeSettings.startTime > timeSettings.now) {
            this.disableCoupon = true;
            this.disableComing = true;
          }
        },
        onChange() {
          this.discountCode = this.$el.value;
        },
        applyDiscountToCart() {
          this.applyCouponCode(this.discountCode, true);
        },
        setAppliedButton(discountCode) {
          let appliedDiscountCodes = JSON.parse(JSON.stringify(Alpine.store('xCounponCodeDetail').appliedDiscountCodes))
          if (discountCode && appliedDiscountCodes.indexOf(discountCode) != -1) {
            this.appliedDiscountCode = true;
          } else {
            this.appliedDiscountCode = false;
          }
        }
      }));

      Alpine.store('xCounponCodeDetail', {
        show: false,
        promoCodeDetail: {},
        sectionID: "",
        discountCodeApplied: "",
        appliedDiscountCodes: [],
        cachedResults: [],
        loading: false,
        cartEmpty: true,
        discountFaild: false,
        discountApplied: false,
        discountCorrect: false,
        handleCouponSelect(shopUrl) {
          var _this = this;
          const promoCodeDetail = JSON.parse(JSON.stringify(this.promoCodeDetail));
  
          document.addEventListener('shopify:section:select', function(event) {
            if (event.target.classList.contains('section-promo-code') == false) {
              if (window.Alpine) {
                _this.close();
              } else {
                document.addEventListener('alpine:initialized', () => {
                  _this.close();
                });
              }
            }
          })

          if(promoCodeDetail && promoCodeDetail.blockID && promoCodeDetail.sectionID) {
            this.promoCodeDetail = xParseJSON(document.getElementById('x-data-promocode-' + promoCodeDetail.blockID).getAttribute('x-data-promocode'));
            let contentContainer = document.getElementById('PromoCodeContent-' + this.promoCodeDetail.sectionID);
            if (this.cachedResults[this.promoCodeDetail.blockID]) {
              contentContainer.innerHTML = this.cachedResults[this.promoCodeDetail.blockID];
              return true;
            }
            if (this.promoCodeDetail.page != '') {
              let url = `${shopUrl}/pages/${this.promoCodeDetail.page}`;
              fetch(url, {
                method: 'GET'
              }).then(
                response => response.text()
              ).then(responseText => {
                const html = (new DOMParser()).parseFromString(responseText, 'text/html');
                contentContainer.innerHTML = html.querySelector(".page__container .page__body").innerHTML;
              })
            } else if (this.promoCodeDetail.details != '') {
              contentContainer.innerHTML = this.promoCodeDetail.details;
              contentContainer.innerHTML = contentContainer.textContent;
            }
          }
        },
        load(el, blockID, shopUrl) {
          this.promoCodeDetail = xParseJSON(el.closest('#x-data-promocode-' + blockID).getAttribute('x-data-promocode'));
          let contentContainer = document.getElementById('PromoCodeContent-' + this.promoCodeDetail.sectionID);
          this.sectionID = this.promoCodeDetail.sectionID;
          if (this.cachedResults[blockID]) {
            contentContainer.innerHTML = this.cachedResults[blockID];
            return true;
          }
          if (this.promoCodeDetail.page != '') {
            this.loading = true;
            let url = `${shopUrl}/pages/${this.promoCodeDetail.page}`;
            fetch(url, {
              method: 'GET'
            }).then(
              response => response.text()
            ).then(responseText => {
              const html = (new DOMParser()).parseFromString(responseText, 'text/html');
              const content = html.querySelector(".page__container .page__body").innerHTML;
              contentContainer.innerHTML = content;
              this.cachedResults[blockID] = content;
            }).finally(() => {
              this.loading = false;
            })
          } else if (this.promoCodeDetail.details != '') {
            contentContainer.innerHTML = this.promoCodeDetail.details;
            contentContainer.innerHTML = contentContainer.textContent;
          }
        },
        showPromoCodeDetail() {
          this.show = true;
          Alpine.store('xPopup').open = true;
        },
        close() {
          this.show = false;
          Alpine.store('xPopup').open = false;
        },
        getDiscountCode() {
          let cookieValue = document.cookie.match('(^|;)\\s*' + 'eurus_discount_code' + '\\s*=\\s*([^;]+)');
          let appliedDiscountCodes = cookieValue ? cookieValue.pop() : '';
          if (appliedDiscountCodes) {
            this.appliedDiscountCodes = appliedDiscountCodes.split(",");
          }
        }
      });
    });
  });
}