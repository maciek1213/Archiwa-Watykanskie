package pl.agh.edu.libraryapp.stats;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.agh.edu.libraryapp.book.BookQueue;
import pl.agh.edu.libraryapp.book.services.BookService;
import pl.agh.edu.libraryapp.rentals.RentalsService;
import pl.agh.edu.libraryapp.user.UserService;

import java.util.List;

@RestController
@RequestMapping("/stats")
public class StatisticsController {
    private final UserService userService;
    private final BookService bookService;
    private final RentalsService rentalsService;

    public StatisticsController(UserService userService, BookService bookService, RentalsService rentalsService) {
        this.userService = userService;
        this.bookService = bookService;
        this.rentalsService = rentalsService;
    }

    @GetMapping("/rentalsPerUser")
    public List<BooksBorrowedByUserDTO> getBooksBorrowedPerUser() {
        return rentalsService.getBooksBorrowedPerUser();
    }

    @GetMapping("/rentalsByBook")
    public List<BookRentalsDTO> getTimesRentedPerBook() {
        return rentalsService.getTimesRentedPerBook();
    }

    @GetMapping("/rentalsByBookThisYear")
    public List<BookRentalsDTO> getTimesRentedPerBookThisYear() {
        return rentalsService.getTimesRentedPerBookThisYear();
    }
}
