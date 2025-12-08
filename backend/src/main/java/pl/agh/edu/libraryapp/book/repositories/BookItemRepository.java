package pl.agh.edu.libraryapp.book.repositories;

import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.BookItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookItemRepository extends JpaRepository<BookItem, Long> {
    List<BookItem> findByBook(Book book);
    List<BookItem> findByBookAndIsAvailableTrue(Book book);
    List<BookItem> findByIsAvailableTrue();
}
