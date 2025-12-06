package pl.agh.edu.libraryapp.book.repositories;

import pl.agh.edu.libraryapp.book.BookItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookItemRepository extends JpaRepository<BookItem, Long> {
}
