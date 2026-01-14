package pl.agh.edu.libraryapp.book;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.agh.edu.libraryapp.book.services.BookItemService;
import pl.agh.edu.libraryapp.book.services.BookService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/book")
public class BookController {

    private final BookService bookService;
    private final BookItemService bookItemService;

    public BookController(BookService bookService, BookItemService bookItemService) {
        this.bookService = bookService;
        this.bookItemService = bookItemService;
    }

    @GetMapping
    public List<BookResponseDTO> getAllBooks() {
        return bookService.getAllBooks().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Book> createBook(@RequestBody Book book) {
        return ResponseEntity.ok(bookService.createBook(book));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @RequestBody Book bookDetails) {
        return ResponseEntity.ok(bookService.updateBook(id, bookDetails));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{bookId}/items")
    public List<BookItem> getBookItems(@PathVariable Long bookId) {
        return bookItemService.getBookItemsByBook(bookId);
    }

    @PostMapping("/{bookId}/items")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookItem> createBookItem(@PathVariable Long bookId, @RequestBody BookItem bookItem) {
        BookItem saved = bookItemService.createBookItem(bookId, bookItem);
        bookService.incrementBookCount(bookId);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBookItem(@PathVariable Long itemId) {
        BookItem item = bookItemService.getBookItemById(itemId);
        Long bookId = item.getBook().getId();
        bookItemService.deleteBookItem(itemId);
        bookService.decrementBookCount(bookId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookItem> updateBookItem(@PathVariable Long itemId, @RequestBody BookItem bookItemDetails) {
        BookItem updatedItem = bookItemService.updateBookItem(itemId, bookItemDetails);
        return ResponseEntity.ok(updatedItem);
    }

    @GetMapping("/{bookId}")
    public BookResponseDTO getBook(@PathVariable Long bookId) {
        Book book = bookService.getBookById(bookId);
        return convertToDTO(book);
    }

    private BookResponseDTO convertToDTO(Book book) {
        BookResponseDTO dto = new BookResponseDTO();
        dto.setId(book.getId());
        dto.setTitle(book.getTitle());
        dto.setAuthor(book.getAuthor());
        dto.setCount(book.getCount());
        dto.setCategories(book.getCategories());
        return dto;
    }
}