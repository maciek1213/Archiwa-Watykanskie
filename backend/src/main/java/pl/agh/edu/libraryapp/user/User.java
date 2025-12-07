package pl.agh.edu.libraryapp.user;

import pl.agh.edu.libraryapp.book.BookQueue;
import pl.agh.edu.libraryapp.book.Rentals;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;

    @OneToMany(mappedBy = "user")
    private Set<Rentals> rentals = new HashSet<>();

    @OneToMany(mappedBy = "user")
    private Set<BookQueue> BookQueues = new HashSet<>();

    public User(){}

    public User(String firstName, String lastName, String email, String phoneNumber) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }

    //settery i gettery
    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}
    public String getFirstName() {return firstName;}
    public void setFirstName(String firstName) {this.firstName = firstName;}
    public String getLastName() {return lastName;}
    public void setLastName(String lastName) {this.lastName = lastName;}
    public String getEmail() {return email;}
    public void setEmail(String email) {this.email = email;}
    public String getPhoneNumber() {return phoneNumber;}
    public void setPhoneNumber(String phoneNumber) {this.phoneNumber = phoneNumber;}
    public Role getRole() {return role;}
    public void setRole(Role role) {this.role = role;}
    public Set<Rentals> getRentals() {return rentals;}
    public void setRentals(Set<Rentals> rentals) {this.rentals = rentals;}
    public Set<BookQueue> getBookQueues() {return BookQueues;}
    public void setBookQueues(Set<BookQueue> bookQueues) {BookQueues = bookQueues;}
}
