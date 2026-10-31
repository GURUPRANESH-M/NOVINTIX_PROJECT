
import api from "./api";

const productService = {
  // Get all products or search by product name/code
  getAll(search = "") {
    return api.get("/products", {
      params: search.trim()
        ? { search: search.trim() }
        : {},
    });
  },

  // Get one product by ID
  getById(id) {
    return api.get(`/products/${id}`);
  },

  // Create a product
  create(product) {
    return api.post("/products", product);
  },

  // Update a product
  update(id, product) {
    return api.put(`/products/${id}`, product);
  },

  // Deactivate a product
  deactivate(id) {
    return api.patch(`/products/${id}/deactivate`);
  },

  // Activate a product
  activate(id) {
    return api.patch(`/products/${id}/activate`);
  },
};

export default productService;