package pl.agh.edu.libraryapp.rentals;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.agh.edu.libraryapp.stats.BookRentalsDTO;
import pl.agh.edu.libraryapp.stats.BooksBorrowedByUserDTO;
import pl.agh.edu.libraryapp.user.User;

import java.time.LocalDate;
import java.util.List;

public interface RentalsRepository extends JpaRepository<Rentals, Long> {
    @Query("SELECT r FROM Rentals r JOIN FETCH r.bookItem bi JOIN FETCH bi.book WHERE r.user = :user")
    List<Rentals> findByUser(@Param("user") User user);
    
    List<Rentals> findByUserAndStatus(User user, String status);

    @Query("SELECT r FROM Rentals r WHERE r.status = 'ACTIVE' AND r.endDate < :currentDate")
    List<Rentals> findOverdueRentals(@Param("currentDate") LocalDate currentDate);

    List<Rentals> findByStatusAndEndDate(String status ,LocalDate soon);

    @Query(
            """
            SELECT new pl.agh.edu.libraryapp.stats.BooksBorrowedByUserDTO(u, COUNT(r))
            FROM User u
            JOIN Rentals r ON u = r.user
            GROUP BY u.id
            ORDER BY COUNT(r) DESC
            """)
    List<BooksBorrowedByUserDTO> getBooksBorrowedPerUser();


    @Query("""
SELECT new pl.agh.edu.libraryapp.stats.BookRentalsDTO(b, COUNT(r))
FROM Book b
JOIN Rentals r ON b.id = r.bookItem.book.id
GROUP BY b.id
ORDER BY COUNT(r) DESC
""")
    List<BookRentalsDTO> getTimesRentedPerBook();

    @Query("""
SELECT new pl.agh.edu.libraryapp.stats.BookRentalsDTO(b, COUNT(r))
FROM Book b
JOIN Rentals r ON b.id = r.bookItem.book.id AND r.startDate BETWEEN :start AND :end
GROUP BY b.id
ORDER BY COUNT(r) DESC
""")
    List<BookRentalsDTO> getTimesRentedPerBookBetweenDates(LocalDate start, LocalDate end);
}
