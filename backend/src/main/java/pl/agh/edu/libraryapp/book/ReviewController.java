package pl.agh.edu.libraryapp.book;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pl.agh.edu.libraryapp.book.services.ReviewService;
import pl.agh.edu.libraryapp.user.User;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/book/{bookId}/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getReviewsByBook(@PathVariable Long bookId) {
        List<Review> reviews = reviewService.getReviewsByBookId(bookId);
        Double averageRating = reviewService.getAverageRating(bookId);
        Long reviewCount = reviewService.getReviewCount(bookId);

        Map<String, Object> response = new HashMap<>();
        response.put("reviews", reviews);
        response.put("averageRating", averageRating);
        response.put("reviewCount", reviewCount);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createReview(
            @PathVariable Long bookId,
            @RequestBody ReviewRequest reviewRequest,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        
        try {
            Review review = reviewService.createReview(
                bookId, 
                user.getId(), 
                reviewRequest.getRating(), 
                reviewRequest.getDescription()
            );
            return ResponseEntity.ok(review);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUserReview(@PathVariable Long bookId, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return reviewService.getUserReviewForBook(bookId, user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteReview(@PathVariable Long bookId, @PathVariable Long reviewId, Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        
        try {
            reviewService.deleteReview(reviewId, user.getId(), isAdmin);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PutMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateReview(
            @PathVariable Long bookId,
            @PathVariable Long reviewId,
            @RequestBody ReviewRequest reviewRequest,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        
        try {
            reviewService.updateReview(reviewId, user.getId(), isAdmin, reviewRequest.getRating(), reviewRequest.getDescription());
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    static class ReviewRequest {
        private Integer rating;
        private String description;

        public Integer getRating() {
            return rating;
        }

        public void setRating(Integer rating) {
            this.rating = rating;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}
