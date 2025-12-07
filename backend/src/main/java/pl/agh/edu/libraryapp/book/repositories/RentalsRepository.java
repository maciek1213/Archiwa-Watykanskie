package pl.agh.edu.libraryapp.book.repositories;

import pl.agh.edu.libraryapp.book.Rentals;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalsRepository extends JpaRepository<Rentals, Long> {
}
