if (!window.Eurus.loadedScript.includes('product-comparison.js')) {
  window.Eurus.loadedScript.push('product-comparison.js');
  
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xProductComparisonPopup', {
        loadTablet(el, url) {
          if(url) {
            fetch(url)
              .then(response => response.text())
              .then(text => {
                const html = document.createElement('div');
                html.innerHTML = text;
                const recommendations = html.querySelector('.product-comparison-table');
                if (recommendations && recommendations.innerHTML.trim().length) {
                  requestAnimationFrame(() => {
                    el.innerHTML = recommendations.innerHTML;
                    el.querySelectorAll('.content-tablet').forEach((item) => {
                      if (el.querySelector('.'+item.dataset.selectHtml)) {
                        el.querySelector('.'+item.dataset.selectHtml).innerHTML += item.innerHTML;
                      }
                    });
                  });
                }
              }).catch(e => {console.error(e);});
          }else {
            el.querySelectorAll('.content-tablet').forEach((item) => {
              if (el.querySelector('.'+item.dataset.selectHtml)) {
                el.querySelector('.'+item.dataset.selectHtml).innerHTML += item.innerHTML;
              }
            });
          }
        }
      });
    })
  });
}    