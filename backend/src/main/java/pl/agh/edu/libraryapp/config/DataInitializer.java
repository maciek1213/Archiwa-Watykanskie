package pl.agh.edu.libraryapp.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import pl.agh.edu.libraryapp.user.Role;
import pl.agh.edu.libraryapp.user.RoleRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    public DataInitializer(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (roleRepository.findByRoleName("USER").isEmpty()) {
            Role userRole = new Role("USER");
            roleRepository.save(userRole);
        }

        if (roleRepository.findByRoleName("ADMIN").isEmpty()) {
            Role adminRole = new Role("ADMIN");
            roleRepository.save(adminRole);
        }
    }
}