package pl.agh.edu.libraryapp.user;

import pl.agh.edu.libraryapp.book.BookQueue;
import pl.agh.edu.libraryapp.book.Rentals;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Getter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @NotNull(message = "username is required")
    private String username;


    @Setter
    @NotNull(message = "password is required")
    private String password;

    @Getter
    @Setter
    @NotNull(message = "first name is required")
    private String firstName;

    @Getter
    @Setter
    @NotNull(message = "last name is required")
    private String lastName;


    @Getter
    @Setter
    @Email
    @Column(unique = true)
    @NotNull(message = "email name is required")
    private String email;

    @Getter
    @Setter
    @NotNull(message = "phone number is required")
    @Column(unique = true)
    private String phoneNumber;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleName()))
                .collect(Collectors.toList());
    }

    @OneToMany(mappedBy = "user")
    private Set<Rentals> rentals = new HashSet<>();
    @Override
    public String getPassword() {
        return password;
    }

    @OneToMany(mappedBy = "user")
    private Set<BookQueue> BookQueues = new HashSet<>();
    @Override
    public String getUsername() {
        return username;
    }

    public User(){}

    public User(String username, String firstName, String lastName, String email, String phoneNumber) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        }

    public void addRole(Role role) {
        roles.add(role);
    }

    public void removeRole(Role role) {
        roles.remove(role);
    }
}
