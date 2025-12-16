package pl.agh.edu.libraryapp.book.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.BookQueue;
import pl.agh.edu.libraryapp.book.repositories.BookQueueRepository;
import pl.agh.edu.libraryapp.book.exceptions.QueueNotFoundException;
import pl.agh.edu.libraryapp.user.User;
import pl.agh.edu.libraryapp.user.UserRepository;

import java.util.List;

@Service
@Transactional
public class BookQueueService {

    private final BookQueueRepository bookQueueRepository;
    private final BookService bookService;
    private final UserRepository userRepository;

    public BookQueueService(BookQueueRepository bookQueueRepository, BookService bookService,
                        UserRepository userRepository) {
        this.bookQueueRepository = bookQueueRepository;
        this.bookService = bookService;
        this.userRepository = userRepository;
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
        return bookQueueRepository.findByBookAndStatusOrderByIdAsc(book, "WAITING");
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
        nextInLine.setStatus("NOTIFIED");
        return bookQueueRepository.save(nextInLine);
    }

    public int getPositionInQueue(Long userId, Long bookId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Book book = bookService.getBookById(bookId);

        List<BookQueue> queue = bookQueueRepository.findByBookAndStatusOrderByIdAsc(book, "WAITING");

        for (int i = 0; i < queue.size(); i++) {
            if (queue.get(i).getUser().getId().equals(userId)) {
                return i + 1; // Position (1-based)
            }
        }

        return -1; // Not in queue
    }

    public void notifyAvailableBook(Long bookId) {
        BookQueue nextInLine = processNextInQueue(bookId);
        if (nextInLine != null) {
            // Here you would implement actual notification logic
            // e.g., send email, push notification, etc.
            System.out.println("Notifying user: " + nextInLine.getUser().getEmail() +
                    " that book '" + nextInLine.getBook().getTitle() + "' is available");
        }
    }
}