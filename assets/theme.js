const installMediaQueryWatcher = (mediaQuery, changedCallback) => {
  const mq = window.matchMedia(mediaQuery);
  mq.addEventListener('change', e => changedCallback(e.matches));
  changedCallback(mq.matches);
};

const deferScriptLoad = (name, src, onload, requestVisualChange = false) => {
  window.Eurus.loadedScript.push(name);
  
  (events => {
    const loadScript = () => {
      events.forEach(type => window.removeEventListener(type, loadScript));
      clearTimeout(autoloadScript);

      const initScript = () => {
        const script = document.createElement('script');
        script.setAttribute('src', src);
        script.setAttribute('defer', '');
        script.onload = () => {
          document.dispatchEvent(new CustomEvent(name + ' loaded'));
          onload();
        };

        document.head.appendChild(script);
      }

      if (requestVisualChange) {
        if (window.requestIdleCallback) {
          requestIdleCallback(initScript);
        } else {
          requestAnimationFrame(initScript);
        }
      } else {
        initScript();
      }
    };

    let autoloadScript;
    if (Shopify.designMode) {
      loadScript();
    } else {
      const wait = window.innerWidth > 767 ? 2000 : 5000;
      events.forEach(type => window.addEventListener(type, loadScript, {once: true, passive: true}));
      autoloadScript = setTimeout(() => {
        loadScript();
      }, wait);
    }
  })(['touchstart', 'mouseover', 'wheel', 'scroll', 'keydown']);
}

const getSectionInnerHTML = (html, selector = '.shopify-section') => {
  return new DOMParser()
    .parseFromString(html, 'text/html')
    .querySelector(selector).innerHTML;
}

const xParseJSON = (jsonString) => {
  jsonString = String.raw`${jsonString}`;
  jsonString = jsonString.replaceAll("\\","\\\\").replaceAll('\\"', '\"');

  return JSON.parse(jsonString);
}

