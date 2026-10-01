package com.flowcraft.api.workflow;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface WorkflowRepository extends JpaRepository<WorkflowEntity,UUID>{ List<WorkflowEntity> findByOwnerIdOrderByUpdatedAtDesc(UUID ownerId); Optional<WorkflowEntity> findByIdAndOwnerId(UUID id,UUID ownerId); }
