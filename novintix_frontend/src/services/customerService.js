import api from "./api";

const customerService = {
    // Get all customers, optionally filtered by search text
    getAll(search = "") {
        return api.get("/customers", {
            params: search.trim()
                ? { search: search.trim() }
                : {},
        });
    },

    // Get a customer by ID
    getById(id) {
        return api.get(`/customers/${id}`);
    },

    // Create a customer
    create(customer) {
        return api.post("/customers", customer);
    },

    // Update customer details
    update(id, customer) {
        return api.put(`/customers/${id}`, customer);
    },

    // Deactivate a customer
    deactivate(id) {
        return api.patch(`/customers/${id}/deactivate`);
    },
};

export default customerService;