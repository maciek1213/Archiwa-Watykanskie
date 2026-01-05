package pl.agh.edu.libraryapp.book;

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

    @NotNull(message = "author is required")
    private String author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="book_id")
    private Book book;

    @NotNull(message = "avaibilty status is required")
    private Boolean isAvailable;

    //relacje nie bedace w tabeli book_item
    @OneToMany(mappedBy = "bookItem")
    private Set<Rentals> rentals = new HashSet<>();

    public BookItem() {}

    public BookItem(String author, Boolean isAvailable) {
        this.author = author;
        this.isAvailable = isAvailable;
    }

    //settery i gettery
    public Long getId() {return id;}
    public void setId(Long id) {this.id = id;}
    public Integer getIsbn() {return isbn;}
    public void setIsbn(Integer isbn) {this.isbn = isbn;}
    public String getAuthor() {return author;}
    public void setAuthor(String author) {this.author = author;}
    public Book getBook() {return book;}
    public void setBook(Book book) {this.book = book;}
    public Boolean getIsAvailable() {return isAvailable;}
    public void setIsAvailable(Boolean isAvailable) {this.isAvailable = isAvailable;}
    public Set<Rentals> getRentals() {return rentals;}
    public void setRentals(Set<Rentals> rentals){this.rentals = rentals;}
}
