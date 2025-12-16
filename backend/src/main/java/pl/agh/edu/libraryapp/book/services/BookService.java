package pl.agh.edu.libraryapp.book.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.Category;
import pl.agh.edu.libraryapp.book.repositories.BookRepository;
import pl.agh.edu.libraryapp.book.repositories.CategoryRepository;
import pl.agh.edu.libraryapp.book.exceptions.BookNotFoundException;
import pl.agh.edu.libraryapp.book.exceptions.BookNotAvailableException;

import java.util.List;
import java.util.Set;

@Service
@Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;

    public BookService(BookRepository bookRepository, CategoryRepository categoryRepository) {
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
    }

    public Book createBook(Book book) {
        return bookRepository.save(book);
    }

    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException("Book not found with id: " + id));
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Book updateBook(Long id, Book bookDetails) {
        Book book = getBookById(id);
        book.setTitle(bookDetails.getTitle());
        book.setAuthor(bookDetails.getAuthor());
        book.setCount(bookDetails.getCount());
        return bookRepository.save(book);
    }

    public void deleteBook(Long id) {
        Book book = getBookById(id);
        bookRepository.delete(book);
    }

    public boolean isBookAvailable(Long bookId) {
        Book book = getBookById(bookId);
        return book.getCount() > 0;
    }

    public List<Book> searchBooks(String title, String author, String categoryName) {
        if (title != null && !title.isEmpty()) {
            return bookRepository.findByTitleContainingIgnoreCase(title);
        } else if (author != null && !author.isEmpty()) {
            return bookRepository.findByAuthorContainingIgnoreCase(author);
        } else if (categoryName != null && !categoryName.isEmpty()) {
            Category category = categoryRepository.findByName(categoryName)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            return bookRepository.findByCategoriesContaining(category);
        }
        return getAllBooks();
    }

    public Book addCategoryToBook(Long bookId, Long categoryId) {
        Book book = getBookById(bookId);
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        book.getCategories().add(category);
        category.getBooks().add(book);

        return bookRepository.save(book);
    }

    public void decrementBookCount(Long bookId) {
        Book book = getBookById(bookId);
        if (book.getCount() <= 0) {
            throw new BookNotAvailableException("Book is not available");
        }
        book.setCount(book.getCount() - 1);
        bookRepository.save(book);
    }

    public void incrementBookCount(Long bookId) {
        Book book = getBookById(bookId);
        book.setCount(book.getCount() + 1);
        bookRepository.save(book);
    }
}