const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Sample product data
const products = [
    {
        productName: 'Nothing Phone 2 Pro',
        description: '6.7" AMOLED display, Snapdragon 8 Gen 2, 12GB RAM',
        price: 34999,
        stock: 50,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
    },
    {
        productName: 'Redmi A5',
        description: '6.52" HD+ display, MediaTek Helio G36, 4GB RAM',
        price: 7999,
        stock: 100,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400'
    },
    {
        productName: 'Motorola Edge 50 Fusion',
        description: '6.7" pOLED display, Snapdragon 7s Gen 2, 8GB RAM',
        price: 22999,
        stock: 75,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400'
    },
    {
        productName: 'Oppo A3x 5G',
        description: '6.67" LCD display, Dimensity 6300, 6GB RAM',
        price: 12999,
        stock: 60,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
    },
    {
        productName: 'Samsung Galaxy F06 5G',
        description: '6.6" LCD display, Dimensity 6300, 8GB RAM',
        price: 13999,
        stock: 80,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400'
    },
    {
        productName: 'Google Pixel 9a',
        description: '6.3" OLED display, Tensor G4, 8GB RAM',
        price: 39999,
        stock: 40,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400'
    },
    {
        productName: 'Realme Narzo 70 5G',
        description: '6.72" LCD display, Dimensity 7050, 6GB RAM',
        price: 14999,
        stock: 90,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400'
    },
    {
        productName: 'POCO X6 Pro',
        description: '6.67" AMOLED display, Dimensity 8300 Ultra, 12GB RAM',
        price: 26999,
        stock: 55,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
    },
    {
        productName: 'iQOO Z9 5G',
        description: '6.67" AMOLED display, Dimensity 7200, 8GB RAM',
        price: 19999,
        stock: 70,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400'
    },
    {
        productName: 'OnePlus Nord CE 4',
        description: '6.7" AMOLED display, Snapdragon 7 Gen 3, 8GB RAM',
        price: 24999,
        stock: 65,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400'
    },
    {
        productName: 'Vivo T3 5G',
        description: '6.67" AMOLED display, Dimensity 7200, 8GB RAM',
        price: 18999,
        stock: 85,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
    },
    {
        productName: 'Infinix Zero 30 5G',
        description: '6.78" AMOLED display, Dimensity 8020, 12GB RAM',
        price: 21999,
        stock: 45,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400'
    },
    {
        productName: 'Lava Blaze 5G',
        description: '6.52" LCD display, Dimensity 700, 6GB RAM',
        price: 10999,
        stock: 95,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400'
    },
    {
        productName: 'Wireless Headphones',
        description: 'Bluetooth 5.0, 30-hour battery, Active Noise Cancellation',
        price: 2999,
        stock: 150,
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
    },
    {
        productName: 'Smart Watch',
        description: 'Fitness tracker, heart rate monitor, 7-day battery',
        price: 5999,
        stock: 120,
        category: 'Wearables',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
    },
    {
        productName: 'Wireless Mouse',
        description: 'Ergonomic design, 2.4GHz wireless, 18-month battery',
        price: 599,
        stock: 200,
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'
    },
    {
        productName: 'Mechanical Keyboard',
        description: 'RGB backlit, mechanical switches, USB-C',
        price: 3499,
        stock: 80,
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400'
    },
    {
        productName: 'Laptop Backpack',
        description: 'Water-resistant, 15.6" laptop compartment, USB charging port',
        price: 1299,
        stock: 110,
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'
    },
    {
        productName: 'USB-C Hub',
        description: '7-in-1 hub with HDMI, USB 3.0, SD card reader',
        price: 1499,
        stock: 130,
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400'
    },
    {
        productName: 'Phone Case',
        description: 'Shockproof, transparent, wireless charging compatible',
        price: 299,
        stock: 250,
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400'
    }
];

// Create worksheet from data
const worksheet = xlsx.utils.json_to_sheet(products);

// Create workbook
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');

// Set column widths for better readability
worksheet['!cols'] = [
    { wch: 25 },  // productName
    { wch: 50 },  // description
    { wch: 10 },  // price
    { wch: 10 },  // stock
    { wch: 15 },  // category
    { wch: 60 }   // imageUrl
];

// Save to file
const outputPath = path.join(__dirname, 'sample_products_template.xlsx');
xlsx.writeFile(workbook, outputPath);

console.log('✅ Sample Excel file created successfully!');
console.log(`📁 File location: ${outputPath}`);
console.log(`📊 Total products: ${products.length}`);
console.log('\n✨ File includes:');
console.log('   - 13 Smartphones with valid prices');
console.log('   - 7 Accessories (headphones, watch, mouse, etc.)');
console.log('   - All required fields populated');
console.log('   - Ready to upload to your system!');
