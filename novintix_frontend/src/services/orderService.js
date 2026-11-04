import api from "./api";

const orderService = {
  getAll: (customerId) => {
    const params = customerId ? { customerId } : {};
    return api.get("/orders", { params });
  },

  getById: (id) => api.get(`/orders/${id}`),

  create: (data) => api.post("/orders", data),

  releaseHold: (id) => api.patch(`/orders/${id}/release-hold`),

  cancel: (id) => api.patch(`/orders/${id}/cancel`),
};

export default orderService;

