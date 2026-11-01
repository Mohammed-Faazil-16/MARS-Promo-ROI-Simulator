// Frontend retailer/account reference data.
// Demo/reference records only; production records will be loaded through the backend API.
export const RETAILERS = [
{ id: 1, name: "Reliance Retail", region: "Pan-India", accountManager: "A. Sharma (Demo)", isActive: true }, 

  { id: 2, name: "DMart", region: "Pan-India", accountManager: "R. Iyer (Demo)", isActive: true }, 

  { id: 3, name: "More Retail", region: "South", accountManager: "M. Kulkarni (Demo)", isActive: true }, 

  { id: 4, name: "BigBasket", region: "Pan-India", accountManager: "P. Nair (Demo)", isActive: true }, 

  { id: 5, name: "Blinkit", region: "Pan-India", accountManager: "S. Reddy (Demo)", isActive: true }, 

  { id: 6, name: "Zepto", region: "West", accountManager: "N. Patel (Demo)", isActive: true }, 

  { id: 7, name: "Amazon Fresh", region: "Pan-India", accountManager: "T. Banerjee (Demo)", isActive: true }, 

  { id: 8, name: "Spencer's Retail", region: "East", accountManager: "D. Thomas (Demo)", isActive: true }, 

  { id: 9, name: "JioMart", region: "Pan-India", accountManager: "K. Gupta (Demo)", isActive: true }, 

  { id: 10, name: "Star Bazaar", region: "West", accountManager: "M. Desai (Demo)", isActive: true }, 

  { id: 11, name: "Nature's Basket", region: "West", accountManager: "S. Roy (Demo)", isActive: true }, 

  { id: 12, name: "Metro Wholesale", region: "Pan-India", accountManager: "A. Menon (Demo)", isActive: true }, 

  { id: 13, name: "Vishal Mega Mart", region: "Pan-India", accountManager: "V. Singh (Demo)", isActive: true }, 

  { id: 14, name: "Smart Bazaar", region: "Pan-India", accountManager: "R. Kapoor (Demo)", isActive: true }, 

  { id: 15, name: "Reliance Smart Point", region: "Pan-India", accountManager: "J. Fernandes (Demo)", isActive: true }, 

  { id: 16, name: "Reliance Fresh", region: "West", accountManager: "P. Chatterjee (Demo)", isActive: true }, 

  { id: 17, name: "Easyday", region: "North", accountManager: "A. Sharma (Demo)", isActive: false }, 

  { id: 18, name: "Natures Basket Online", region: "West", accountManager: "N. Patel (Demo)", isActive: false }, 

  { id: 19, name: "Swiggy Instamart", region: "Pan-India", accountManager: "R. Iyer (Demo)", isActive: true }, 

  { id: 20, name: "Flipkart Grocery", region: "Pan-India", accountManager: "K. Gupta (Demo)", isActive: true }, 

  { id: 21, name: "Tata Neu Grocery", region: "Pan-India", accountManager: "M. Kulkarni (Demo)", isActive: true }, 

  { id: 22, name: "Kirana Partner - North", region: "North", accountManager: "V. Singh (Demo)", isActive: true }, 

  { id: 23, name: "Kirana Partner - South", region: "South", accountManager: "P. Nair (Demo)", isActive: true }, 

  { id: 24, name: "Kirana Partner - East", region: "East", accountManager: "T. Banerjee (Demo)", isActive: true }, 

  { id: 25, name: "Kirana Partner - West", region: "West", accountManager: "M. Desai (Demo)", isActive: true }, 

  { id: 26, name: "Distributor Account - Bengaluru", region: "South", accountManager: "A. Menon (Demo)", isActive: true }, 

  { id: 27, name: "Distributor Account - Chennai", region: "South", accountManager: "R. Iyer (Demo)", isActive: true }, 

  { id: 28, name: "Distributor Account - Kolkata", region: "East", accountManager: "P. Chatterjee (Demo)", isActive: true }, 

  { id: 29, name: "Distributor Account - Mumbai", region: "West", accountManager: "N. Patel (Demo)", isActive: true }, 

  { id: 30, name: "Distributor Account - Delhi NCR", region: "North", accountManager: "A. Sharma (Demo)", isActive: true }, 

  { id: 31, name: "Modern Trade Account - North", region: "North", accountManager: "K. Gupta (Demo)", isActive: true }, 

  { id: 32, name: "Modern Trade Account - South", region: "South", accountManager: "P. Nair (Demo)", isActive: true }, 

  { id: 33, name: "Modern Trade Account - East", region: "East", accountManager: "T. Banerjee (Demo)", isActive: true }, 

  { id: 34, name: "Modern Trade Account - West", region: "West", accountManager: "M. Desai (Demo)", isActive: true }, 

  { id: 35, name: "Eastern Trade Network (Demo)", region: "East", accountManager: "S. Roy (Demo)", isActive: true }, 

  { id: 36, name: "Northern Wholesale Partner (Demo)", region: "North", accountManager: "V. Singh (Demo)", isActive: false }, 

  { id: 37, name: "Deccan Distribution Hub (Demo)", region: "South", accountManager: "A. Menon (Demo)", isActive: true }, 

  { id: 38, name: "Western Retail Link (Demo)", region: "West", accountManager: "J. Fernandes (Demo)", isActive: false }, 

  { id: 39, name: "Bengaluru Value Mart (Demo)", region: "South", accountManager: "R. Iyer (Demo)", isActive: true }, 

  { id: 40, name: "Chennai Family Stores Network (Demo)", region: "South", accountManager: "A. Sharma (Demo)", isActive: true }, 

  { id: 41, name: "Kolkata Everyday Retail (Demo)", region: "East", accountManager: "P. Chatterjee (Demo)", isActive: true }, 

  { id: 42, name: "Pune Corner Stores Network (Demo)", region: "West", accountManager: "N. Patel (Demo)", isActive: false }, 

  { id: 43, name: "Hyderabad Fresh Basket (Demo)", region: "South", accountManager: "M. Kulkarni (Demo)", isActive: true }, 

  { id: 44, name: "Ahmedabad Retail Collective (Demo)", region: "West", accountManager: "D. Thomas (Demo)", isActive: true }, 

  { id: 45, name: "Lucknow Neighborhood Stores (Demo)", region: "North", accountManager: "S. Roy (Demo)", isActive: true }, 

  { id: 46, name: "Jaipur Regional Market (Demo)", region: "North", accountManager: "K. Gupta (Demo)", isActive: true }, 

  { id: 47, name: "Kochi Grocery Network (Demo)", region: "West", accountManager: "P. Nair (Demo)", isActive: false }, 

  { id: 48, name: "Indore City Retail Network (Demo)", region: "South", accountManager: "T. Banerjee (Demo)", isActive: true }, 

  { id: 49, name: "National Key Account Group A (Demo)", region: "Central", accountManager: "M. Desai (Demo)", isActive: true }, 

  { id: 50, name: "National Key Account Group B (Demo)", region: "Pan-India", accountManager: "V. Singh (Demo)", isActive: false }
];
