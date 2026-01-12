package pl.agh.edu.libraryapp.book.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.BookItem;
import pl.agh.edu.libraryapp.book.Rentals;
import pl.agh.edu.libraryapp.book.repositories.RentalsRepository;
import pl.agh.edu.libraryapp.book.exceptions.RentalNotFoundException;
import pl.agh.edu.libraryapp.book.exceptions.BookItemNotAvailableException;
import pl.agh.edu.libraryapp.user.User;
import pl.agh.edu.libraryapp.user.UserRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class RentalsService {

    private final RentalsRepository rentalRepository;
    private final BookItemService bookItemService;
    private final BookService bookService;
    private final UserRepository userRepository;
    private final BookQueueService bookQueueService;

    public RentalsService(RentalsRepository rentalRepository, BookItemService bookItemService,
                         BookService bookService, UserRepository userRepository,  BookQueueService bookQueueService) {
        this.rentalRepository = rentalRepository;
        this.bookItemService = bookItemService;
        this.bookService = bookService;
        this.userRepository = userRepository;
        this.bookQueueService = bookQueueService;
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

    @Transactional
    public Rentals rentBookAuto(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!bookQueueService.canUserBorrowBook(userId, bookId)) {
            throw new BookItemNotAvailableException("Książka jest zarezerwowana dla pierwszej osoby w kolejce. Musisz zaczekać w kolejce.");
        }

        // Znajdź pierwszy dostępny egzemplarz
        Book book = bookService.getBookById(bookId);
        List<BookItem> availableItems = bookItemService.getAvailableBookItemsByBook(bookId);
        
        if (availableItems.isEmpty()) {
            throw new BookItemNotAvailableException("Brak dostępnych egzemplarzy tej książki");
        }

        BookItem bookItem = availableItems.get(0);

        bookQueueService.removeUserFromNotifiedQueue(userId, bookId);

        Rentals rental = new Rentals();
        rental.setUser(user);
        rental.setBookItem(bookItem);
        rental.setStatus("ACTIVE");
        rental.setStartDate(LocalDate.now());
        rental.setEndDate(LocalDate.now().plusWeeks(2));

        bookItemService.markAsRented(bookItem.getId());

        return rentalRepository.save(rental);
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

    public Rentals extendRental(Long rentalId, int additionalDays) {
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
}