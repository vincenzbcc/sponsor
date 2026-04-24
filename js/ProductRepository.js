const ProductRepository = (() => {
    const products = {
        'firma': {
            id: 'firma',
            name: 'FIRMA Machine',
            category: 'Coffee Appliance',
            url: 'prototypes/firma/index.html'
        },
        'aikon': {
            id: 'aikon',
            name: 'Aikon Automatic',
            category: 'Luxury Watch',
            url: 'prototypes/aikon/index.html'
        },
        'wine': {
            id: 'wine',
            name: 'Wine Journey',
            category: 'Luxury Wine',
            url: 'prototypes/wine/index.html'
        },
        'perfume': {
            id: 'perfume',
            name: 'Oud Wood',
            category: 'Fragrance',
            url: 'prototypes/placeholder.html?type=profumo'
        },
        'soda': {
            id: 'soda',
            name: 'Neon Cola',
            category: 'Beverage',
            url: 'prototypes/placeholder.html?type=lattina'
        },
        'lipstick': {
            id: 'lipstick',
            name: 'Rouge Velvet',
            category: 'Cosmetics',
            url: 'prototypes/placeholder.html?type=rossetto'
        }
    };

    return {
        getProduct: (id) => products[id] || products['firma'],
        getAllProducts: () => Object.values(products)
    };
})();

export default ProductRepository;
