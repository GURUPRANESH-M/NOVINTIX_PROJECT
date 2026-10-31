package com.example.novintix_backend.service;

import com.example.novintix_backend.dto.CustomerRequest;
import com.example.novintix_backend.dto.CustomerResponse;
import com.example.novintix_backend.entity.Customer;
import com.example.novintix_backend.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {

        String customerCode = normalizeCode(request.customerCode());

        if (customerRepository.existsByCustomerCodeIgnoreCase(customerCode)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Customer code already exists"
            );
        }

        Customer customer = new Customer();

        applyRequest(customer, request);
        customer.setCustomerCode(customerCode);
        customer.setActive(true);

        Customer savedCustomer = customerRepository.save(customer);

        return CustomerResponse.from(savedCustomer);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> getAllCustomers(String search) {

        List<Customer> customers;

        if (search == null || search.isBlank()) {
            customers = customerRepository.findAllByOrderByCreatedAtDesc();
        } else {
            String query = search.trim();

            customers =
                    customerRepository
                            .findByCompanyNameContainingIgnoreCaseOrCustomerCodeContainingIgnoreCase(
                                    query,
                                    query
                            );
        }

        return customers.stream()
                .map(CustomerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        return CustomerResponse.from(findCustomer(id));
    }

    @Transactional
    public CustomerResponse updateCustomer(
            Long id,
            CustomerRequest request
    ) {
        Customer customer = findCustomer(id);

        String customerCode = normalizeCode(request.customerCode());

        if (customerRepository.existsByCustomerCodeIgnoreCaseAndIdNot(
                customerCode,
                id
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Another customer already uses this customer code"
            );
        }

        applyRequest(customer, request);
        customer.setCustomerCode(customerCode);

        return CustomerResponse.from(customerRepository.save(customer));
    }

    @Transactional
    public void deactivateCustomer(Long id) {
        Customer customer = findCustomer(id);
        customer.setActive(false);
        customerRepository.save(customer);
    }

    private Customer findCustomer(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer not found"
                ));
    }

    private void applyRequest(
            Customer customer,
            CustomerRequest request
    ) {
        customer.setCompanyName(request.companyName().trim());
        customer.setCustomerType(request.customerType());
        customer.setContactPerson(request.contactPerson().trim());
        customer.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        customer.setPhone(request.phone().trim());
        customer.setBillingAddress(request.billingAddress().trim());
        customer.setShippingAddress(request.shippingAddress().trim());
        customer.setCreditLimit(request.creditLimit());
        customer.setPaymentTermsDays(request.paymentTermsDays());
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }
}