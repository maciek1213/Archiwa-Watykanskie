package pl.agh.edu.libraryapp.bookItem;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.exceptions.BookNotFoundException;
import pl.agh.edu.libraryapp.book.services.BookService;
import pl.agh.edu.libraryapp.book.repositories.BookRepository;

import java.util.List;

@Service
@Transactional
public class BookItemService {
    private final BookItemRepository bookItemRepository;
    private final BookRepository bookRepository;
    private final BookService bookService;

    public BookItemService(BookItemRepository bookItemRepository, BookRepository bookRepository,  BookService bookService) {
        this.bookItemRepository = bookItemRepository;
        this.bookRepository = bookRepository;
        this.bookService = bookService;
    }

    public BookItem createBookItem(Long bookId, BookItem bookItem) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));
        bookItem.setBook(book);
        return bookItemRepository.save(bookItem);
    }

    public BookItem updateBookItem(Long itemId, BookItem details) {
        BookItem item = bookItemRepository.findById(itemId)
                .orElseThrow(() -> new BookItemNotFoundException("Egzemplarz o podanym ID nie istnieje"));

        item.setIsbn(details.getIsbn());
        item.setIsAvailable(details.getIsAvailable());

        return bookItemRepository.save(item);
    }

    public BookItem getBookItemById(Long id) {
        return bookItemRepository.findByIdWithBook(id)
                .orElseThrow(() -> new BookItemNotFoundException("BookItem not found"));
    }

    public List<BookItem> getBookItemsByBook(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));
        return bookItemRepository.findByBook(book);
    }

    public void deleteBookItem(Long id) {
        BookItem bookItem = getBookItemById(id);
        bookItemRepository.delete(bookItem);
    }

    public BookItem updateBookItemStatus(Long id, Boolean isAvailable) {
        BookItem item = getBookItemById(id);
        item.setIsAvailable(isAvailable);
        return bookItemRepository.save(item);
    }

    public List<BookItem> getAllBookItems() {
        return bookItemRepository.findAll();
    }

    public List<BookItem> getAvailableBookItemsByBook(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));
        return bookItemRepository.findByBookAndIsAvailableTrue(book);
    }

    @Transactional
    public BookItem markAsRented(Long bookItemId) {
        BookItem item = updateBookItemStatus(bookItemId, false);
        bookService.decrementBookCount(item.getBook().getId());
        return item;
    }

    @Transactional
    public BookItem markAsAvailable(Long bookItemId) {
        BookItem item = updateBookItemStatus(bookItemId, true);
        bookService.incrementBookCount(item.getBook().getId());
        return item;
    }

    public boolean isBookItemAvailable(Long bookItemId) {
        BookItem bookItem = getBookItemById(bookItemId);
        return bookItem.getIsAvailable();
    }
}