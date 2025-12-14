package pl.agh.edu.libraryapp.user;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Username not found: " + username));

//        return new org.springframework.security.core.userdetails.User(
//                user.getUsername(),
//                user.getPassword(),
//                user.getAuthorities()
//        );
        return user;
    }

    public User addUser(User user) throws UserAlreadyExistsException {
        userRepository.findByUsername(user.getUsername())
                .ifPresent(_ -> { throw new UserAlreadyExistsException("Username already taken"); });

        userRepository.findByEmail(user.getEmail())
                .ifPresent(_ -> { throw new UserAlreadyExistsException("Email already taken"); });

        userRepository.findByPhoneNumber(user.getPhoneNumber()).ifPresent(
                _ -> { throw new UserAlreadyExistsException("Phone number already taken"); }
        );

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        Role userRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> new RuntimeException("Default role USER not found"));
        user.addRole(userRole);
        return userRepository.save(user);
    }


    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);

        if (!user.getUsername().equals(userDetails.getUsername())) {
            userRepository.findByUsername(userDetails.getUsername())
                    .ifPresent(_ -> { throw new UserAlreadyExistsException("Username already taken"); });
        }

        if (!user.getEmail().equals(userDetails.getEmail())) {
            userRepository.findByEmail(userDetails.getEmail())
                    .ifPresent(_ -> { throw new UserAlreadyExistsException("Email already taken"); });
        }

        if (!user.getPhoneNumber().equals(userDetails.getPhoneNumber())) {
            userRepository.findByPhoneNumber(userDetails.getPhoneNumber())
                    .ifPresent(_ -> { throw new UserAlreadyExistsException("Phone number already taken"); });
        }

        user.setUsername(userDetails.getUsername());
        user.setFirstName(userDetails.getFirstName());
        user.setLastName(userDetails.getLastName());
        user.setEmail(userDetails.getEmail());
        user.setPhoneNumber(userDetails.getPhoneNumber());

        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }

    public void addRole(User user, Role role) {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new UserNotFoundException(user.getId().toString()));

        dbUser.addRole(role);
        userRepository.save(dbUser);
    }
}
