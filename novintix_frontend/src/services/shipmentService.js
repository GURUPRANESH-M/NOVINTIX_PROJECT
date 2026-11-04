import api from "./api";

const shipmentService = {
  getAll: (customerId, orderId) => {
    const params = {};
    if (customerId) params.customerId = customerId;
    if (orderId) params.orderId = orderId;
    return api.get("/shipments", { params });
  },

  getById: (id) => api.get(`/shipments/${id}`),

  create: (data) => api.post("/shipments", data),
};

export default shipmentService;

