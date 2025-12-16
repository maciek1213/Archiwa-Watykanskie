package pl.agh.edu.libraryapp.book.repositories;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.agh.edu.libraryapp.book.Rentals;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.agh.edu.libraryapp.user.User;

import java.time.LocalDate;
import java.util.List;

public interface RentalsRepository extends JpaRepository<Rentals, Long> {
    List<Rentals> findByUser(User user);
    List<Rentals> findByUserAndStatus(User user, String status);

    @Query("SELECT r FROM Rentals r WHERE r.status = 'ACTIVE' AND r.endDate < :currentDate")
    List<Rentals> findOverdueRentals(@Param("currentDate") LocalDate currentDate);
}
