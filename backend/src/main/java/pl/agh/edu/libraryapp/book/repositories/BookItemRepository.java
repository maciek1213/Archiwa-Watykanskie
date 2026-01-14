package pl.agh.edu.libraryapp.book.repositories;

import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.BookItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookItemRepository extends JpaRepository<BookItem, Long> {
    List<BookItem> findByBook(Book book);
    List<BookItem> findByBookAndIsAvailableTrue(Book book);
    List<BookItem> findByIsAvailableTrue();
    
    @Query("SELECT bi FROM BookItem bi JOIN FETCH bi.book WHERE bi.id = :id")
    Optional<BookItem> findByIdWithBook(@Param("id") Long id);
}
