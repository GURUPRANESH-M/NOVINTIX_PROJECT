package com.example.novintix_backend.config;

import com.example.novintix_backend.dto.*;
import com.example.novintix_backend.entity.*;
import com.example.novintix_backend.repository.*;
import com.example.novintix_backend.service.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DemoDataInitializer {

    @Bean
    @Order(2)
    CommandLineRunner seedDemoData(
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            ContractPriceService contractPriceService,
            SalesOrderService salesOrderService,
            ShipmentService shipmentService,
            CreditNoteService creditNoteService,
            PaymentService paymentService
    ) {
        return args -> {
            // Only seed if demo customers don't already exist
            if (customerRepository.existsByCustomerCodeIgnoreCase("CUST-APOLLO")) {
                System.out.println("Novintix MVP demo scenarios already seeded. Skipping seeder.");
                return;
            }

            System.out.println("Seeding initial Novintix MVP demo scenario...");

            // 1. Create 4 Customers (Hospitals & Distributors)
            Customer apollo = new Customer();
            apollo.setCustomerCode("CUST-APOLLO");
            apollo.setCompanyName("Apollo City Hospital");
            apollo.setCustomerType(Customer.CustomerType.HOSPITAL);
            apollo.setContactPerson("Dr. Rajesh Sharma");
            apollo.setEmail("procurement@apollohospital.org");
            apollo.setPhone("+91 98450 11223");
            apollo.setBillingAddress("14 Greams Road, Chennai, TN");
            apollo.setShippingAddress("Central Medical Store, Apollo Hospital, Chennai");
            apollo.setCreditLimit(new BigDecimal("10000.00")); // Exact limit: $10,000
            apollo.setPaymentTermsDays(30);
            apollo.setActive(true);
            apollo = customerRepository.save(apollo);

            Customer apex = new Customer();
            apex.setCustomerCode("CUST-APEX");
            apex.setCompanyName("Apex Healthcare Distributors");
            apex.setCustomerType(Customer.CustomerType.DISTRIBUTOR);
            apex.setContactPerson("Sunil Verma");
            apex.setEmail("orders@apexhealth.com");
            apex.setPhone("+91 98210 44556");
            apex.setBillingAddress("45 Industrial Area Phase II, Mumbai, MH");
            apex.setShippingAddress("Warehouse 3, Logistics Park, Bhiwandi, MH");
            apex.setCreditLimit(new BigDecimal("25000.00")); // Limit: $25,000
            apex.setPaymentTermsDays(45);
            apex.setActive(true);
            apex = customerRepository.save(apex);

            Customer metro = new Customer();
            metro.setCustomerCode("CUST-METRO");
            metro.setCompanyName("Metro Memorial Hospital");
            metro.setCustomerType(Customer.CustomerType.HOSPITAL);
            metro.setContactPerson("Sister Clara D'Souza");
            metro.setEmail("purchase@metromemorial.org");
            metro.setPhone("+91 97110 77889");
            metro.setBillingAddress("78 Civil Lines, Delhi, DL");
            metro.setShippingAddress("Metro Hospital Pharmacy Receiving, Delhi");
            metro.setCreditLimit(new BigDecimal("15000.00"));
            metro.setPaymentTermsDays(30);
            metro.setActive(true);
            metro = customerRepository.save(metro);

            Customer medicore = new Customer();
            medicore.setCustomerCode("CUST-MEDICORE");
            medicore.setCompanyName("MediCore Pharma Wholesalers");
            medicore.setCustomerType(Customer.CustomerType.DISTRIBUTOR);
            medicore.setContactPerson("Anand Patel");
            medicore.setEmail("inventory@medicore.in");
            medicore.setPhone("+91 99040 33221");
            medicore.setBillingAddress("12 Ring Road Wholesale Market, Ahmedabad, GJ");
            medicore.setShippingAddress("MediCore Distribution Center, Sanand, GJ");
            medicore.setCreditLimit(new BigDecimal("30000.00"));
            medicore.setPaymentTermsDays(60);
            medicore.setActive(true);
            medicore = customerRepository.save(medicore);

            // 2. Create Products
            Product saline = new Product();
            saline.setProductCode("MED-IV-01");
            saline.setName("Sterile Saline IV Infusion 500ml");
            saline.setDescription("Standard 0.9% sodium chloride IV infusion bag");
            saline.setStandardPrice(new BigDecimal("25.00"));
            saline.setActive(true);
            saline = productRepository.save(saline);

            Product gloves = new Product();
            gloves.setProductCode("MED-GLV-01");
            gloves.setName("Nitrile Surgical Gloves (Box of 100)");
            gloves.setDescription("Powder-free medical grade sterile nitrile gloves");
            gloves.setStandardPrice(new BigDecimal("40.00"));
            gloves.setActive(true);
            gloves = productRepository.save(gloves);

            Product amoxicillin = new Product();
            amoxicillin.setProductCode("MED-ANT-01");
            amoxicillin.setName("Amoxicillin 500mg (100 Capsules)");
            amoxicillin.setDescription("Broad-spectrum antibiotic capsules blister pack");
            amoxicillin.setStandardPrice(new BigDecimal("50.00"));
            amoxicillin.setActive(true);
            amoxicillin = productRepository.save(amoxicillin);

            Product monitor = new Product();
            monitor.setProductCode("MED-MON-01");
            monitor.setName("Digital Blood Pressure Monitor");
            monitor.setDescription("Automated digital upper arm BP monitor with cuff");
            monitor.setStandardPrice(new BigDecimal("150.00"));
            monitor.setActive(true);
            monitor = productRepository.save(monitor);

            // 3. Establish Customer Contract Prices
            // Apollo gets Saline at $20.00 (Standard: $25.00) and Gloves at $35.00
            contractPriceService.saveContractPrice(new ContractPriceRequest(apollo.getId(), saline.getId(), new BigDecimal("20.00")));
            contractPriceService.saveContractPrice(new ContractPriceRequest(apollo.getId(), gloves.getId(), new BigDecimal("35.00")));

            // Apex gets Amoxicillin at $45.00 (Standard: $50.00) and Saline at $18.00
            contractPriceService.saveContractPrice(new ContractPriceRequest(apex.getId(), amoxicillin.getId(), new BigDecimal("45.00")));
            contractPriceService.saveContractPrice(new ContractPriceRequest(apex.getId(), saline.getId(), new BigDecimal("18.00")));

            // Metro gets Monitor at $125.00 and Gloves at $32.00
            contractPriceService.saveContractPrice(new ContractPriceRequest(metro.getId(), monitor.getId(), new BigDecimal("125.00")));
            contractPriceService.saveContractPrice(new ContractPriceRequest(metro.getId(), gloves.getId(), new BigDecimal("32.00")));

            // 4. Scenario A: ORDER THAT LANDS EXACTLY ON CUSTOMER'S CREDIT LIMIT
            // Apollo credit limit = $10,000.00.
            // 500 units of Saline @ $20.00 = $10,000.00.
            // Expected: Approved, available credit = $0.00.
            SalesOrderResponse orderApolloExact = salesOrderService.createOrder(new CreateOrderRequest(
                    apollo.getId(),
                    List.of(new OrderItemRequest(saline.getId(), 500))
            ));
            System.out.println("Scenario A Created: Order " + orderApolloExact.orderNumber() + " with Total $" + orderApolloExact.totalAmount() + " [Status: " + orderApolloExact.status() + "]");

            // 5. Scenario B: ORDER THAT SHIPS ONLY PARTLY + AUTO INVOICE FOR SHIPPED QTY
            // Apex credit limit = $25,000.00.
            // Order 400 units of Amoxicillin @ $45.00 = $18,000.00.
            SalesOrderResponse orderApex = salesOrderService.createOrder(new CreateOrderRequest(
                    apex.getId(),
                    List.of(new OrderItemRequest(amoxicillin.getId(), 400))
            ));

            // Ship only 250 units (out of 400)
            Long orderItemId = orderApex.items().get(0).id();
            ShipmentResponse partialShipment = shipmentService.createShipment(new CreateShipmentRequest(
                    orderApex.id(),
                    "BlueDart Healthcare Express",
                    "TRK-BD-998811",
                    "Batch LOT-AMX-2026-09. Temperature controlled shipping.",
                    List.of(new ShipmentItemRequest(orderItemId, 250))
            ));
            System.out.println("Scenario B Created: Partial Shipment " + partialShipment.shipmentNumber() + " for 250 units. Invoiced: " + partialShipment.invoiceNumber());

            // 6. Scenario C: DAMAGED GOODS RETURN -> CREDIT NOTE ISSUED
            // 10 units of Amoxicillin damaged in transit
            CreditNoteResponse creditNote = creditNoteService.createCreditNote(new CreateCreditNoteRequest(
                    apex.getId(),
                    partialShipment.invoiceId(),
                    "10 blister packs damaged due to container crush in transit",
                    List.of(new CreditNoteItemRequest(amoxicillin.getId(), 10, new BigDecimal("45.00"), "DAMAGED"))
            ));
            System.out.println("Scenario C Created: Credit Note " + creditNote.creditNoteNumber() + " for $" + creditNote.totalAmount());

            // 7. Scenario D: PAYMENT RECORDED
            // Apex pays $5,000 towards the invoice
            PaymentResponse payment = paymentService.createPayment(new CreatePaymentRequest(
                    apex.getId(),
                    partialShipment.invoiceId(),
                    new BigDecimal("5000.00"),
                    "BANK_TRANSFER",
                    "NEFT-ICICI-88776655",
                    "Partial payment for " + partialShipment.invoiceNumber()
            ));
            System.out.println("Scenario D Created: Payment " + payment.paymentNumber() + " of $" + payment.amount());

            // 8. Scenario E: CREDIT LIMIT EXCEEDED -> PUT ON HOLD
            // Apollo already has $10,000 open order (100% of $10,000 limit).
            // Attempting to place an additional order of $700 (20 gloves @ $35)
            SalesOrderResponse orderApolloExceeded = salesOrderService.createOrder(new CreateOrderRequest(
                    apollo.getId(),
                    List.of(new OrderItemRequest(gloves.getId(), 20))
            ));
            System.out.println("Scenario E Created: Order " + orderApolloExceeded.orderNumber() + " Total: $" + orderApolloExceeded.totalAmount() + " [Status: " + orderApolloExceeded.status() + " | Hold Reason: " + orderApolloExceeded.holdReason() + "]");

            System.out.println("Demo scenarios successfully initialized!");
        };
    }
}
