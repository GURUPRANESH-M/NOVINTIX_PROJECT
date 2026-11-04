import api from "./api";

const paymentService = {
  getAll: (customerId) => {
    const params = customerId ? { customerId } : {};
    return api.get("/payments", { params });
  },

  getById: (id) => api.get(`/payments/${id}`),

  create: (data) => api.post("/payments", data),
};

export default paymentService;

