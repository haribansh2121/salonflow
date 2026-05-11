package com.salonflow.backend.controller;

import com.salonflow.backend.dto.DashboardStats;
import com.salonflow.backend.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*") // For development convenience
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/stats")
    public DashboardStats getStats(@RequestParam String tenantId) {
        return dashboardService.getStats(tenantId);
    }
}
