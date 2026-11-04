import api from "./api";

const contractService = {
  getByCustomer: (customerId) => api.get(`/contracts/customer/${customerId}`),
  getPricingMatrix: (customerId) => api.get(`/contracts/customer/${customerId}/matrix`),
  save: (data) => api.post("/contracts", data),
  delete: (id) => api.delete(`/contracts/${id}`),
};

export default contractService;
