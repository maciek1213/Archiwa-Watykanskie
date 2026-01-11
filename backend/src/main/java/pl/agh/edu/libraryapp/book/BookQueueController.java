package pl.agh.edu.libraryapp.book;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.agh.edu.libraryapp.book.services.BookQueueService;

@RestController
@RequestMapping("/queue")
public class BookQueueController {

    private final BookQueueService bookQueueService;

    public BookQueueController(BookQueueService bookQueueService) {
        this.bookQueueService = bookQueueService;
    }

    @PostMapping("/reserve")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<BookQueue> reserveBook(@RequestParam Long userId,
                                                 @RequestParam Long bookId) {
        BookQueue queue = bookQueueService.addToQueue(userId, bookId);
        return ResponseEntity.ok(queue);
    }

    @GetMapping("/book/{bookId}/position")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Integer> getPosition(@RequestParam Long userId,
                                               @PathVariable Long bookId) {
        int position = bookQueueService.getPositionInQueue(userId, bookId);
        return ResponseEntity.ok(position);
    }
}
