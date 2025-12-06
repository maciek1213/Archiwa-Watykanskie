package pl.agh.edu.libraryapp.user;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
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
        return userRepository.save(user);
    }

    public void addRole(User user, Role role) {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new UserNotFoundException(user.getId().toString()));

        dbUser.addRole(role);
        userRepository.save(dbUser);
    }
}
