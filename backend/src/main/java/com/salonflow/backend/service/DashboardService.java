package com.salonflow.backend.service;

import com.salonflow.backend.dto.DashboardStats;
import com.salonflow.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {
    @Autowired private BillRepository billRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ServiceRepository serviceRepository;
    @Autowired private ProductRepository productRepository;

    public DashboardStats getStats(String tenantId) {
        LocalDateTime start = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime end = LocalDateTime.now().with(LocalTime.MAX);

        BigDecimal todayRevenue = billRepository.sumTotalAmountByTenantIdAndCreatedAtBetween(tenantId, start, end);
        if (todayRevenue == null) todayRevenue = BigDecimal.ZERO;

        DashboardStats stats = new DashboardStats();
        stats.setTotalRevenue(todayRevenue);
        stats.setTotalCustomers(billRepository.count()); // This should be filtered by tenant and unique customers in a real app
        stats.setTotalServices(serviceRepository.findByTenantId(tenantId).size());
        stats.setTotalProducts(productRepository.findByTenantId(tenantId).size());
        
        // Mocking some data for the charts since we don't have many records yet
        Map<String, BigDecimal> serviceRevenue = new HashMap<>();
        serviceRevenue.put("Haircut", new BigDecimal("1200"));
        serviceRevenue.put("Massage", new BigDecimal("800"));
        stats.setRevenueByService(serviceRevenue);

        Map<String, BigDecimal> productRevenue = new HashMap<>();
        productRevenue.put("Shampoo", new BigDecimal("450"));
        productRevenue.put("Wax", new BigDecimal("300"));
        stats.setRevenueByProduct(productRevenue);

        return stats;
    }
}
