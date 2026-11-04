import api from "./api";

const invoiceService = {
  getAll: (customerId) => {
    const params = customerId ? { customerId } : {};
    return api.get("/invoices", { params });
  },

  getById: (id) => api.get(`/invoices/${id}`),
};

export default invoiceService;

