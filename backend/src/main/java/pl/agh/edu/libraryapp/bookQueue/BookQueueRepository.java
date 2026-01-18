package pl.agh.edu.libraryapp.bookQueue;

import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.BookQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.agh.edu.libraryapp.user.User;

import java.util.List;

public interface BookQueueRepository extends JpaRepository<BookQueue, Long> {
    List<BookQueue> findByBook(Book book);
    List<BookQueue> findByBookOrderByIdAsc(Book book);
    List<BookQueue> findByUser(User user);
    List<BookQueue> findByUserAndBook(User user, Book book);
    List<BookQueue> findByBookAndStatusOrderByIdAsc(Book book, String status);
    boolean existsByUserAndBookAndStatus(User user, Book book, String status);
    boolean existsByBookAndStatus(Book book, String status);
}
