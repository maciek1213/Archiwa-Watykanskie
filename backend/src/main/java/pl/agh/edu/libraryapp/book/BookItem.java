package pl.agh.edu.libraryapp.book;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name="book_item")
public class BookItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "isbn is required")
    private String isbn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="book_id")
    @JsonBackReference("book-items")
    private Book book;

    @NotNull(message = "availability status is required")
    private Boolean isAvailable = true;

    @OneToMany(mappedBy = "bookItem", cascade = CascadeType.ALL)
    @JsonIgnore
    private Set<Rentals> rentals = new HashSet<>();

    public BookItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }
    public Book getBook() { return book; }
    public void setBook(Book book) { this.book = book; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public Set<Rentals> getRentals() { return rentals; }
    public void setRentals(Set<Rentals> rentals) { this.rentals = rentals; }
}