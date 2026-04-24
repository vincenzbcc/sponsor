import ProductRepository from './ProductRepository.js';

const PortalEngine = (() => {
    let instance;

    function init() {
        const portalFrame = document.getElementById('portal-frame');
        const portalTitle = document.getElementById('portal-title');
        const portalCategory = document.getElementById('portal-category');

        const loadProduct = (productId) => {
            const product = ProductRepository.getProduct(productId);
            if (product && portalFrame) {
                // Add loading effect
                portalFrame.style.opacity = '0';
                
                setTimeout(() => {
                    portalFrame.src = product.url;
                    if(portalTitle) portalTitle.innerText = product.name;
                    if(portalCategory) portalCategory.innerText = product.category;
                    
                    portalFrame.onload = () => {
                        portalFrame.style.opacity = '1';
                    };
                }, 300);
            }
        };

        // Scroll Lock logic (Optional: to prevent parent from scrolling while in portal)
        // Since we use CSS scroll snap, if the user scrolls inside the iframe, 
        // the browser naturally scrolls the iframe. 
        // To be extra safe, we can listen to wheel events on a wrapper if needed,
        // but modern browsers handle iframe scrolling well if the mouse is inside.
        
        return {
            loadProduct
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

export default PortalEngine;
