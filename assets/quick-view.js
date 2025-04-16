requestAnimationFrame(() => {
  document.addEventListener('alpine:init', () => {
    Alpine.store('xQuickView', {
      sectionId: window.xQuickView.sectionId,
      enabled: window.xQuickView.enabled,
      buttonLabel: window.xQuickView.buttonLabel,
      show_atc_button: window.xQuickView.show_atc_button,
      btn_atc_bottom: window.xQuickView.atc_btn_bottom,
      show: false,
      loading: false,
      currentVariant: '',
      cachedResults: [],
      cachedfetch: [],
      loadedChooseOptions: [],
      loadedChooseOptionsID: [],
      selected: false,
      loadingChooseOption: false,
      addListener() {
        document.addEventListener('eurus:cart:items-changed', () => {
          this.cachedResults = [];
        });
      },
      showBtn(enable, showATCButton, textBtn) {
        this.enabled = enable;
        this.buttonLabel = textBtn;
        this.show_atc_button = showATCButton;
      },
      load(url, el, optionId) {
        let variant = document.getElementById('current-variant-' + optionId).innerText;
        let productUrl = variant?`${url}?variant=${variant}&section_id=${this.sectionId}`:`${url}?section_id=${this.sectionId}`;
        productUrl = productUrl.replace(/\s+/g, '');
        
        if (this.cachedResults[productUrl]) {
          document.getElementById('quickview-product-content').innerHTML = this.cachedResults[productUrl];
          return true;
        }
        
        if (this.cachedfetch[productUrl]) {
          return true;
        }

        this.loading = true;
        this.cachedfetch[productUrl] = true;
        fetch(productUrl)
          .then(reponse => {
            return reponse.text();
          })
          .then((response) => {
            const parser = new DOMParser();
            const content = parser.parseFromString(response,'text/html')
                              .getElementById("quickview-product-content").innerHTML;
            document.getElementById('quickview-product-content').innerHTML = content;
            this.cachedResults[productUrl] = content;
          })
          .finally(() => {
            this.loading = false;
            this.cachedfetch[productUrl] = false;
          })

        return true;
      },
      async loadChooseOptions(url, el, optionId, index) {
        let getVariant = document.getElementById('current-variant-' + optionId).innerText;
        let urlProduct = getVariant?`${url}?variant=${getVariant}&section_id=choose-option&page=${index}`:`${url}?section_id=choose-option&page=${index}`;
        
        let destinationElm = document.getElementById('choose-options-' + optionId).querySelector('.choose-options');
        let destinationElmMobile = document.getElementById('choose-options-mobile');
        let loadingEl = document.getElementById('choose-options-' + optionId).querySelector('.icon-loading');

        
        if ( this.loadedChooseOptions[urlProduct]) {
          if (window.innerWidth > 767) {
            destinationElm.innerHTML = this.loadedChooseOptions[urlProduct];
            destinationElmMobile.innerHTML = '';
          } else {
            destinationElm.innerHTML = '';
            destinationElmMobile.innerHTML = this.loadedChooseOptions[urlProduct];
          }
          return true;
        }
        
        try {
          if (loadingEl) {
            loadingEl.classList.remove('hidden');
          }
          this.loadingChooseOption = true;
          const response = await fetch(urlProduct);
          const content = await response.text();
      
          const parser = new DOMParser();
          const parsedContent = parser.parseFromString(content, 'text/html').getElementById("choose-options-content").innerHTML;
          
          if (parsedContent) {
            if (window.innerWidth > 767) {
              destinationElm.innerHTML = parsedContent;
              destinationElmMobile.innerHTML = '';
            } else {
              destinationElm.innerHTML = '';
              destinationElmMobile.innerHTML = parsedContent;
            }
            this.loadedChooseOptions[urlProduct] = parsedContent;
          }
          if (loadingEl) {
            loadingEl.classList.add('hidden');
          }
          this.loadingChooseOption = false;
        } catch (error) {
          console.log(error);
        }
      },
      
      open() {
        this.show = true;
        Alpine.store('xPopup').open = true;
      },
      close() {
        this.show = false;
        Alpine.store('xPopup').open = false;
      },
      focusQuickView(quickView, btnClose) {
        if ( !this.selected ) { 
          Alpine.store('xFocusElement').trapFocus(quickView, btnClose);
        }
      },
      removeFocusQuickView() {
        if ( !this.selected ) { 
          const elementActive = document.getElementById("button_quickview");
          Alpine.store('xFocusElement').removeTrapFocus(elementActive);
        }
      },
      closePopupMobile() {
        this.openPopupMobile = false;
      },
      showChooseOption() {
         this.openPopupMobile = true;
      }
    });
  });
});