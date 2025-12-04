package user;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "first name is required")
    private String firstName;

    @NotNull(message = "last name is required")
    private String lastName;

    @Email
    @Column(unique = true)
    @NotNull(message = "email name is required")
    private String email;

    @NotNull(message = "phone number is required")
    @Column(unique = true)
    private String phoneNumber;

}
