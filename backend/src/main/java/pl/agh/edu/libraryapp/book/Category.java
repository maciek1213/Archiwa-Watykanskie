package pl.agh.edu.libraryapp.book;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "category")
@JsonIgnoreProperties({"books"})  // Ignoruj pole books przy deserializacji
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "category name is required")
    private String name;

    @ManyToMany(mappedBy = "categories")
    @JsonIgnoreProperties("categories")
    private Set<Book> books = new HashSet<>();

    public Category() {
    }

    public Category(String name) {
        this.name = name;
    }

    @JsonCreator
    public Category(
            @JsonProperty("id") Long id,
            @JsonProperty("name") String name
    ) {
        this.id = id;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<Book> getBooks() {
        return books;
    }

    public void setBooks(Set<Book> books) {
        this.books = books;
    }
}