window.addEventListener("pageshow", () => {
  document.addEventListener('alpine:init', () => {
    if (Alpine.store('xMiniCart')) {
      if (Alpine.store('xMiniCart').needReload) {
        Alpine.store('xMiniCart').reLoad();
      }
      const isCartPage = document.getElementById("main-cart-items");
      if (isCartPage && Alpine.store('xMiniCart').needReload) {
        location.reload();
      }
      Alpine.store('xMiniCart').needReload = true;
    }
  })
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xDarkMode', {
      toggleThemeMode() {
        if (document.documentElement.classList.contains('dark')) {
          localStorage.eurus_theme = 0;
          document.documentElement.classList.remove('dark');
        } else {
          localStorage.eurus_theme = 1;
          document.documentElement.classList.add('dark');
        }
        Alpine.store('xHeaderMenu').setTopStickyHeader();
      }
    });

    Alpine.store('xHelper', {
      countdown(configs, callback) {
        let endDate = new Date(
          configs.end_year,
          configs.end_month - 1,
          configs.end_day,
          configs.end_hour,
          configs.end_minute
        );
        const endTime = endDate.getTime() + (-1 * configs.timezone * 60 - endDate.getTimezoneOffset()) * 60 * 1000;
        
        let startTime;
        if (configs.start_year) {
          let startDate = new Date(
            configs.start_year,
            configs.start_month - 1,
            configs.start_day,
            configs.start_hour,
            configs.start_minute
          );
          startTime = startDate.getTime() + (-1 * configs.timezone * 60 - startDate.getTimezoneOffset()) * 60 * 1000;
        } else {
          startTime = new Date().getTime();
        }

        let x = setInterval(function() {
          let now = new Date().getTime();
          let distance = endTime - now;

          if (distance < 0 || startTime > now) {
            callback(false, 0, 0, 0, 0);
            clearInterval(x);
          } else {
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            callback(true, seconds, minutes, hours, days);
          }
        }, 1000);
      },
      canShow(configs) {
        let endDate = new Date(
          configs.end_year,
          configs.end_month - 1,
          configs.end_day,
          configs.end_hour,
          configs.end_minute
        );
        const endTime = endDate.getTime() + (-1 * configs.timezone * 60 - endDate.getTimezoneOffset()) * 60 * 1000;
        
        let startTime;
        if (configs.start_year) {
          let startDate = new Date(
            configs.start_year,
            configs.start_month - 1,
            configs.start_day,
            configs.start_hour,
            configs.start_minute
          );
          startTime = startDate.getTime() + (-1 * configs.timezone * 60 - startDate.getTimezoneOffset()) * 60 * 1000;
        } else {
          startTime = new Date().getTime();
        }
        let now = new Date().getTime();
        let distance = endTime - now;
        if (distance < 0 || startTime > now) {
          return false;
        } 
        return true;
      },
      handleTime(configs) {
        let endDate = new Date(
          configs.end_year,
          configs.end_month - 1,
          configs.end_day,
          configs.end_hour,
          configs.end_minute
        );
        const endTime = endDate.getTime() + (-1 * configs.timezone * 60 - endDate.getTimezoneOffset()) * 60 * 1000;
        
        let startTime;
        if (configs.start_year) {
          let startDate = new Date(
            configs.start_year,
            configs.start_month - 1,
            configs.start_day,
            configs.start_hour,
            configs.start_minute
          );
          startTime = startDate.getTime() + (-1 * configs.timezone * 60 - startDate.getTimezoneOffset()) * 60 * 1000;
        } else {
          startTime = new Date().getTime();
        }
        let now = new Date().getTime();
        let distance = endTime - now;
        return { "startTime": startTime, "endTime": endTime, "now": now, "distance": distance};
      }
    });
  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.data('xCart', () => ({
      t: '',
      loading: false,
      updateItemQty(itemId, line, itemtitle, itemproductid, subitemindex) {
        let qty = parseInt(document.getElementById(`cart-qty-${itemId}`).value);
        if (this.validateQty(qty)) {
          clevertap.event.push('Cart_quanitity_change', {
            'Change in quantity': qty,
            'Product name': itemtitle
          });
          this._postUpdateItem(itemId, line, qty, itemproductid, subitemindex);
        }
      },
      minusItemQty(itemId, line, itemtitle, itemproductid, subitemindex) {
        let qty = parseInt(document.getElementById(`cart-qty-${itemId}`).value);
        if (this.validateQty(qty)) {
          if (qty > 0) {
            qty -= 1;
            // document.getElementById(`cart-qty-${itemId}`).value = qty;
          }
          clevertap.event.push('Cart_quanitity_change', {
            'Change in quantity': qty,
            'Product name': itemtitle
          });
          this._postUpdateItem(itemId, line, qty, itemproductid, subitemindex);
        }
      },
      plusItemQty(itemId, line, itemtitle, itemproductid, subitemindex) {
        let qty = parseInt(document.getElementById(`cart-qty-${itemId}`).value);
        if (this.validateQty(qty)) {
          if (qty >= 0) {
            qty += 1;            
          }          
          
          clevertap.event.push('Cart_quanitity_change', {
            'Change in quantity': qty,
            'Product name': itemtitle
          });
          this._postUpdateItem(itemId, line, qty, itemproductid, subitemindex);
        }
      },
      removeItem(itemId, line, itemtitle, itemproductid, subitemindex) {
        console.log('hihihihihihihi');
        this._postUpdateItem(itemId, line, 0, itemproductid, subitemindex, 0);
      },
      handleKeydown(evt, el) {
        if (evt.key !== 'Enter') return;
        evt.preventDefault();
        el.blur();
        el.focus();
      },
      _postUpdateItem(itemId, line, qty, itemproductid, subitemindex, wait = 500) {
        clearTimeout(this.t);
        console.log(itemId,'',line,'',qty,'',itemproductid,'',subitemindex);
        const func = () => {
          var hasfreeitems = 0;
          var maxqty = 100000;
          var hastotlqty = 0;
          var thiitemqty = 0;
          $.ajax({
            type: "GET",
            url: "/cart.js",
            dataType: 'json',
            async: false,
            error: function(){
              console.log('err')
            },
            success: function(data){
              $(data.items).each(function(i,e){
                console.log(itemId, e.key);
                if(e.properties['_maxqty'] && e.product_id == itemproductid){
                  maxqty = parseInt(e.properties['_maxqty']);
                  if(itemId != e.key){
                   hasfreeitems += e.quantity; 
                  }                  
                }
                if(e.properties['_certificate_item'] && qty == 0 && e.product_id == itemproductid){
                   hastotlqty += e.quantity; 
                   thiitemqty = e.quantity;
                }
              });
            }
          });
          // console.log(subitemindex)
          // if(subitemindex != 0){
          //   $.ajax({
          //     type: 'POST',
          //     url: '/cart/change.js',
          //     data: {
          //         line: subitemindex,
          //         quantity: qty
          //     },
          //     async: false,
          //     dataType: 'json',
          //     success: function () {
          //       console.log('success');
          //     },
          //  });
          // }
          console.log(hasfreeitems, maxqty, qty);
          hasfreeitems += qty;
          if(hasfreeitems <= maxqty){
            console.log(hasfreeitems,maxqty);
            if(hasfreeitems == maxqty){
              $('.product-page, .card-product, .choose-options-mobile').find('.hasmsg.classproduct-'+itemproductid).parent().find('.qty_err_msg').remove();
              $('.classproduct-'+itemproductid).attr('disabled','disabled').attr('type','button');
              $('.product-page .dummybtn').show();
              $('.product-page .add_to_cart_button').attr('style','display: none !important;');
              $('.product-page, .card-product, .choose-options-mobile').find('.hasmsg.classproduct-'+itemproductid).before(`<p class="qty_err_msg text-center">You can't add more quantity of this item</p>`);
            }else if(hasfreeitems < maxqty){
              $('.classproduct-'+itemproductid).removeAttr('disabled').attr('type','submit');
              $('.product-page .dummybtn').hide();
              $('.product-page .add_to_cart_button').show();
              $('.product-page, .card-product, .choose-options-mobile').find('.hasmsg.classproduct-'+itemproductid).parent().find('.qty_err_msg').remove();
            }
            document.getElementById(`cart-qty-${itemId}`).value = qty;
            this.loading = true;
            let removeEl = document.getElementById(`remove-${itemId}`);
            if(removeEl){
              removeEl.style.display = 'none';
            }
            document.getElementById(`loading-${itemId}`).classList.remove('hidden');
            console.log(itemId);
            var mainselector = document.getElementById(`cart-qty-${itemId}`);
            console.log(qty,'qty');
          }            
          if($(mainselector).closest('.cart-item').hasClass('hasproperties')){
            var __thisselector = $(mainselector).closest('.cart-item');
            var itemindex = __thisselector.attr('data-itemindex');           
            var curqty = __thisselector.attr('data-actualqty');
            if(qty == 0){
              var finalqty = hastotlqty - thiitemqty;
            }else{              
              var finalqty = qty;
            }
             $.ajax({
              type: 'POST',
              url: '/cart/change.js',
              data: {
                  line: itemindex,
                  quantity: finalqty
              },
              async: false,
              dataType: 'json',
              success: function () {
                console.log('success');
              },
           });
          } 

          const updates = {};
          updates[itemId] = qty;
          // if(subitemindex != 0 && subitemindex){
          //   updates[subitemindex] = qty;
          // }
          
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
                }
                return response.json();
              })
              .then(state => {
                console.log(state);
                const parsedState = state;
              
                if (parsedState.status == '422') {
                  this._addErrorMessage(itemId, parsedState.message);
                  this.updateCart(line);
                } else {
                  const items = document.querySelectorAll('.cart-item');
                  if (parsedState.errors) {
                    this._addErrorMessage(itemId, parsedState.errors);
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
                    this._addErrorMessage(itemId, message);
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
              })
              .catch(error => {
                console.error('Error updating cart:', error);
              });
                  
          // const sections = Alpine.store('xCartHelper').getSectionsToRender().map(s => s.id);
          // let updateData = {
          //   'line': `${line}`,
          //   'quantity': `${qty}`,
          //   'sections': sections
          // };
          
          // fetch(`${Shopify.routes.root}cart/change.js`, {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json'
          //   },
          //   body: JSON.stringify(updateData)
          // })
          //   .then(response => response.text())
          //   .then(state => {
          //     const parsedState = JSON.parse(state);
              
          //     if (parsedState.status == '422') {
          //       this._addErrorMessage(itemId, parsedState.message);
          //       this.updateCart(line);
          //     } else {
          //       const items = document.querySelectorAll('.cart-item');
          //       if (parsedState.errors) {
          //         this._addErrorMessage(itemId, parsedState.errors);
          //         return;
          //       }
          //       Alpine.store('xCartHelper').getSectionsToRender().forEach((section => {
          //         const sectionElement = document.querySelector(section.selector);
          //         if (sectionElement) {
          //           if (parsedState.sections[section.id])
          //             sectionElement.innerHTML = getSectionInnerHTML(parsedState.sections[section.id], section.selector);
          //         }
          //       }));

                

          //       const currentItemCount = Alpine.store('xCartHelper').currentItemCount
          //       Alpine.store('xCartHelper').currentItemCount = parsedState.item_count;
          //       if (currentItemCount != parsedState.item_count) {
          //         document.dispatchEvent(new CustomEvent("eurus:cart:items-changed"));
          //       }

          //       const lineItemError = document.getElementById(`LineItemError-${itemId}`);
          //       if (lineItemError) {lineItemError.classList.add('hidden');}
                
          //       const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
                
                
          //       if (items.length === parsedState.items.length && updatedValue !== parseInt(qty)) {
          //         let message = '';
          //         if (typeof updatedValue === 'undefined') {
          //           message = window.Eurus.cart_error;
          //         } else {
          //           message = window.Eurus.cart_quantity_error_html.replace('[quantity]', updatedValue);
          //         }
          //         this._addErrorMessage(itemId, message);
          //       }
          //     }
          //     let loadingEl = document.getElementById(`loading-${itemId}`);
          //     let removeEl = document.getElementById(`remove-${itemId}`);
          //     if(removeEl){
          //       removeEl.style.display = 'block';
          //     }
          //     if (loadingEl) {
          //       loadingEl.classList.add('hidden');
          //     }
          //     this.loading = false;
          //   });
        }

        this.t = setTimeout(() => {
          func();
        }, wait);
      },
      updateCart(line) {
        fetch(
          `${window.location.pathname}`
        )
        .then(reponse => {
          return reponse.text();
        })
        .then(response => {
          const parser = new DOMParser();
          const html = parser.parseFromString(response,'text/html');
          
          const rpCartFooter = html.getElementById('main-cart-footer');
          const cartFooter = document.getElementById('main-cart-footer');
          if (rpCartFooter && cartFooter) {
            cartFooter.innerHTML = rpCartFooter.innerHTML;
          }
          const rpItemInput = html.querySelector('.cart-item-qty-' + line);
          const itemInput = document.querySelector('.cart-item-qty-' + line);
          if (rpItemInput && itemInput) {
            itemInput.value = rpItemInput.value;
          }
          const rpItemTotal = html.querySelector('.cart-item-price-' + line);
          const itemTotal = document.querySelector('.cart-item-price-' + line);
          if (itemTotal && rpItemTotal) {
            itemTotal.innerHTML = rpItemTotal.innerHTML;
          }
          const rpPriceTotal = html.querySelector('.cart-drawer-price-total');
          const priceTotal = document.querySelector('.cart-drawer-price-total');
          if (rpPriceTotal && priceTotal) {
            priceTotal.innerHTML = rpPriceTotal.innerHTML;
          }
          const rpCartIcon = html.querySelector('cart-icon-bubble');
          const cartIcon = document.querySelector('cart-icon-bubble');
          if (cartIcon && rpCartIcon) {
            cartIcon.innerHTML = rpCartIcon.innerHTML;
          }
        });
      },
      updateEstimateShipping(el, line, itemId) {
        let qty = parseInt(document.getElementById(`cart-qty-${itemId}`).value);
        let properties = xParseJSON(el.getAttribute("x-data-properties"));
        let updateData = {
          'line': `${line}`,
          'quantity': `${qty}`,
          'properties': properties
        };
        fetch(`${Shopify.routes.root}cart/change.js`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })
        .then(response => response.text());
      },
      updateDate(date) {
        var formData = {
          'attributes': {
            'datetime-updated': `${date}`           
          }
        }; 
        fetch(Shopify.routes.root+'cart/update', {
          method:'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(formData)
        })
      },
      _addErrorMessage(itemId, message) {
        const lineItemError = document.getElementById(`LineItemError-${itemId}`);
        if (!lineItemError) return;
        lineItemError.classList.remove('hidden');
        lineItemError
          .getElementsByClassName('cart-item__error-text')[0]
          .innerHTML = message;
      },
      validateQty: function(number) {
        if((parseFloat(number) != parseInt(number)) && isNaN(number)) {
          return false
        }

        return true;
      }
    }));

    Alpine.store('xCartHelper', {
      currentItemCount: 0,
      validated: true,
      openField: '',
      openDiscountField: '',
      updateCart: function(data, needValidate = false) {
        const formData = JSON.stringify(data);
        fetch(Shopify.routes.root + 'cart/update', {
          method:'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: formData
        }).then(() => {
          if (needValidate) this.validateCart();
        });
      },
      cartValidationRequest() {
        this.validateCart();
        Alpine.store('xMiniCart').openCart();
      },
      validateCart: function() {
        this.validated = true;

        document.dispatchEvent(new CustomEvent("eurus:cart:validate"));
      },
      goToCheckout(e) {
        this.validateCart();
        
        if (this.validated) {
          let formData = {
            'attributes': {
              'collection-pagination': null,
              'blog-pagination': null,
              'choose_option_id': null,
              'datetime-updated': null
            }
          };

          fetch(Shopify.routes.root+'cart/update', {
            method:'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(formData)
          });
        } else {
          e.preventDefault();
        }
      },
      getSectionsToRender() {
        const cartItemEl = document.getElementById('main-cart-items');
        if (cartItemEl) {
          const templateId = cartItemEl.closest('.shopify-section').id
                              .replace('cart-items', '')
                              .replace('shopify-section-', '');

          return [
            {
              id: templateId + 'cart-items',
              selector: '#main-cart-items'
            },
            {
              id: templateId + 'cart-footer',
              selector: '#main-cart-footer'
            },
            {
              id: templateId + 'cart-upsell',
              selector: '#main-cart-upsell'
            },
            {
              id: "cart-icon-bubble",
              selector: '#cart-icon-bubble'
            },
            {
              id: 'mobile-cart-icon-bubble',
              selector: '#mobile-cart-icon-bubble'
            }
          ];
        }

        return [
          {
            id: "cart-icon-bubble",
            selector: '#cart-icon-bubble'
          },
          {
            id: 'mobile-cart-icon-bubble',
            selector: '#mobile-cart-icon-bubble'
          },
          {
            id: 'cart-drawer',
            selector: '#CartDrawer'
          }
        ];
      }
    });
  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.data('xModalSearch', (type, desktopMaximunResults, mobileMaximunResults, productTypeSelected) => ({
      t: '',
      result: ``,
      query: '',
      cachedResults: [],
      openResults: false,
      productTypeSelected: productTypeSelected,
      showSuggest: false,
      loading: false,
      open() {
        this.$refs.open_search.style.opacity = "1";
        this.$refs.open_search.style.maxHeight = "500px";
        this.$refs.open_search.classList.remove("overflow-hidden");
        this.$refs.open_search.classList.remove("hidden");
        this.$refs.input_search.focus();
      },
      close() {
        this.$refs.open_search.style.opacity = "0";
        this.$refs.open_search.style.maxHeight = "0px";
        this.$refs.open_search.classList.add("overflow-hidden");
        this.$refs.open_search.classList.add("hidden");
      },
      keyUp() {
        this.query = this.$el.value;
        return () => {
          clearTimeout(this.t);
          this.t = setTimeout(() => {
            if (this.query != "") {
              this.showSuggest = false;
              this.getSearchResult(this.query);
            } else {
              this.showSuggest = true;
              this.result = "";
            }
          }, 300);
        };
      },
      getSearchResult(query) {
        this.openResults = true;
        const limit = window.innerWidth > 767 ? desktopMaximunResults : mobileMaximunResults;
        let q = this.productTypeSelected != productTypeSelected ? `${this.productTypeSelected} AND ${query}` : query;

        const queryKey = q.replace(" ", "-").toLowerCase() + '_' + limit;

        if (this.cachedResults[queryKey]) {
          this.result = this.cachedResults[queryKey];
          return;
        }

        this.loading = true;

        fetch(`${Shopify.routes.root}search/suggest?q=${encodeURIComponent(q)}&${encodeURIComponent('resources[type]')}=${encodeURIComponent(type)}&${encodeURIComponent('resources[limit]')}=${encodeURIComponent(limit)}&section_id=predictive-search`)
          .then((response) => {
            return response.text();
          })
          .then((response) => {
            const parser = new DOMParser();
            const text = parser.parseFromString(response, 'text/html');
            this.result = text.querySelector("#shopify-section-predictive-search").innerHTML;
            this.cachedResults[queryKey] = this.result;
          })
          .catch((error) => {
            throw error;
          });
        this.loading = false;
      },
      setProductType(value, input) {
        this.productTypeSelected = value;
        document.getElementById(input).value = value;
        if(this.query != '') {
          this.getSearchResult(this.query);
        }
      },
      focusForm() {
        if (this.$el.value != '') {
          this.showSuggest = false;
        } else {
          this.showSuggest = true;
        }
      }
    }));
  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xHeaderMenu', {
      isSticky: false,
      stickyCalulating: false,
      isTouch: ('ontouchstart' in window) || window.DocumentTouch && window.document instanceof DocumentTouch || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints ? true : false,
      sectionId: '',
      stickyType: 'none',
      lastScrollTop: 0,
      themeModeChanged: false,
      showLogoTransparent: true,
      offsetTop: 0,
      clickedHeader: false,
      selectItem(el, isSub) {
        if(el.querySelector(".mega-list-nav")) {
          el.style.setProperty('--mega-menu-height', el.querySelector(".mega-list-nav").offsetHeight + 'px') 
        } 
        el.style.setProperty('--header-container-height', document.getElementById("x-header-container").offsetHeight + 'px')
        const itemSelector = isSub ? '.toggle-menu-sub' : '.toggle-menu';

        var items = isSub ? el.closest('.toggle-menu').querySelectorAll(itemSelector) : document.querySelectorAll(itemSelector);

        for (var i = 0; i < items.length; i++) {
          if (isSub) {
            items[i].style.display = "none";
          } else {
            items[i].style.maxHeight = "0px"; 
            items[i].style.opacity = "0";
            items[i].classList.add('max-h-0', 'overflow-hidden');
          }
        }

        let toggleMenu = el.querySelector(itemSelector);

        if (toggleMenu) {
          if (isSub) {
            toggleMenu.style.display = 'block';
          } else {
            toggleMenu.style.maxHeight = '';
            toggleMenu.style.opacity = "1";
            toggleMenu.classList.remove('max-h-0', 'overflow-hidden');
          }
        }
      },
      hideMenu() {
        var items = document.querySelectorAll('.toggle-menu');
        for(var i = 0; i < items.length; i++) {  
          items[i].style.maxHeight = "0px";
          items[i].style.opacity = "0";
          items[i].classList.add("overflow-hidden");
        }
      },

      // start handle touch menu on the ipad
      touchItem(el, isSub = false) {
        const touchClass = isSub ? 'touched-sub' : 'touched';

        el.addEventListener("touchend", (e) => {
          if (el.classList.contains(touchClass)) {
            window.location.replace(el.getAttribute('href'));
          } else {
            e.preventDefault(); 
            var dropdown = document.querySelectorAll(`.${touchClass}`);
            for(var i = 0; i < dropdown.length; i++) { 
              dropdown[i].classList.remove(touchClass); 
            }

            el.classList.add(touchClass);
            this.selectItem(el.closest('.has-dropdown'), isSub);
          }
        });
      },

      // handle sticky header
      initSticky(el, sectionId, stickyType) {
        this.sectionId = sectionId;
        this.stickyType = stickyType;
        this.offsetTop = el.offsetTop;
        window.addEventListener('resize', () => {
          this.reCalculateHeaderHeight();
        });
        const list = document.querySelector("#sticky-header");
        const announcement = document.querySelector("#x-announcement[data-is-sticky='true']");
        if (document.querySelector("#x-header-container[data-is-sticky='true']") && announcement) {
          if(document.querySelector("#sticky-header #x-announcement")) {
            document.querySelector("#sticky-header #x-announcement").remove();
          }
          let htmlAnnouncement = document.querySelector(".section-announcement").innerHTML.replaceAll("x-slide-announcement-bar", 'x-slide-announcement-bar-1').replaceAll("section-announcement", 'section-announcement-1');
          if(document.querySelectorAll(".section-announcement + .section-header").length == 0 && document.querySelectorAll(".section-announcement + div + .section-header").length == 0) {
            list.insertAdjacentHTML('beforeend', htmlAnnouncement);
          }else {
            list.insertAdjacentHTML('afterbegin', htmlAnnouncement);
          }
          document.querySelector(".section-announcement").style.display = "none";
        }
        el.style.height = document.getElementById("sticky-header").offsetHeight + 'px';
        this.setPositionTop();
      },
      setPositionTop() {
        let currentTop = 0;
        if(document.querySelectorAll(".section-announcement + .section-header").length == 0 && document.querySelectorAll(".section-announcement + div + .section-header").length == 0) {
          if (document.querySelector("#x-header-container[data-is-sticky='true']")) {
            if(this.isSticky) {
              currentTop = document.getElementById("sticky-header").offsetHeight;
            }
          }
          if(document.querySelector(".section-announcement")) {
            document.querySelector(".section-announcement").style.top = currentTop + "px";
          }
        }else {
          if (document.querySelectorAll("#x-announcement[data-is-sticky='true']").length == 0 ) {
            if(this.isSticky) {
              if(document.querySelector("#sticky-header").classList.contains('header-up')) {
                document.querySelector("#sticky-header").style.top = "calc(-1 * var(--top-header))"
              }else {
                document.querySelector("#sticky-header").style.top = "0px";
              }
            }
          }else if (document.querySelector("#x-header-container[data-is-sticky='true']")) {
            if(this.isSticky) {
              document.querySelector("#sticky-header-content").style.top = "0px";
            }else {
              document.querySelector("#sticky-header-content").style.top = document.querySelector("#x-announcement[data-is-sticky='true']").offsetHeight+ "px";
            }
            let top_height = document.getElementById("sticky-header-content").offsetHeight;
            if(document.querySelector("#x-announcement[data-is-sticky='true']")) {
              top_height =  top_height + document.querySelector("#x-announcement[data-is-sticky='true']").offsetHeight + 20;
            }
            if(document.querySelector("#sticky-header #x-announcement")) {
              top_height =  top_height + document.querySelector("#sticky-header #x-announcement").offsetHeight;
            }
            document.documentElement.style.setProperty('--top-header',top_height + "px");
          }
        }
      },
      handleAlwaysSticky() {
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
        const stickyLine = document.getElementById(this.sectionId).offsetTop;
        
        if (scrollPos > stickyLine) this.addStickyHeader();
      },
      handelOnScrollSticky() {
        this.setPositionTop();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop < this.offsetTop) {
          requestAnimationFrame(() => {
            document.getElementById("sticky-header").classList
              .remove('sticky-header');
          });
        }

        if (Math.abs(scrollTop - this.lastScrollTop) > 10) {
          if (scrollTop < this.lastScrollTop) {
            document.getElementById('sticky-header').classList.remove('header-up', 'opacity-0');
            this.setVariableHeightHeader(true);
          } else if (!this.themeModeChanged) {
            document.getElementById('sticky-header').classList.add('header-up');
            this.setVariableHeightHeader(false);
          }
          this.lastScrollTop = scrollTop;
        }
        this.themeModeChanged = false;
      },
      addStickyHeader() {
        let isMiniCartOpen = false;
        if (Alpine.store('xMiniCart').open && this.stickyType != 'on-scroll-up') {
          isMiniCartOpen = true;
          requestAnimationFrame(() => {
            Alpine.store('xMiniCart').hideCart();
          });
        }

        requestAnimationFrame(() => {
          let stickyEl = document.getElementById("sticky-header");
          stickyEl.classList.add("sticky-header", 'reduce-logo-size');
 
          this.isSticky = true;
          this.showLogoTransparent = false
        });
         
        requestAnimationFrame(() => {
          let stickyEl = document.getElementById("sticky-header");
          if (this.stickyType == 'on-scroll-up') {
            setTimeout(() => {
              stickyEl.classList.add('on-scroll-up-animation');
            }, 500);
          }
          if (!Alpine.store('xMiniCart').open || window.innerWidth > 768 ) {
            if (this.stickyType == 'always'
              || this.stickyType == 'reduce-logo-size') stickyEl.classList.add('always-animation');
          }
        });

        if (isMiniCartOpen) {
          requestAnimationFrame(() => {
            Alpine.store('xMiniCart').openCart();
          });
        }
        requestAnimationFrame(() => {
          this.setPositionTop();
        });
      },
      removeStickyHeader() {
        if (window.pageYOffset <= this.offsetTop ) {
          this.isSticky = false;
          this.showLogoTransparent = true;
          requestAnimationFrame(() => {
            document.getElementById("sticky-header").classList
              .remove('sticky-header', 'reduce-logo-size', 'always-animation', 'on-scroll-up-animation');
            this.reCalculateHeaderHeight();
            this.setVariableHeightHeader(false);
            this.setPositionTop();
          });
        }
      },
      handleChangeThemeMode() {
        this.themeModeChanged = true;
        this.reCalculateHeaderHeight();
      },
      reCalculateHeaderHeight() {
        document.getElementById("x-header-container").style.height
          = document.getElementById("sticky-header").offsetHeight + 'px';
      },
      addTransparentHover(el) {
        if (this.isTouch && this.clickedHeader) {
          el.classList.add('sticky-header-active');
        } else {
          el.classList.add('sticky-header-active');
        }
      },
      removeTransparentHover(el) {   
        if (this.isTouch && this.clickedHeader == false) {
          el.classList.remove('sticky-header-active');
        } else {
          el.classList.remove('sticky-header-active');
        }     
      },
      setVariableHeightHeader(sticky) {
        let root = document.documentElement;
        if (sticky) {
          root.style.setProperty('--height-header', document.getElementById("sticky-header").offsetHeight + "px");
        } else {
          root.style.setProperty('--height-header', "0px");
        }
      },
      setTopStickyHeader() {
        let root = document.documentElement;
        let top_height = document.getElementById("sticky-header-content").offsetHeight;
        if(document.querySelector("#x-announcement[data-is-sticky='true']")) {
          top_height =  top_height + document.querySelector("#x-announcement[data-is-sticky='true']").offsetHeight + 20;
        }
        if(document.querySelector("#sticky-header #x-announcement")) {
          top_height =  top_height + document.querySelector("#sticky-header #x-announcement").offsetHeight;
        }
        root.style.setProperty('--top-header',top_height + "px");
      }
    });
  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xMobileNav', {
      show: false,
      loading: false,
      currentMenuLinks: [],
      open() {
        this.show = true;
        Alpine.store('xPopup').open = true;
      },
      close() {
        this.show = false;
        Alpine.store('xPopup').open = false;
      },
      setActiveLink(linkId) {
        this.currentMenuLinks.push(linkId);
      },
      removeActiveLink(linkId) {
        const index = this.currentMenuLinks.indexOf(linkId);
        if (index !== -1) {
          this.currentMenuLinks.splice(index, 1);
        }
      },
      resetMenu() {
        this.currentMenuLinks = [];
      },
      scrollTop() { 
        document.getElementById('menu-navigation').scrollTop = 0; 
      }
    });

    Alpine.store('xPopup', {
      open: false
    }); 

    Alpine.store('xShowCookieBanner', {
      show: false
    });

    Alpine.store('xMiniCart', {
      open: false,
      type: '',
      loading: false,
      needReload: false,
      reLoad() {
        this.loading = true;
        const sections = Alpine.store('xCartHelper').getSectionsToRender().map(s => s.id).join(',');
        fetch(
          `${window.location.pathname}?sections=${sections}`
        )
          .then(response => response.json())
          .then(response => {
            Alpine.store('xCartHelper').getSectionsToRender().forEach((section => {
              const sectionElement = document.querySelector(section.selector);
              if (sectionElement && response[section.id]) {
                sectionElement.innerHTML = getSectionInnerHTML(response[section.id], section.selector);
              }
            }));

            this.loading = false;
          });
      },
      openCart() {
        if (window.location.pathname != '/cart') {        
          requestAnimationFrame(() => {
            if (Alpine.store('xQuickView') && Alpine.store('xQuickView').close()) {
              Alpine.store('xQuickView').close();
            }
          });

          requestAnimationFrame(() => {
            document.getElementById('sticky-header').classList.remove('on-scroll-up-animation');

            if (window.innerWidth < 768 || this.type == "drawer") {
              Alpine.store('xPopup').open = true;
            }

            requestAnimationFrame(() => {
              document.getElementById('sticky-header').classList.remove('header-up');
              this.open = true;
            });
            
            if (Alpine.store('xHeaderMenu').stickyType == 'on-scroll-up') {
              setTimeout(() => {
                requestAnimationFrame(() => {
                  document.getElementById('sticky-header').classList.add('on-scroll-up-animation');
                });
              }, 200);
            }
          });
        }
      },
      hideCart() {
        requestAnimationFrame(() => {
          this.open = false;
          Alpine.store('xPopup').open = false;
        });
      }
    });

    Alpine.store('xModal', {
      activeElement: "",
      setActiveElement(element) {
        this.activeElement = element;
      },
      focus(container, elementFocus) {
        Alpine.store('xFocusElement').trapFocus(container, elementFocus);
      },
      removeFocus() {
        const openedBy = document.getElementById(this.activeElement);
        Alpine.store('xFocusElement').removeTrapFocus(openedBy);
      }
    });

    Alpine.store('xFocusElement', {
      focusableElements: ['button, [href], input, select, textarea, [tabindex]:not([tabindex^="-"])'],
      listeners: {},
      trapFocus(container, elementFocus) {
        if ( window.innerWidth < 1025 ) return;

        let c = document.getElementById(container);
        let e = document.getElementById(elementFocus);
        this.listeners = this.listeners || {};
        const elements = Array.from(c.querySelectorAll(this.focusableElements));
        var first = elements[0];
        var last = elements[elements.length - 1];
        
        this.removeTrapFocus();
        
        this.listeners.focusin = (event)=>{
          if (
            event.target !== c &&
            event.target !== last &&
            event.target !== first
          ){
            return;
          }
          document.addEventListener('keydown', this.listeners.keydown);
        };

        this.listeners.focusout = () => {
          document.removeEventListener('keydown', this.listeners.keydown);
        }

        this.listeners.keydown = (e) =>{
          if (e.code.toUpperCase() !== 'TAB') return;
  
          if (e.target === last && !e.shiftKey) {
            e.preventDefault();
            first.focus();
          }
  
          if ((e.target === first || e.target == c) && e.shiftKey) {
            e.preventDefault();
            last.focus();
          }
        }
        document.addEventListener('focusout', this.listeners.focusout);
        document.addEventListener('focusin', this.listeners.focusin);
        e.focus();
      },
      removeTrapFocus(elementToFocus = null) {
        if ( window.innerWidth < 1025 ) return;

        document.removeEventListener('focusin', ()=>{
          document.addEventListener('keydown', this.listeners.focusin);
        });
        document.removeEventListener('focusout', ()=>{
          document.removeEventListener('keydown', this.listeners.focusout);
        });
        document.removeEventListener('keydown', this.listeners.keydown);
        if (elementToFocus) elementToFocus.focus();
      }
    });

    Alpine.data('xTruncateText', () => ({
      truncateEl: "",
      truncateInnerEl: "",
      truncated: false,
      truncatable: false,
      expanded: false,
      load(truncateEl) {
        const truncateRect = truncateEl.getBoundingClientRect();
        truncateEl.style.setProperty("--truncate-height", `${truncateRect.height}px`);
      },
      setTruncate(element) {
        if (element.offsetHeight < element.scrollHeight || element.offsetWidth < element.scrollWidth) {
          this.truncated = true;
          this.truncatable = true;
          this.expanded = false;
        } else {
          this.truncated = false;
          this.truncatable = false
          this.expanded = true;;
        }
      },
      open(el) {
        const truncateEl = el.closest('.truncate-container').querySelector('.truncate-text');
        this.expanded = true;
        if (truncateEl.classList.contains('truncate-expanded')) {
          this.truncated = true;
        } else {
          const truncateInnerEl = truncateEl.querySelector('.truncate-inner');
          window.requestAnimationFrame(() => {
            const truncateInnerRect = truncateInnerEl.getBoundingClientRect();
            truncateEl.style.setProperty("--truncate-height-expanded", `${truncateInnerRect.height}px`);
            truncateEl.classList.add('truncate-expanded');
          });
          this.truncated = false;
        }
      }
    }));
  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xCartAnalytics', {
      viewCart() {
        fetch(
          '/cart.js'
        ).then(response => {
          return response.text();
        }).then(cart => {
          cart = JSON.parse(cart);
          if (cart.items.length > 0) {
            Shopify.analytics.publish('view_cart', {'cart': cart});
          }
        });
      }
    });
  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xCustomerEvent', {
      fire(eventName, el, data) {
        if (Shopify.designMode) return;
        
        const formatedData = data ? data : xParseJSON(el.getAttribute('x-customer-event-data'));
        Shopify.analytics.publish(eventName, formatedData);
      }
    });
  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xSplide', {
      load(el, configs) {
        const initSlider = () => {
          const id = el.getAttribute("id");
          if(configs.classes != undefined) {
            if (!configs.classes.arrow) configs.classes.arrow = "arrow w-8 h-8 p-2 absolute z-10 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center";
            if (!configs.classes.next) configs.classes.next = "right-0";
            if (!configs.classes.prev) configs.classes.prev = "-rotate-180";
          }
          let splide = new Splide("#" + id, configs);

          if (configs.thumbs) {
            let thumbsRoot = document.getElementById(configs.thumbs);
            let thumbs = thumbsRoot.getElementsByClassName('x-thumbnail');
            let current;
            let _this = this;

            for (let i=0;i<thumbs.length;i++) {
              if (thumbs[i] == current) {
                thumbs[i].classList.remove('opacity-30');
              } else {
                thumbs[i].classList.add('opacity-30');
              }
              thumbs[i].addEventListener('click', function () {
                _this.moveThumbnail(i, thumbs[i], thumbsRoot, configs.thumbs_direction);
                splide.go(i);
              });
            }
            splide.on('mounted move', function () {
              let thumbnail = thumbs[splide.index];
              if (thumbnail) {
                if (current) {
                  current.classList.add('opacity-30');
                }
                thumbnail.classList.remove('opacity-30');
                current = thumbnail;
                _this.moveThumbnail(splide.index, thumbnail, thumbsRoot, configs.thumbs_direction);
              }
            });
          }

          if (configs.hotspot) {
            let hotspotRoot = document.getElementById(configs.hotspot);
            let hotspots = hotspotRoot.getElementsByClassName('x-hotspot');
            let current;

            if (configs.disableHoverOnTouch && (('ontouchstart' in window) || window.DocumentTouch && window.document instanceof DocumentTouch || window.navigator.maxTouchPoints || window.navigator.msMaxTouchPoints)) {
              for (let i=0;i<hotspots.length;i++) {
                hotspots[i].addEventListener('click', function () {
                  splide.go(i);
                });
              }
            } else {
              for (let i=0;i<hotspots.length;i++) {
                hotspots[i].addEventListener('mouseover', function () {
                  splide.go(i);
                });
                hotspots[i].addEventListener('focus', function () {
                  splide.go(i);
                });
              }             
            }
            splide.on('mounted move', function () {
              let hotspot = hotspots[splide.index];
              
              if (hotspot) {
                if (current) {
                  current.classList.remove('active-hotspot');
                }
                hotspot.classList.add('active-hotspot');
                current = hotspot;
              }
            });
          }

          if (configs.progressBar) {
            var bar = splide.root.querySelector( '.splide-progress-bar' );
            splide.on( 'mounted move', function () {
              var end  = splide.Components.Slides.getLength();
              var rate = 100 * (splide.index / end);
              if (bar) {
                var rateBar = rate + Number(bar.style.width.replace("%", ''));
                var maxRate = 100 - Number(bar.style.width.replace("%", ''));
                if(rateBar > 100 ) {
                  rate = maxRate;
                }
                if(document.querySelector('body').classList.contains('rtl')) {
                  bar.style.marginRight = rate + '%';
                }else {
                  bar.style.marginLeft = rate + '%';
                }  
              }
            });
          }
          if(splide.root.querySelector('.card-product')) {
            splide.on('resized', function() { 
              var maxHeight = 0;
              splide.Components.Slides.get().forEach((item) => {
                if (item.slide.offsetHeight > maxHeight) {
                   maxHeight = item.slide.offsetHeight;
                }
              });
              splide.Components.Slides.get().forEach((item) => {
                item.slide.style.height = maxHeight+"px";
              });
            })
          }
          if(el.classList.contains('card-product-img')) {
            splide.on('resized', function() { 
              var height = splide.root.querySelector('.splide__track').offsetHeight;
              splide.Components.Slides.get().forEach((item) => {
                item.slide.style.height = height+"px";
              });
            }) 
          }

          if (configs.events) {
            configs.events.forEach((e) => {
              splide.on(e.event, e.callback);
            });
          }

          
          el.splide = splide;
          splide.mount();

          if (configs.playOnHover) {
            splide.Components.Autoplay.pause();
            el.onmouseover = function() {
              splide.Components.Autoplay.play();
            };
            el.onmouseout = function() {
              splide.Components.Autoplay.pause();
            };
          }
        }

        if (!window.Eurus.loadedScript.includes('slider')) {
          deferScriptLoad('slider', window.Eurus.sliderScript, initSlider, true);
        } else if (window.Splide){
          initSlider();
        } else {
          document.addEventListener('slider loaded', () => {
            initSlider();
          });
        }
      },
      moveThumbnail(index, thumbnail, thumbsRoot, direction) {
        if (direction == 'vertical') {
          setTimeout(() => {
            thumbsRoot.scrollTop = (index+1) * thumbnail.offsetHeight - thumbsRoot.offsetHeight*0.5 + thumbnail.offsetHeight*0.5 + index*12;
          },50);
        } else {
          thumbsRoot.scrollLeft = (index-2) * thumbnail.offsetWidth;
        }
      }
    });
  });
});

requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.data('xParallax', () => ({
      debounce(func, wait) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
              timeout = null;
              func.apply(context, args);
            };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },
      load(disable) {
        if (disable) return;

        if ("IntersectionObserver" in window && 'IntersectionObserverEntry' in window) {
          const observerOptions = {
            root: null,
            rootMargin: '0px 0px',
            threshold: 0
          };

          var observer = new IntersectionObserver(handleIntersect, observerOptions);
          var el;
          function handleIntersect(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                el = entry.target;
                window.addEventListener('scroll', parallax, {passive: true, capture: false});
              } else {
                window.removeEventListener('scroll', parallax, {passive: true, capture: false});
              }
            });
          }

          observer.observe(this.$el);
          
          var parallax = this.debounce(function() {
            var rect = el.getBoundingClientRect();
            var speed = (window.innerHeight / el.parentElement.offsetHeight) * 20;
            var shiftDistance = (rect.top - window.innerHeight) / speed;
            var maxShiftDistance = el.parentElement.offsetHeight / 11;
            
            if (shiftDistance < -maxShiftDistance || shiftDistance > maxShiftDistance) {
              shiftDistance = -maxShiftDistance;
            }
            
            el.style.transform = 'translate3d(0, '+ shiftDistance +'px, 0)';
          }, 10);
        }
      }
    }));
  });
});