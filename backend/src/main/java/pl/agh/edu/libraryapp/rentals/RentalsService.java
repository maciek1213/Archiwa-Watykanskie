package pl.agh.edu.libraryapp.rentals;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.bookItem.BookItem;
import pl.agh.edu.libraryapp.bookItem.BookItemService;
import pl.agh.edu.libraryapp.bookQueue.BookQueueService;
import pl.agh.edu.libraryapp.book.services.BookService;
import pl.agh.edu.libraryapp.bookItem.BookItemNotAvailableException;
import pl.agh.edu.libraryapp.notifications.NotificationService;
import pl.agh.edu.libraryapp.stats.BookRentalsDTO;
import pl.agh.edu.libraryapp.stats.BooksBorrowedByUserDTO;
import pl.agh.edu.libraryapp.user.User;
import pl.agh.edu.libraryapp.user.UserRepository;

import java.sql.Date;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class RentalsService {

    private final RentalsRepository rentalRepository;
    private final BookItemService bookItemService;
    private final BookService bookService;
    private final UserRepository userRepository;
    private final BookQueueService bookQueueService;
    private final NotificationService notificationService;

    public RentalsService(RentalsRepository rentalRepository, BookItemService bookItemService,
                          BookService bookService, UserRepository userRepository, BookQueueService bookQueueService, NotificationService notificationService) {
        this.rentalRepository = rentalRepository;
        this.bookItemService = bookItemService;
        this.bookService = bookService;
        this.userRepository = userRepository;
        this.bookQueueService = bookQueueService;
        this.notificationService = notificationService;
    }

    public Rentals rentBook(Long userId, Long bookItemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if book item is available
        if (!bookItemService.isBookItemAvailable(bookItemId)) {
            throw new BookItemNotAvailableException("Book item is not available for rent");
        }

        BookItem bookItem = bookItemService.getBookItemById(bookItemId);
        Long bookId = bookItem.getBook().getId();

        if (!bookQueueService.canUserBorrowBook(userId, bookId)) {
            throw new BookItemNotAvailableException("Książka jest zarezerwowana dla pierwszej osoby w kolejce. Musisz zaczekać w kolejce.");
        }

        bookQueueService.removeUserFromNotifiedQueue(userId, bookId);

        // Create rental record
        Rentals rental = new Rentals();
        rental.setUser(user);
        rental.setBookItem(bookItem);
        rental.setStatus("ACTIVE");
        rental.setStartDate(LocalDate.now());
        rental.setEndDate(LocalDate.now().plusWeeks(2)); // 2 weeks rental period


        bookItemService.markAsRented(bookItemId);

        return rentalRepository.save(rental);
    }

    @Transactional // 1. Zapewnia atomowość operacji
    public Rentals rentBookAuto(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!bookQueueService.canUserBorrowBook(userId, bookId)) {
            throw new BookItemNotAvailableException("Książka jest zarezerwowana...");
        }

        BookItem bookItem = bookItemService.getAvailableBookItemsByBook(bookId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new BookItemNotAvailableException("Brak dostępnych egzemplarzy"));

        bookQueueService.removeUserFromNotifiedQueue(userId, bookId);

        Rentals rental = new Rentals();
        rental.setUser(user);
        rental.setBookItem(bookItem);
        rental.setStatus("ACTIVE");
        rental.setStartDate(LocalDate.now());
        rental.setEndDate(LocalDate.now().plusWeeks(2));

        bookItemService.markAsRented(bookItem.getId());
        Rentals savedRental = rentalRepository.save(rental);

        return savedRental;
    }

    @Transactional
    public Rentals returnBook(Long rentalId) {
        Rentals rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RentalNotFoundException("Rental not found"));

        Long bookId = rental.getBookItem().getBook().getId();

        rental.setStatus("RETURNED");
        rental.setEndDate(LocalDate.now());
        rentalRepository.save(rental);

        bookItemService.markAsAvailable(rental.getBookItem().getId());

        bookQueueService.notifyAvailableBook(bookId);

        return rental;
    }

    private Rentals extendRental(Long rentalId, int additionalDays) {
        Rentals rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RentalNotFoundException("Rental not found"));

        if (!"ACTIVE".equals(rental.getStatus())) {
            throw new RuntimeException("Only active rentals can be extended");
        }

        rental.setEndDate(rental.getEndDate().plusDays(additionalDays));
        return rentalRepository.save(rental);
    }

    public Rentals getRentalById(Long id) {
        return rentalRepository.findById(id)
                .orElseThrow(() -> new RentalNotFoundException("Rental not found with id: " + id));
    }

    public List<Rentals> getAllRentals() {
        return rentalRepository.findAll();
    }

    public List<Rentals> getRentalsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return rentalRepository.findByUser(user);
    }

    public List<Rentals> getActiveRentalsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return rentalRepository.findByUserAndStatus(user, "ACTIVE");
    }

    public List<Rentals> getOverdueRentals() {
        return rentalRepository.findOverdueRentals(LocalDate.now());
    }

    @Transactional
    public void prolongBookReservation(User user, Long bookId) {
        Book book = bookService.getBookById(bookId);

        Rentals bookRental = rentalRepository.findByUserAndStatus(user, "ACTIVE").stream()
                .filter(rental -> Objects.equals(rental.getBookItem().getBook().getId(), bookId))
                .findAny()
                .orElseThrow(() -> new RentalNotFoundException("Book not found"));

        if(bookRental.isHasBeenProlonged()) {
            throw new RentalCantBeProlongedException("Nie można przedłużyć rezerwacji. Ta rezerwacja już była przedłużona.");
        }

        if (bookQueueService.isQueueEmpty(book)) {
            extendRental(bookRental.getId(), 14);
            bookRental.setHasBeenProlonged(true);
        } else {
            throw new RentalCantBeProlongedException("Nie można przedłużyć rezerwacji. Ktoś czeka na ten egzemplarz.");
        }
    }

    public List<BooksBorrowedByUserDTO> getBooksBorrowedPerUser() {
        return rentalRepository.getBooksBorrowedPerUser();
    }

    public List<BookRentalsDTO> getTimesRentedPerBook() {
        return rentalRepository.getTimesRentedPerBook();
    }

    public List<BookRentalsDTO> getTimesRentedPerBookThisYear() {
        LocalDate start = LocalDate.now().withDayOfYear(1);
        LocalDate end = LocalDate.now().withDayOfYear(356);
        return rentalRepository.getTimesRentedPerBookBetweenDates(start, end);
    }
}