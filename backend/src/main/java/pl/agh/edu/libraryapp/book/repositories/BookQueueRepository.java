package pl.agh.edu.libraryapp.book.repositories;

import pl.agh.edu.libraryapp.book.BookQueue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookQueueRepository extends JpaRepository<BookQueue, Long> {
}
