package pl.agh.edu.libraryapp.book.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.Review;
import pl.agh.edu.libraryapp.book.exceptions.BookNotFoundException;
import pl.agh.edu.libraryapp.book.repositories.BookRepository;
import pl.agh.edu.libraryapp.book.repositories.ReviewRepository;
import pl.agh.edu.libraryapp.user.User;
import pl.agh.edu.libraryapp.user.UserNotFoundException;
import pl.agh.edu.libraryapp.user.UserRepository;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, BookRepository bookRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    public Review createReview(Long bookId, Long userId, Integer rating, String description) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new BookNotFoundException("Book not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        // Check if user already reviewed this book
        Optional<Review> existingReview = reviewRepository.findByBookIdAndUserId(bookId, userId);
        if (existingReview.isPresent()) {
            throw new IllegalStateException("User has already reviewed this book");
        }

        Review review = new Review(rating, description, book, user);
        return reviewRepository.save(review);
    }

    public List<Review> getReviewsByBookId(Long bookId) {
        return reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId);
    }

    public Double getAverageRating(Long bookId) {
        Double average = reviewRepository.getAverageRatingByBookId(bookId);
        return average != null ? average : 0.0;
    }

    public Long getReviewCount(Long bookId) {
        return reviewRepository.countByBookId(bookId);
    }

    public Optional<Review> getUserReviewForBook(Long bookId, Long userId) {
        return reviewRepository.findByBookIdAndUserId(bookId, userId);
    }

    public void deleteReview(Long reviewId, Long userId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        // Check if user is the owner or admin
        if (!isAdmin && !review.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only delete your own reviews");
        }
        
        reviewRepository.deleteById(reviewId);
    }

    public Review updateReview(Long reviewId, Long userId, boolean isAdmin, Integer rating, String description) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        // Check if user is the owner or admin
        if (!isAdmin && !review.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only update your own reviews");
        }
        
        review.setRating(rating);
        review.setDescription(description);
        
        return reviewRepository.save(review);
    }
}
