package pl.agh.edu.libraryapp.book;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "book")
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "title is required")
    private String title;

    @NotNull(message = "author is required")
    private String author;

    @NotNull(message = "count is required")
    private Integer count = 0;

    @ManyToMany
    @JoinTable(
            name = "book_category",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @JsonIgnoreProperties("books")
    private Set<Category> categories = new HashSet<>();

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("book-items")
    private Set<BookItem> bookItems = new HashSet<>();

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BookQueue> bookQueues = new HashSet<>();

    public Book() {}

    public Book(String title, String author, Integer count) {
        this.title = title;
        this.author = author;
        this.count = count;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public Integer getCount() { return count; }
    public void setCount(Integer count) { this.count = count; }
    public Set<Category> getCategories() { return categories; }
    public void setCategories(Set<Category> categories) { this.categories = categories; }
    public Set<BookItem> getBookItems() { return bookItems; }
    public void setBookItems(Set<BookItem> bookItems) { this.bookItems = bookItems; }
    public Set<BookQueue> getBookQueues() { return bookQueues; }
    public void setBookQueues(Set<BookQueue> bookQueues) { this.bookQueues = bookQueues; }
}