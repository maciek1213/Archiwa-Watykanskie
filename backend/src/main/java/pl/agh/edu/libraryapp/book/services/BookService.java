package pl.agh.edu.libraryapp.book.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.Category;
import pl.agh.edu.libraryapp.book.repositories.BookRepository;
import pl.agh.edu.libraryapp.book.repositories.CategoryRepository;
import pl.agh.edu.libraryapp.book.exceptions.BookNotFoundException;

import java.util.HashSet;
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
        mapCategories(book);
        if (book.getCount() == null) book.setCount(0);
        return bookRepository.save(book);
    }

    public Book updateBook(Long id, Book bookDetails) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));

        book.setTitle(bookDetails.getTitle());
        book.setAuthor(bookDetails.getAuthor());
        book.setCount(bookDetails.getCount());

        if (bookDetails.getCategories() != null) {
            book.getCategories().clear();

            for (Category catDetails : bookDetails.getCategories()) {
                Category managedCat = null;

                if (catDetails.getId() != null) {
                    managedCat = categoryRepository.findById(catDetails.getId()).orElse(null);
                } else if (catDetails.getName() != null && !catDetails.getName().isEmpty()) {
                    managedCat = categoryRepository.findByName(catDetails.getName())
                            .orElseGet(() -> categoryRepository.save(new Category(catDetails.getName())));
                }

                if (managedCat != null) {
                    book.getCategories().add(managedCat);
                }
            }
        }

        return bookRepository.save(book);
    }

    private void mapCategories(Book book) {
        if (book.getCategories() != null) {
            Set<Category> managedCategories = new HashSet<>();
            for (Category cat : book.getCategories()) {
                if (cat.getId() != null) {
                    categoryRepository.findById(cat.getId())
                            .ifPresent(managedCategories::add);
                }
            }
            book.setCategories(managedCategories);
        }
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public void deleteBook(Long id) {
        bookRepository.deleteById(id);
    }

    public void incrementBookCount(Long bookId) {
        bookRepository.findById(bookId).ifPresent(b -> {
            b.setCount(b.getCount() + 1);
            bookRepository.save(b);
        });
    }

    public void decrementBookCount(Long bookId) {
        bookRepository.findById(bookId).ifPresent(b -> {
            if (b.getCount() > 0) {
                b.setCount(b.getCount() - 1);
                bookRepository.save(b);
            }
        });
    }

    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new BookNotFoundException("Book not found with id: " + id));
    }

    public List<Book> searchBooks(String title, String author, String categoryName) {
        if (title != null && !title.isEmpty()) return bookRepository.findByTitleContainingIgnoreCase(title);
        if (author != null && !author.isEmpty()) return bookRepository.findByAuthorContainingIgnoreCase(author);
        return getAllBooks();
    }
}