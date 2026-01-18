package pl.agh.edu.libraryapp.bookQueue;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.agh.edu.libraryapp.book.BookQueue;

import java.util.List;

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

    @GetMapping("/book/{bookId}/has-queue")
    public ResponseEntity<Boolean> hasQueue(@PathVariable Long bookId) {
        boolean hasQueue = !bookQueueService.getQueueByBook(bookId).isEmpty();
        return ResponseEntity.ok(hasQueue);
    }

    @GetMapping("/book/{bookId}/is-reserved")
    public ResponseEntity<Boolean> isReserved(@PathVariable Long bookId) {
        boolean isReserved = bookQueueService.isBookReservedForUser(bookId);
        return ResponseEntity.ok(isReserved);
    }

    @DeleteMapping("/leave")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Void> leaveQueue(@RequestParam Long userId,
                                           @RequestParam Long bookId) {
        bookQueueService.leaveQueue(userId, bookId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<BookQueue>> getUserQueues(@PathVariable Long userId) {
        List<BookQueue> queues = bookQueueService.getUserQueues(userId);
        return ResponseEntity.ok(queues);
    }

    @GetMapping("/book/{bookId}/details")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookQueue>> getQueueDetails(@PathVariable Long bookId) {
        List<BookQueue> queue = bookQueueService.getQueueByBook(bookId);
        return ResponseEntity.ok(queue);
    }
}
