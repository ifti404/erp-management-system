package com.ifti.erp.service;

import com.ifti.erp.entity.AuditEvent;
import com.ifti.erp.repository.AuditEventRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuditServiceTest {
    private final AuditEventRepository repository = mock(AuditEventRepository.class);
    private final AuditService service = new AuditService(repository);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordCapturesSignedInActorAndCleansDetails() {
        var authentication = new TestingAuthenticationToken("mira", "secret", "ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String details = "  order created\nfor customer  " + "x".repeat(2000);

        service.record("CREATED", "SALES_ORDER", 42L, details);

        var captor = org.mockito.ArgumentCaptor.forClass(AuditEvent.class);
        verify(repository).save(captor.capture());
        AuditEvent event = captor.getValue();
        assertEquals("mira", event.getActorUsername());
        assertEquals("CREATED", event.getAction());
        assertEquals("SALES_ORDER", event.getEntityType());
        assertEquals(42L, event.getEntityId());
        assertFalse(event.getDetails().contains("\n"));
        assertTrue(event.getDetails().length() <= 1800);
    }

    @Test
    void searchAppliesDateAndNeverRequestsMoreThanFiveHundredRows() {
        when(repository.search(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        service.recent(LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31), "PRODUCT", "UPDATED", "mira", 9000);

        verify(repository).search(eq(LocalDate.of(2026, 3, 1).atStartOfDay()),
                eq(LocalDate.of(2026, 4, 1).atStartOfDay()), eq("PRODUCT"), eq("UPDATED"), eq("mira"), eq(PageRequest.of(0, 500)));
    }
}
