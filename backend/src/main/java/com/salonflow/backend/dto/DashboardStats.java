package com.salonflow.backend.dto;

import java.math.BigDecimal;
import java.util.Map;

public class DashboardStats {
    private BigDecimal totalRevenue;
    private long totalCustomers;
    private long totalServices;
    private long totalProducts;
    private Map<String, BigDecimal> revenueByService;
    private Map<String, BigDecimal> revenueByProduct;

    public DashboardStats() {}

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }
    public long getTotalServices() { return totalServices; }
    public void setTotalServices(long totalServices) { this.totalServices = totalServices; }
    public long getTotalProducts() { return totalProducts; }
    public void setTotalProducts(long totalProducts) { this.totalProducts = totalProducts; }
    public Map<String, BigDecimal> getRevenueByService() { return revenueByService; }
    public void setRevenueByService(Map<String, BigDecimal> revenueByService) { this.revenueByService = revenueByService; }
    public Map<String, BigDecimal> getRevenueByProduct() { return revenueByProduct; }
    public void setRevenueByProduct(Map<String, BigDecimal> revenueByProduct) { this.revenueByProduct = revenueByProduct; }
}
