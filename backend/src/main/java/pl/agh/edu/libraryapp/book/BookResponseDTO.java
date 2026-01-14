package pl.agh.edu.libraryapp.book;

import lombok.Data;
import pl.agh.edu.libraryapp.book.Category;
import java.util.Set;

@Data
public class BookResponseDTO {
    private Long id;
    private String title;
    private String author;
    private Integer count;
    private Set<Category> categories;
    private Double averageRating;
    private Long reviewCount;
}