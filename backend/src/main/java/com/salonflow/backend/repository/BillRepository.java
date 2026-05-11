package com.salonflow.backend.repository;

import com.salonflow.backend.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByTenantIdAndCreatedAtBetween(String tenantId, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT SUM(b.totalAmount) FROM Bill b WHERE b.tenant.id = :tenantId AND b.createdAt BETWEEN :start AND :end")
    java.math.BigDecimal sumTotalAmountByTenantIdAndCreatedAtBetween(String tenantId, LocalDateTime start, LocalDateTime end);
}
