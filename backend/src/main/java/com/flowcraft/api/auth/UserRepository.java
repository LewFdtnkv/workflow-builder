package com.flowcraft.api.auth;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface UserRepository extends JpaRepository<User,UUID>{ Optional<User> findByEmailIgnoreCase(String email); }
