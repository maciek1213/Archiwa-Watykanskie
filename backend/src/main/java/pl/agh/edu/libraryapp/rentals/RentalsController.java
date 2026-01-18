package pl.agh.edu.libraryapp.rentals;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rentals")
public class RentalsController {

    private final RentalsService rentalsService;

    public RentalsController(RentalsService rentalsService) {
        this.rentalsService = rentalsService;
    }

    @PostMapping("/rent")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Rentals> rentBook(@RequestParam Long bookItemId,
                                            @RequestParam Long userId) {
        Rentals rental = rentalsService.rentBook(userId, bookItemId);
        return ResponseEntity.ok(rental);
    }

    @PostMapping("/rent-by-book")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Rentals> rentBookAuto(@RequestParam Long bookId,
                                                @RequestParam Long userId) {
        Rentals rental = rentalsService.rentBookAuto(userId, bookId);
        return ResponseEntity.ok(rental);
    }

    @PostMapping("/return/{rentalId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Rentals> returnBook(@PathVariable Long rentalId) {
        Rentals rental = rentalsService.returnBook(rentalId);
        return ResponseEntity.ok(rental);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Rentals>> getUserRentals(@PathVariable Long userId) {
        List<Rentals> rentals = rentalsService.getRentalsByUser(userId);
        return ResponseEntity.ok(rentals);
    }
}