if (!window.Eurus.loadedScript.includes('product-cart.js')) {
  window.Eurus.loadedScript.push('product-cart.js');

  window.handleCartResponse = function (response, productId) {
    if (response.status == '422') {
      if (typeof response.errors == 'object') {
        this.error_message_wrapper = response.errors;
        document.querySelector('.recipient-error-message').classList.remove('hidden');
      } else {
        this.errorMessage = true;
        const errorMessage = response.description;
        document.querySelectorAll('[ref="error_message"], [ref="error_message_mobile"]').forEach(el => {
          el.textContent = errorMessage;
        });
      }
      if (Alpine.store('xMiniCart')) {
        Alpine.store('xMiniCart').reLoad();
      }
    } else {
      document.querySelector('.recipient-error-message')?.classList.add('hidden');
      this.error_message_wrapper = {};
  
      Alpine.store('xCartHelper').getSectionsToRender().forEach(section => {
        console.log(section.selector)
        const sectionElement = document.querySelector(section.selector);
        console.log(sectionElement)
        if (sectionElement && response.sections[section.id]) {
          sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
        }
      });
  
      let maxQty;
      let hasFreeItems = 0;

      console.log(productId)
      $.ajax({
        type: "GET",
        url: "/cart.js",
        dataType: 'json',
        async: false,
        success: function (data) {
          data.items.forEach(item => {
            if (item.properties['_maxqty'] && item.product_id == productId) {
              maxQty = parseInt(item.properties['_maxqty']);
              hasFreeItems += item.quantity;
            }
          });
        }
      });
      console.log(hasFreeItems, maxQty)
      if (hasFreeItems >= maxQty) {
        document.querySelectorAll(`.classproduct-${productId}`).forEach(el => {
          el.disabled = true;
          el.type = 'button';
        });
        document.querySelector('.add_to_cart_button').style.display = 'none';
        document.querySelector('.dummybtn').style.display = 'block';
        const msg = `<p class="qty_err_msg text-center">You can't add more quantity of this item</p>`;
        document.querySelector(`.hasmsg.classproduct-${productId}`).insertAdjacentHTML('beforebegin', msg);
      } else {
        document.querySelectorAll(`.classproduct-${productId}`).forEach(el => {
          el.disabled = false;
          el.type = 'submit';
        });
        if(document.querySelector('.add_to_cart_button') != null) document.querySelector('.add_to_cart_button').style.display = '';
        if(document.querySelector('.dummybtn') != null) document.querySelector('.dummybtn').style.display = 'none';
      }
  
      if (Alpine.store('xQuickView')?.show) {
        Alpine.store('xQuickView').show = false;
      }
      Alpine.store('xPopup').open = false;
      Alpine.store('xMiniCart').openCart();
  
      Alpine.store('xCartHelper').currentItemCount = parseInt(document.querySelector('#cart-icon-bubble span').textContent, 10);
      document.dispatchEvent(new CustomEvent("eurus:cart:items-changed"));
    }
  };
  
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xProductCart', (
        wrappringVariantId,
      ) => ({
        loading: false,
        errorMessage: false,
        buttonSubmit: "",
        error_message_wrapper: {},
        stopAction: false,
        async addToCart(e, required) {
          e.preventDefault();
          console.log('hihihihi');
          var __this = this;
          if (required) {
            var productInfo = this.$el.closest('.product-info');
            if (productInfo) {
              var propertiesInput = productInfo.querySelectorAll(`.customization-picker`);
              this.stopAction = false;
              propertiesInput.length && propertiesInput.forEach((input) => {
                if (input.required && input.value == '' || input.classList.contains("validate-checkbox")) {
                  input.classList.add("required-picker");
                  this.stopAction = true;
                }
              });
            }
            if (this.stopAction) {
              return true;
            }
          }

  // Certificate addon 
          this.loading = true;
          $('.removable').remove();
          if(this.$refs.certificate_product){
            if(this.$refs.certificate_product.querySelector('#certificate_product').checked){
              var viid = this.$refs.certificate_product.querySelector('#certificate_product').getAttribute('data-vid');
              var randomId = function(length = 10) {
                return Math.random().toString(36).substring(2, length+2);
              };
              var randomid = randomId(100); 
              const certData = {
                items: [
                  {
                    id: viid,
                    quantity: parseInt($('.product-info [name="quantity"]').val()),
                    properties: {
                      '_certificate_item': 'sub',
                      '_bundleid': randomid,
                      '_mainqty': parseInt($('.product-info [name="quantity"]').val())
                    }
                  }
                ]
              };
      
              const certResponse = await window.fetch('/cart/add.js', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(certData),
              });
  
              const certResponse1 = await certResponse.json();
              if (!certResponse.ok) {              
                return;
              }else{
                $(this.$refs.product_form).prepend('<input type="hidden" class="removable" name="properties[_certificate_item]" value="main"><input type="hidden" class="removable" name="properties[Add certificate for ₹50]" value="Yes"><input type="hidden" class="removable" name="properties[_bundleid]" value="'+randomid+'">');
              }
            }
          }

          if(this.$refs.autoaddon_product){
            var viid = this.$refs.autoaddon_product.querySelector('#autoaddon_product').getAttribute('data-vid');
            var randomId = function(length = 10) {
              return Math.random().toString(36).substring(2, length+2);
            };
            var randomid = randomId(100); 
            const autoaddData = {
              items: [
                {
                  id: viid,
                  quantity: parseInt($('.product-info [name="quantity"]').val()),
                  properties: {
                    '_autoaddon_item': 'sub',
                    '_autobundleid': randomid,
                    '_mainqty': parseInt($('.product-info [name="quantity"]').val())
                  }
                }
              ]
            };
    
            const certResponse = await window.fetch('/cart/add.js', {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify(autoaddData),
            });

            const certResponse1 = await certResponse.json();
            if (!certResponse.ok) {              
              return;
            }else{
              $(this.$refs.product_form).prepend('<input type="hidden" class="removable" name="properties[_autoaddon_item]" value="main"><input type="hidden" class="removable" name="properties[_autoaddon_item]" value="Yes"><input type="hidden" class="removable" name="properties[_autobundleid]" value="'+randomid+'">');
            }
          }

          if (this.$refs.gift_wrapping_checkbox && this.$refs.gift_wrapping_checkbox.checked && wrappringVariantId) {
            const giftData = {
              items: [
                {
                  id: wrappringVariantId,
                  quantity: 1
                }
              ]
            };
    
            const giftResponse = await window.fetch('/cart/add.js', {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify(giftData),
            });
    
            const giftResponse1 = await giftResponse.json();
            if (!giftResponse.ok) {
              if (giftResponse1.status == 422) {
                this.$refs.gift_wrapping_error.textContent = giftResponse1.description;
                this.loading = false;
                setTimeout(() => {
                  this.$refs.gift_wrapping_error.textContent = "";
                }, 5000);
              }
              return;
            }
          }

          let formData = new FormData(this.$refs.product_form);
          let quantity = formData.get("quantity");
          var itemproductid = this.$refs.product_form.getAttribute('data-pid');
          var maxqty = parseInt(this.$refs.product_form.getAttribute('data-maxqty'));
          
          var hasfreeitems = 0;          
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
                if(e.properties['_maxqty'] && e.product_id == itemproductid){
                  hasfreeitems += e.quantity;
                }
              });
            }
          });
          console.log(hasfreeitems, quantity);
          hasfreeitems += parseInt(quantity);
          console.log(hasfreeitems, maxqty);
          if(hasfreeitems > maxqty){
            var goqty = maxqty - (hasfreeitems - parseInt(quantity));
            if(goqty > 0){
              formData.set("quantity", goqty);  
              alert(`Based on quantity limitation You can only add ${goqty} out of total quantity you have selected.`);
              // $('.product-page .classproduct-'+itemproductid).after(`<p class="qty_err_msg maximumerr text-center md:mt-2"></p>`);              
            }                        
          }else{
            console.log('nooooooooooooooo')
          }
          // return;
          formData.append(
            'sections',
            Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          await fetch(`${Eurus.cart_add_url}`, {
            method:'POST',
            headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
          }).then(reponse => {
            return reponse.json();
          }).then((response) => {
            var itemproductid = this.$refs.product_form.getAttribute('data-pid');
            
            window.handleCartResponse(response, itemproductid);
            
          }).catch((error) => {
            console.error('Error:', error);
          }).finally(() => {
            this.loading = false;
            if(this.$refs.gift_wrapping_checkbox) this.$refs.gift_wrapping_checkbox.checked = false;
          }) 
        }
      }))
    });
  });
}




