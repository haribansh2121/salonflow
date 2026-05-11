package com.salonflow.backend;

import com.salonflow.backend.entity.*;
import com.salonflow.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private TenantRepository tenantRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private BillRepository billRepository;

    @Override
    public void run(String... args) throws Exception {
        if (tenantRepository.count() > 0) return;

        Tenant tenant = new Tenant();
        tenant.setId("demo-tenant");
        tenant.setName("Glow & Glamour Salon");
        tenant.setPlan("premium");
        tenant.setCreatedAt(LocalDateTime.now());
        tenantRepository.save(tenant);

        User admin = new User();
        admin.setTenant(tenant);
        admin.setName("Admin User");
        admin.setEmail("admin@salonflow.com");
        admin.setPasswordHash("password"); // In real app, use BCrypt
        admin.setRole("ADMIN");
        userRepository.save(admin);

        Service haircut = new Service();
        haircut.setTenant(tenant);
        haircut.setName("Haircut");
        haircut.setCategory("Hair");
        haircut.setPrice(new BigDecimal("500"));
        haircut.setDurationMinutes(30);
        serviceRepository.save(haircut);

        Service facial = new Service();
        facial.setTenant(tenant);
        facial.setName("Facial");
        facial.setCategory("Beauty");
        facial.setPrice(new BigDecimal("1200"));
        facial.setDurationMinutes(60);
        serviceRepository.save(facial);

        Product shampoo = new Product();
        shampoo.setTenant(tenant);
        shampoo.setName("Luxury Shampoo");
        shampoo.setCategory("Hair Care");
        shampoo.setPrice(new BigDecimal("800"));
        shampoo.setStock(50);
        productRepository.save(shampoo);

        // Create some sample bills for today
        Bill bill1 = new Bill();
        bill1.setTenant(tenant);
        bill1.setCustomerName("John Doe");
        bill1.setTotalAmount(new BigDecimal("1700"));
        bill1.setPaymentMethod("UPI");
        bill1.setStaff(admin);
        bill1.setCreatedAt(LocalDateTime.now());
        billRepository.save(bill1);

        Bill bill2 = new Bill();
        bill2.setTenant(tenant);
        bill2.setCustomerName("Jane Smith");
        bill2.setTotalAmount(new BigDecimal("500"));
        bill2.setPaymentMethod("Cash");
        bill2.setStaff(admin);
        bill2.setCreatedAt(LocalDateTime.now());
        billRepository.save(bill2);
    }
}
