import { PRODUCTS } from "../data";
 
// Return all products.
export function getAllProducts() {
  return PRODUCTS;
}
 
// Return only active products.
export function getActiveProducts() {
  return PRODUCTS.filter((product) => product.isActive);
}
 
// Find a product using its ID.
export function getProductById(id) {
  return (
    PRODUCTS.find(
      (product) => product.id === Number(id)
    ) || null
  );
}
 
// Find products by category.
export function getProductsByCategory(category) {
  if (!category || category === "All") {
    return getAllProducts();
  }
 
  return PRODUCTS.filter(
    (product) => product.category === category
  );
}
 
// Search products by name, brand or category.
export function searchProducts(searchTerm = "") {
  const term = searchTerm.trim().toLowerCase();
 
  if (!term) {
    return getAllProducts();
  }
 
  return PRODUCTS.filter((product) => {
    return (
      product.name.toLowerCase().includes(term) ||
      product.brand.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  });
}
 
// Return unique product categories.
export function getProductCategories() {
  return [
    ...new Set(
      PRODUCTS.map((product) => product.category)
    ),
  ].sort();
}