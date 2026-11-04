import api from "./api";

const creditNoteService = {
  getAll: (customerId) => {
    const params = customerId ? { customerId } : {};
    return api.get("/credit-notes", { params });
  },

  getById: (id) => api.get(`/credit-notes/${id}`),

  create: (data) => api.post("/credit-notes", data),
};

export default creditNoteService;

