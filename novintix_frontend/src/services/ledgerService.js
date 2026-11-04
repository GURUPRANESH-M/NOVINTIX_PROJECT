import api from "./api";

const ledgerService = {
  getByCustomer: (customerId) => api.get(`/ledger/customer/${customerId}`),
};

export default ledgerService;

