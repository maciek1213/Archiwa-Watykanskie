package pl.agh.edu.libraryapp.book;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import pl.agh.edu.libraryapp.user.User;

@Entity
@Table(name="book_queue")
public class BookQueue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="user_id")
    @JsonIgnoreProperties({"password", "rentals", "bookQueues"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="book_id")
    @JsonIgnoreProperties({"bookItems", "bookQueues"})
    private Book book;

    @NotNull(message = "status is required")
    private String status;
    //tutaj mozna enuma zrobić z tymi statusami
    //ale innego niż do rentals

    public BookQueue() {}

    public BookQueue(String status) {
        this.status = status;
    }

    //gettery i settery
    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}
    public User getUser() {return user;}
    public void setUser(User user) {this.user = user;}
    public Book getBook() {return book;}
    public void setBook(Book book) {this.book = book;}
    public String getStatus() {return status;}
    public void setStatus(String status) {this.status = status;}
}
