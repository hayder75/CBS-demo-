package com.cbs.sacco.auth;

import com.cbs.sacco.auth.entity.AppUser;
import com.cbs.sacco.auth.entity.Role;
import com.cbs.sacco.auth.repo.RoleRepository;
import com.cbs.sacco.auth.repo.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<UserSeed> seeds = List.of(
            new UserSeed("admin", "Sisay Worku", "System Administrator", "Head Office", "ADMIN"),
            new UserSeed("manager", "Tigist Fikre", "General Manager", "Head Office", "MANAGER"),
            new UserSeed("teller", "Kaleab Desta", "Senior Teller", "Bole Branch", "TELLER"),
            new UserSeed("teller2", "Rahel Abebe", "Teller", "Bole Branch", "TELLER"),
            new UserSeed("credit", "Biruk Kebede", "Senior Credit Officer", "Head Office", "CREDIT_OFFICER"),
            new UserSeed("accountant", "Marta Demissie", "Chief Accountant", "Head Office", "ACCOUNTANT"),
            new UserSeed("auditor", "Gizachew Tulu", "Internal Auditor", "Head Office", "AUDITOR")
        );

        for (UserSeed seed : seeds) {
            if (userRepository.findByUsername(seed.username).isEmpty()) {
                Role role = roleRepository.findByCode(seed.role).orElseThrow();
                AppUser user = new AppUser();
                user.setUsername(seed.username);
                user.setPasswordHash(passwordEncoder.encode("demo123"));
                user.setFullName(seed.name);
                user.setTitle(seed.title);
                user.setBranch(seed.branch);
                user.setRole(role);
                userRepository.save(user);
            }
        }
    }

    private record UserSeed(String username, String name, String title, String branch, String role) {}
}