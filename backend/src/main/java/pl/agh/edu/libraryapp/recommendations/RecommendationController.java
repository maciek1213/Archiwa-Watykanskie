package pl.agh.edu.libraryapp.recommendations;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pl.agh.edu.libraryapp.book.BookResponseDTO;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "http://localhost:5173")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/for-user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookResponseDTO>> getPersonalizedRecommendations(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(userId, limit));
    }

    @GetMapping("/similar/{bookId}")
    public ResponseEntity<List<BookResponseDTO>> getSimilarBooks(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "4") int limit) {
        return ResponseEntity.ok(recommendationService.getSimilarBooks(bookId, limit));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<BookResponseDTO>> getTrending(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(recommendationService.getTrending(limit));
    }

    @GetMapping("/top-rated")
    public ResponseEntity<List<BookResponseDTO>> getTopRated(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(recommendationService.getTopRated(limit));
    }
}
