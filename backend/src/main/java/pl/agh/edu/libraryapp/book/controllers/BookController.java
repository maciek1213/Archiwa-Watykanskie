package pl.agh.edu.libraryapp.book.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.exceptions.BookNotFoundException;
import pl.agh.edu.libraryapp.book.services.BookService;
import pl.agh.edu.libraryapp.dto.BookInDto;
import pl.agh.edu.libraryapp.dto.BookOutDto;
import pl.agh.edu.libraryapp.user.UserService;

import java.util.List;

@RestController
@RequestMapping("/book")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService, UserService userService) {
        this.bookService = bookService;
    }

    @GetMapping("/{id}")
    private ResponseEntity<BookOutDto> getBookById(@PathVariable Long id){
        try {
            Book book = bookService.getBookById(id);
            BookOutDto dto = bookService.asOutDto(book);
            return ResponseEntity.ok(dto);
        } catch (BookNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Long> createBook(@RequestBody BookInDto bookInDto){
        Long id = bookService.createBookFromDto(bookInDto);
        return ResponseEntity.ok(id);
    }

    @GetMapping("/all")
    public ResponseEntity<List<BookOutDto>> getAllBooks(){
        List<BookOutDto> books = bookService.getAllBooks().stream()
                .map(bookService::asOutDto)
                .toList();

        return ResponseEntity.ok(books);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<BookOutDto>> getBooksPaged(
            @PageableDefault(size = 20, sort = "title") Pageable pageable) {

        Page<BookOutDto> books = bookService.getBooks(pageable)
                .map(bookService::asOutDto);

        return ResponseEntity.ok(books);
    }

    @GetMapping("/author/{author}")
    public ResponseEntity<List<BookOutDto>> getBooksByAuthor(@PathVariable String author){
        //todo
        return null;
    }
}
