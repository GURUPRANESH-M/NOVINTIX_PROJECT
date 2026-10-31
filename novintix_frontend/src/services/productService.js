import api from "./api";

const productService = {
  getAll(search = "") {
    return api.get("/products", {
      params: search.trim()
        ? { search: search.trim() }
        : {},
    });
  },

  getById(id) {
    return api.get(`/products/${id}`);
  },

  create(product) {
    return api.post("/products", product);
  },

  update(id, product) {
    return api.put(`/products/${id}`, product);
  },

  deactivate(id) {
    return api.patch(`/products/${id}/deactivate`);
  },

  activate(id) {
    return api.patch(`/products/${id}/activate`);
  },
};

export default productService;