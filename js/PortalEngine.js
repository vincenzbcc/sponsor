const PortalEngine = (() => {
    let instance;

    function init() {
        const portalFrame = document.getElementById('portal-frame');
        const portalTitle = document.getElementById('portal-title');
        const portalCategory = document.getElementById('portal-category');
        let currentProduct = null;

        const loadProduct = (productId) => {
            const product = ProductRepository.getProduct(productId);
            if (product && portalFrame) {
                currentProduct = product;
                // Add loading effect
                portalFrame.style.opacity = '0';
                
                setTimeout(() => {
                    if (currentProduct !== product) return;
                    if (portalTitle) portalTitle.innerText = product.name;
                    if (portalCategory) portalCategory.innerText = product.category;

                    const revealFrame = () => {
                        portalFrame.style.opacity = '1';
                    };

                    // Attach onload before setting src to avoid race conditions on cached loads
                    portalFrame.onload = revealFrame;
                    portalFrame.src = product.url;

                    // Fallback in case onload is delayed or suppressed
                    setTimeout(revealFrame, 1500);
                }, 300);
            }
        };

        // Scroll Lock logic (Optional: to prevent parent from scrolling while in portal)
        // Since we use CSS scroll snap, if the user scrolls inside the iframe, 
        // the browser naturally scrolls the iframe. 
        // To be extra safe, we can listen to wheel events on a wrapper if needed,
        // but modern browsers handle iframe scrolling well if the mouse is inside.
        
        return {
            loadProduct,
            getCurrentProduct: () => currentProduct
        };
    }

    return {
        getInstance: () => {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };
})();
