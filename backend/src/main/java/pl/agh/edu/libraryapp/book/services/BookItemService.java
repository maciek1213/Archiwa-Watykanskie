package pl.agh.edu.libraryapp.book.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.BookItem;
import pl.agh.edu.libraryapp.book.exceptions.BookItemNotFoundException;
import pl.agh.edu.libraryapp.book.exceptions.BookNotFoundException;
import pl.agh.edu.libraryapp.book.repositories.BookItemRepository;
import pl.agh.edu.libraryapp.book.repositories.BookRepository;

import java.util.List;

@Service
@Transactional
public class BookItemService {

    private final BookItemRepository bookItemRepository;
    private final BookRepository bookRepository;

    public BookItemService(BookItemRepository bookItemRepository, BookRepository bookRepository) {
        this.bookItemRepository = bookItemRepository;
        this.bookRepository = bookRepository;
    }

    public BookItem createBookItem(Long bookId, BookItem bookItem) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found with id: " + bookId));

        bookItem.setBook(book);
        bookItem.setIsAvailable(true);

        return bookItemRepository.save(bookItem);
    }

    public BookItem getBookItemById(Long id) {
        return bookItemRepository.findById(id)
                .orElseThrow(() -> new BookItemNotFoundException("BookItem not found with id: " + id));
    }

    public List<BookItem> getAllBookItems() {
        return bookItemRepository.findAll();
    }

    public List<BookItem> getBookItemsByBook(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));
        return bookItemRepository.findByBook(book);
    }

    public List<BookItem> getAvailableBookItemsByBook(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));
        return bookItemRepository.findByBookAndIsAvailableTrue(book);
    }

    public BookItem updateBookItemStatus(Long bookItemId, Boolean isAvailable) {
        BookItem bookItem = getBookItemById(bookItemId);
        bookItem.setIsAvailable(isAvailable);
        return bookItemRepository.save(bookItem);
    }

    public void deleteBookItem(Long id) {
        BookItem bookItem = getBookItemById(id);
        bookItemRepository.delete(bookItem);
    }

    public BookItem markAsRented(Long bookItemId) {
        return updateBookItemStatus(bookItemId, false);
    }

    public BookItem markAsAvailable(Long bookItemId) {
        return updateBookItemStatus(bookItemId, true);
    }

    public boolean isBookItemAvailable(Long bookItemId) {
        BookItem bookItem = getBookItemById(bookItemId);
        return bookItem.getIsAvailable();
    }
}