package com.ifti.erp.repository;
import com.ifti.erp.entity.AccountEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
public interface AccountEntryRepository extends JpaRepository<AccountEntry, Long> {
    Optional<AccountEntry> findBySourceTypeAndSourceIdAndEntryLeg(String sourceType, Long sourceId, String entryLeg);
    List<AccountEntry> findAllByOrderByEntryDateDescIdDesc();
    List<AccountEntry> findByAccountIdOrderByEntryDateDescIdDesc(Long accountId);
    @Query("select coalesce(sum(case when e.direction = 'IN' then e.amount else -e.amount end), 0) from AccountEntry e where e.account.id = :accountId")
    BigDecimal signedTotalForAccount(@Param("accountId") Long accountId);
    void deleteBySourceTypeAndSourceId(String sourceType, Long sourceId);
}
