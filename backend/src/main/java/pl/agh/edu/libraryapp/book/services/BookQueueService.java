package pl.agh.edu.libraryapp.book.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.BookQueue;
import pl.agh.edu.libraryapp.book.repositories.BookQueueRepository;
import pl.agh.edu.libraryapp.book.exceptions.QueueNotFoundException;
import pl.agh.edu.libraryapp.notifications.NotificationService;
import pl.agh.edu.libraryapp.user.User;
import pl.agh.edu.libraryapp.user.UserRepository;

import java.util.List;

@Service
@Transactional
public class BookQueueService {

    private final BookQueueRepository bookQueueRepository;
    private final BookService bookService;
    private final UserRepository userRepository;
    private final NotificationService  notificationService;

    public BookQueueService(BookQueueRepository bookQueueRepository, BookService bookService,
                        UserRepository userRepository,  NotificationService notificationService) {
        this.bookQueueRepository = bookQueueRepository;
        this.bookService = bookService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public BookQueue addToQueue(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Book book = bookService.getBookById(bookId);

        if (bookQueueRepository.existsByUserAndBookAndStatus(user, book, "WAITING")) {
            throw new RuntimeException("User is already in queue for this book");
        }

        BookQueue queue = new BookQueue();
        queue.setUser(user);
        queue.setBook(book);
        queue.setStatus("WAITING");

        return bookQueueRepository.save(queue);
    }

    public void removeFromQueue(Long queueId) {
        BookQueue queue = getQueueById(queueId);
        bookQueueRepository.delete(queue);
    }

    public BookQueue getQueueById(Long id) {
        return bookQueueRepository.findById(id)
                .orElseThrow(() -> new QueueNotFoundException("Queue entry not found with id: " + id));
    }

    public List<BookQueue> getQueueByBook(Long bookId) {
        Book book = bookService.getBookById(bookId);
        // Zwróć wszystkie wpisy w kolejce (zarówno WAITING jak i NOTIFIED)
        List<BookQueue> allQueue = bookQueueRepository.findByBookOrderByIdAsc(book);
        return allQueue.stream()
                .filter(q -> "WAITING".equals(q.getStatus()) || "NOTIFIED".equals(q.getStatus()))
                .toList();
    }

    public List<BookQueue> getUserQueues(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookQueueRepository.findByUser(user);
    }

    public BookQueue processNextInQueue(Long bookId) {
        List<BookQueue> queue = getQueueByBook(bookId);

        if (queue.isEmpty()) {
            return null;
        }

        BookQueue nextInLine = queue.get(0);
        return nextInLine;
    }

    public int getPositionInQueue(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookService.getBookById(bookId);

        List<BookQueue> allQueue = getQueueByBook(bookId);

        for (int i = 0; i < allQueue.size(); i++) {
            if (allQueue.get(i).getUser().getId().equals(userId)) {
                return i + 1; // Position (1-based)
            }
        }

        return -1; // Not in queue
    }

    @Transactional
    public void notifyAvailableBook(Long bookId) {
        List<BookQueue> queue = getQueueByBook(bookId);
        
        if (queue.isEmpty()) {
            return;
        }
        
        BookQueue nextInLine = queue.get(0);
        // Zmień status na NOTIFIED ale nie usuwaj z kolejki
        nextInLine.setStatus("NOTIFIED");
        bookQueueRepository.save(nextInLine);
        
        // Wyślij powiadomienie
        notificationService.addBookAvailableNotification(
                nextInLine.getUser(),
                nextInLine.getBook()
        );
    }

    @Transactional
    public void removeUserFromNotifiedQueue(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookService.getBookById(bookId);
        
        // Znajdź i usuń wpis z kolejki dla tego użytkownika i książki
        List<BookQueue> userQueues = bookQueueRepository.findByUserAndBook(user, book);
        if (!userQueues.isEmpty()) {
            bookQueueRepository.deleteAll(userQueues);
        }
    }

    public boolean canUserBorrowBook(Long userId, Long bookId) {
        List<BookQueue> queue = getQueueByBook(bookId);
        
        if (queue.isEmpty()) {
            return true;
        }
        
        // Jeśli jest kolejka, tylko pierwszy może wypożyczyć
        BookQueue firstInQueue = queue.get(0);
        return firstInQueue.getUser().getId().equals(userId);
    }

    @Transactional
    public void leaveQueue(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookService.getBookById(bookId);
        
        List<BookQueue> userQueues = bookQueueRepository.findByUserAndBook(user, book);
        if (!userQueues.isEmpty()) {
            bookQueueRepository.deleteAll(userQueues);
        }
    }

    public boolean isBookReservedForUser(Long bookId) {
        List<BookQueue> queue = getQueueByBook(bookId);
        
        if (queue.isEmpty()) {
            return false;
        }
        
        BookQueue firstInQueue = queue.get(0);
        return "NOTIFIED".equals(firstInQueue.getStatus());
    }
}