package pl.agh.edu.libraryapp.rentals;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import pl.agh.edu.libraryapp.bookItem.BookItem;
import pl.agh.edu.libraryapp.user.User;

@Entity
@Table(name = "rentals")
public class Rentals {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="book_item_id")
    private BookItem bookItem;

    @NotNull(message = "status is required")
    private String status;
    //tutaj mozna enuma zrobić z tymi statusami

    @NotNull(message = "start date is required")
    private java.time.LocalDate startDate;

    private java.time.LocalDate endDate;

    public Rentals() {}

    public Rentals(String status, java.time.LocalDate startDate) {
        this.status = status;
        this.startDate = startDate;
    }

    //settery i gettery
    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}
    public User getUser() {return user;}
    public void setUser(User user) {this.user = user;}
    public BookItem getBookItem() {return bookItem;}
    public void setBookItem(BookItem bookItem) {this.bookItem = bookItem;}
    public String getStatus() {return status;}
    public void setStatus(String status) {this.status = status;}
    public java.time.LocalDate getStartDate() {return startDate;}
    public void setStartDate(java.time.LocalDate startDate) {this.startDate = startDate;}
    public java.time.LocalDate getEndDate() {return endDate;}
    public void setEndDate(java.time.LocalDate endDate) {this.endDate = endDate;}
}
