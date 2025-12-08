package pl.agh.edu.libraryapp.book.repositories;

import org.springframework.data.jpa.repository.Query;
import pl.agh.edu.libraryapp.book.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.agh.edu.libraryapp.book.Category;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByTitleContainingIgnoreCase(String title);
    List<Book> findByAuthorContainingIgnoreCase(String author);
    List<Book> findByCategoriesContaining(Category category);

    @Query("SELECT b FROM Book b WHERE b.count > 0")
    List<Book> findAvailableBooks();
}