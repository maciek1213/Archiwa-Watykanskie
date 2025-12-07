package pl.agh.edu.libraryapp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.*;
import pl.agh.edu.libraryapp.book.repositories.*;
import pl.agh.edu.libraryapp.user.Role;
import pl.agh.edu.libraryapp.user.RoleRepository;
import pl.agh.edu.libraryapp.user.User;
import pl.agh.edu.libraryapp.user.UserRepository;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class LibraryAppIntegrationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BookItemRepository bookItemRepository;

    @Autowired
    private RentalsRepository rentalRepository;

    @Autowired
    private BookQueueRepository bookQueueRepository;

    @Test
    void testCreateUserWithRole() {
        // Tworzenie roli
        Role role = new Role("ADMIN");
        roleRepository.save(role);

        // Tworzenie użytkownika
        User user = new User("Jan", "Kowalski", "jan.kowalski@example.com", "123456789");
        user.setRole(role);
        userRepository.save(user);

        // Sprawdzenie
        User savedUser = userRepository.findById(user.getId()).orElse(null);
        assertNotNull(savedUser);
        assertEquals("Jan", savedUser.getFirstName());
        assertEquals("ADMIN", savedUser.getRole().getRoleName());
    }

    @Test
    void testCreateBookWithCategory() {
        // Tworzenie kategorii
        Category category = new Category("Science Fiction");
        categoryRepository.save(category);

        // Tworzenie książki
        Book book = new Book("1984", "George Orwell", 5);
        book.getCategories().add(category);
        bookRepository.save(book);

        // Sprawdzenie
        Book savedBook = bookRepository.findById(book.getId()).orElse(null);
        assertNotNull(savedBook);
        assertEquals("1984", savedBook.getTitle());
        assertEquals(1, savedBook.getCategories().size());
        assertTrue(savedBook.getCategories().stream()
                .anyMatch(c -> c.getName().equals("Science Fiction")));
    }

    @Test
    void testCreateBookItemAndRental() {
        // Przygotowanie danych
        Role role = new Role("USER");
        roleRepository.save(role);

        User user = new User("Anna", "Nowak", "anna.nowak@example.com", "987654321");
        user.setRole(role);
        userRepository.save(user);

        Book book = new Book("Clean Code", "Robert C. Martin", 3);
        bookRepository.save(book);

        BookItem bookItem = new BookItem(850, "Robert C. Martin", true);
        bookItem.setBook(book);
        bookItemRepository.save(bookItem);

        // Tworzenie wypożyczenia
        Rentals rental = new Rentals("ACTIVE", LocalDate.now());
        rental.setUser(user);
        rental.setBookItem(bookItem);
        rental.setEndDate(LocalDate.now().plusDays(14));
        rentalRepository.save(rental);

        // Sprawdzenie
        Rentals savedRental = rentalRepository.findById(rental.getId()).orElse(null);
        assertNotNull(savedRental);
        assertEquals("ACTIVE", savedRental.getStatus());
        assertEquals("Anna", savedRental.getUser().getFirstName());
        assertEquals("Clean Code", savedRental.getBookItem().getBook().getTitle());
    }

    @Test
    void testBookQueue() {
        // Przygotowanie danych
        Role role = new Role("USER");
        roleRepository.save(role);

        User user = new User("Piotr", "Wiśniewski", "piotr.wisniewski@example.com", "555666777");
        user.setRole(role);
        userRepository.save(user);

        Book book = new Book("The Pragmatic Programmer", "Andy Hunt", 2);
        bookRepository.save(book);

        // Dodanie do kolejki
        BookQueue queue = new BookQueue("WAITING");
        queue.setUser(user);
        queue.setBook(book);
        bookQueueRepository.save(queue);

        // Sprawdzenie
        BookQueue savedQueue = bookQueueRepository.findById(queue.getId()).orElse(null);
        assertNotNull(savedQueue);
        assertEquals("WAITING", savedQueue.getStatus());
        assertEquals("Piotr", savedQueue.getUser().getFirstName());
        assertEquals("The Pragmatic Programmer", savedQueue.getBook().getTitle());
    }

    @Test
    void testUniqueConstraints() {
        // Test unikalności email
        User user1 = new User("Jan", "Kowalski", "test@example.com", "111111111");
        userRepository.save(user1);

        User user2 = new User("Anna", "Nowak", "test@example.com", "222222222");

        // Powinno rzucić wyjątek z powodu duplikatu email
        assertThrows(Exception.class, () -> {
            userRepository.saveAndFlush(user2);
        });
    }
}