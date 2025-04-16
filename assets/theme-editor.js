document.addEventListener('shopify:block:select', function(event) {
  const blockSelected = event.target.classList;
  /* start slideshow.liquid */
  if (event.target.classList.contains('x-splide-slide')) {
    const slideshow = event.target.closest('.x-splide');
    let count = 0;

    let i = setInterval(function () {
      count++;

      if (slideshow.splide) {
        const index = event.target.getAttribute('x-slide-index');
        if (index) {
          slideshow.splide.go(parseInt(index));
        }

        if (!slideshow.splide.Components.Autoplay.isPaused()) {
          slideshow.splide.Components.Autoplay.pause();
          slideshow.splide.theme_editor_paused = true;
        }

        clearInterval(i);
      }
      
      if (count > 10) {
        clearInterval(i);
      }
    }, 200);
  }
  /* end slideshow.liquid */
  /* start shop the look */
  if (event.target.classList.contains('x-hotspot')) {
    let splideEl = document.getElementById('x-product-shop-look-' + event.detail.sectionId);
    const index = parseInt(event.target.attributes.index.value);
    setTimeout(() => {
      splideEl.splide.go(index - 1);
    }, 300);
  }
  /* end shop the look */
  /* start mobile-navigation.liquid */
  if (blockSelected.contains('block-mobile-navigation')) {
    if (window.Alpine) {
      Alpine.store('xMobileNav').resetMenu();
      Alpine.store('xMobileNav').open();
    } else {
      document.addEventListener('alpine:initialized', () => {
        Alpine.store('xMobileNav').resetMenu();
        Alpine.store('xMobileNav').open();
      });
    }
  }
  /* end mobile-navigation.liquid */

  /* start quick-view.liquid */
  if (event.detail.sectionId.includes('quick-view')) {
    if (window.Alpine && Alpine.store('xQuickView')) {
      Alpine.store('xQuickView').show = true;
      Alpine.store('xQuickView').selected = true;
      Alpine.store('xPopup').open = true;
    } else {
      document.addEventListener('alpine:initialized', () => {
        if (Alpine.store('xQuickView')) {
          Alpine.store('xQuickView').show = true;
          Alpine.store('xQuickView').selected = true;
          Alpine.store('xPopup').open = true;
        }
      });
    }
  } 
  /* end quick-view.liquid */

  /* start featured-collection.liquid */
  if (blockSelected.contains('collection-title')) {
    event.target.click();
  }
  /* end featured-collection.liquid */
});

document.addEventListener('shopify:block:deselect', function(event) {
  /* start slideshow.liquid */
  if (event.target.classList.contains('x-splide-slide')) {
    const slideshow = event.target.closest('.x-splide');
    if (slideshow.splide.theme_editor_paused) {
      slideshow.splide.Components.Autoplay.play();
    }
  }
  /* end slideshow.liquid */
});

document.addEventListener('shopify:section:select', function(event) {
  const sectionSelected = event.target.classList;
  /* start quick-view.liquid */
  if (event.target.id.includes('quick-view')) {
    if (window.Alpine && Alpine.store('xQuickView')) {
      Alpine.store('xQuickView').show = true;
      Alpine.store('xQuickView').selected = true;
      Alpine.store('xPopup').open = true;
    } else {
      document.addEventListener('alpine:initialized', () => {
        if (Alpine.store('xQuickView')) {
          Alpine.store('xQuickView').show = true;
          Alpine.store('xQuickView').selected = true;
          Alpine.store('xPopup').open = true;
        }
      });
    }
  } else {
    if (window.Alpine && Alpine.store('xQuickView')) {
      if (Alpine.store('xQuickView').show) {
        Alpine.store('xQuickView').show = false;
      }

      Alpine.store('xQuickView').selected = false;
      Alpine.store('xPopup').open = false;
    } else {
      document.addEventListener('alpine:initialized', () => {
        if (Alpine.store('xQuickView')) {
          if (Alpine.store('xQuickView').show) {
            Alpine.store('xQuickView').show = false;
          }

          Alpine.store('xQuickView').selected = false;
          Alpine.store('xPopup').open = false;
        }
      });
    }
  }
  /* end quick-view.liquid */

  /* start cookie-banner.liquid */
  if (event.target.id.includes('cookie-banner')) {
    if (window.Alpine) {
      Alpine.store('xShowCookieBanner').show = true;
    } else {
      document.addEventListener('alpine:initialized', () => {
        Alpine.store('xShowCookieBanner').show = true;
      });
    }
  }
  /* end cookie-banner.liquid */

  /* start mobile-navigation.liquid */
  if (sectionSelected.contains('section-mobile-navigation')) {
    if (window.Alpine) {
      Alpine.store('xMobileNav').resetMenu();
      Alpine.store('xMobileNav').open();
    } else {
      document.addEventListener('alpine:initialized', () => {
        Alpine.store('xMobileNav').resetMenu();
        Alpine.store('xMobileNav').open();
      });
    }
  } else {
    if (window.Alpine) {
      Alpine.store('xMobileNav').close();
    } else {
      document.addEventListener('alpine:initialized', () => {
        Alpine.store('xMobileNav').close();
      });
    }
  }
  /* end mobile-navigation.liquid */

  if (sectionSelected.contains('section-product-info')) {
    if (window.Alpine) {
      document.dispatchEvent(new CustomEvent("reload-thumbnail-" + event.detail.sectionId));
    } else {
      document.addEventListener('alpine:initialized', () => {
        document.dispatchEvent(new CustomEvent("reload-thumbnail-" + event.detail.sectionId));
      });
    }
  }
})
document.addEventListener('shopify:section:reorder', function(event) {
  if (event.target.id.includes("__header") || event.target.id.includes("announcement-bar")) {
    if(document.querySelector("#sticky-header #x-announcement")) {
      document.querySelector("#sticky-header #x-announcement").remove();
    }
    document.querySelector(".section-announcement").style.display = "block";
    const list = document.querySelector("#sticky-header");
    const announcement = document.querySelector("#x-announcement[data-is-sticky='true']");
    if (document.querySelector("#x-header-container[data-is-sticky='true']") && announcement) {
      let htmlAnnouncement = document.querySelector(".section-announcement").innerHTML.replaceAll("x-slide-announcement-bar", 'x-slide-announcement-bar-1').replaceAll("section-announcement", 'section-announcement-1');
      if(document.querySelectorAll(".section-announcement + .section-header").length == 0 && document.querySelectorAll(".section-announcement + div + .section-header").length == 0) {
        list.insertAdjacentHTML('beforeend', htmlAnnouncement);
      }else {
        list.insertAdjacentHTML('afterbegin', htmlAnnouncement);
      }
      document.querySelector(".section-announcement").style.display = "none";
    }
  }
})
                          
document.addEventListener('shopify:section:select', function(event) {
  /* start cookie-banner.liquid */
  if (event.target.id == 'shopify-section-cookie-banner') {
    if (window.Alpine) {
      Alpine.store('xShowCookieBanner').show = true;
    } else {
      document.addEventListener('alpine:initialized', () => {
        Alpine.store('xShowCookieBanner').show = true;
      });
    }
  }
  /* end cookie-banner.liquid */
  if (event.target.id.includes("announcement-bar")) {
    document.getElementById("x-header-container").style.height
          = document.getElementById("sticky-header").offsetHeight + 'px';
  }
  if (event.target.id.includes("__header") || event.target.id.includes("announcement-bar")) {
    if(document.querySelector("#sticky-header #x-announcement")) {
      document.querySelector("#sticky-header #x-announcement").remove();
    }
    document.querySelector(".section-announcement").style.display = "block";
    const list = document.querySelector("#sticky-header");
    const announcement = document.querySelector("#x-announcement[data-is-sticky='true']");
    if (document.querySelector("#x-header-container[data-is-sticky='true']") && announcement) {
      let htmlAnnouncement = document.querySelector(".section-announcement").innerHTML.replaceAll("x-slide-announcement-bar", 'x-slide-announcement-bar-1').replaceAll("section-announcement", 'section-announcement-1');
      if(document.querySelectorAll(".section-announcement + .section-header").length == 0 && document.querySelectorAll(".section-announcement + div + .section-header").length == 0) {
        list.insertAdjacentHTML('beforeend', htmlAnnouncement);
      }else {
        list.insertAdjacentHTML('afterbegin', htmlAnnouncement);
      }
      document.querySelector(".section-announcement").style.display = "none";
    }
  }
})

document.addEventListener('shopify:section:load', function(event) {
  if (event.target.id.includes("announcement-bar")) {
    if(document.querySelector("#sticky-header #x-announcement")) {
      document.querySelector("#sticky-header #x-announcement").remove();
    }
    const list = document.querySelector("#sticky-header");
    const announcement = document.querySelector("#x-announcement[data-is-sticky='true']");
    if (document.querySelector("#x-header-container[data-is-sticky='true']") && announcement) {
      let htmlAnnouncement = document.querySelector(".section-announcement").innerHTML.replaceAll("x-slide-announcement-bar", 'x-slide-announcement-bar-1').replaceAll("section-announcement", 'section-announcement-1');
      if(document.querySelectorAll(".section-announcement + .section-header").length == 0 && document.querySelectorAll(".section-announcement + div + .section-header").length == 0) {
        list.insertAdjacentHTML('beforeend', htmlAnnouncement);
      }else {
        list.insertAdjacentHTML('afterbegin', htmlAnnouncement);
      }
      document.querySelector(".section-announcement").style.display = "none";
    }
  }
})

document.addEventListener('shopify:section:unload', function(event) {
  if (event.target.id.includes("announcement-bar")) {
    if(document.querySelector("#sticky-header #x-announcement")) {
      document.querySelector("#sticky-header #x-announcement").remove();
    }
  }
})

document.addEventListener('shopify:section:deselect', function(event) {
   /* start cookie-banner.liquid */
  if (event.target.id.includes('cookie-banner')) {
    if (window.Alpine) {
      Alpine.store('xShowCookieBanner').show = false;
    } else {
      document.addEventListener('alpine:initialized', () => {
        Alpine.store('xShowCookieBanner').show = false;
      });
    }
  }
  /* end cookie-banner.liquid */
})

document.addEventListener("DOMContentLoaded", (event) => {
   localStorage.setItem("section-age-verification-popup", JSON.stringify(false));
   localStorage.setItem("section-promotion-popup", JSON.stringify(false));
});