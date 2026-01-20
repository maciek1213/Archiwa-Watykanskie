package pl.agh.edu.libraryapp.recommendations;

import org.springframework.stereotype.Service;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.BookResponseDTO;
import pl.agh.edu.libraryapp.book.Category;
import pl.agh.edu.libraryapp.book.repositories.BookRepository;
import pl.agh.edu.libraryapp.rentals.RentalsRepository;
import pl.agh.edu.libraryapp.review.ReviewRepository;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final BookRepository bookRepository;
    private final RentalsRepository rentalsRepository;
    private final ReviewRepository reviewRepository;

    public RecommendationService(BookRepository bookRepository, RentalsRepository rentalsRepository, ReviewRepository reviewRepository) {
        this.bookRepository = bookRepository;
        this.rentalsRepository = rentalsRepository;
        this.reviewRepository = reviewRepository;
    }

    public List<BookResponseDTO> getPersonalizedRecommendations(Long userId, int limit) {
        Set<Category> userCategories = rentalsRepository.findByUserId(userId).stream()
                .map(rental -> rental.getBookItem().getBook().getCategories())
                .flatMap(Set::stream)
                .collect(Collectors.toSet());

        Set<Long> readBookIds = rentalsRepository.findByUserId(userId).stream()
                .map(rental -> rental.getBookItem().getBook().getId())
                .collect(Collectors.toSet());

        List<Book> candidateBooks = new ArrayList<>();
        
        if (!userCategories.isEmpty()) {
            for (Category category : userCategories) {
                candidateBooks.addAll(bookRepository.findByCategoriesContaining(category));
            }
        }
        
        List<Book> filteredCandidates = candidateBooks.stream()
                .distinct()
                .filter(book -> !readBookIds.contains(book.getId()))
                .collect(Collectors.toList());

        if (filteredCandidates.size() < limit) {
            List<Book> topRated = bookRepository.findAll().stream()
                    .filter(book -> !readBookIds.contains(book.getId()))
                    .filter(book -> !filteredCandidates.contains(book))
                    .collect(Collectors.toList());
            filteredCandidates.addAll(topRated);
        }

        return filteredCandidates.stream()
                .sorted((b1, b2) -> {
                    Double avg1 = reviewRepository.getAverageRatingByBookId(b1.getId());
                    Double avg2 = reviewRepository.getAverageRatingByBookId(b2.getId());
                    Long count1 = reviewRepository.countByBookId(b1.getId());
                    Long count2 = reviewRepository.countByBookId(b2.getId());
                    
                    // (average * 0.7) + (count * 0.3 / 10)
                    double score1 = (avg1 != null ? avg1 : 0) * 0.7 + (count1 != null ? count1 : 0) * 0.03;
                    double score2 = (avg2 != null ? avg2 : 0) * 0.7 + (count2 != null ? count2 : 0) * 0.03;
                    
                    return Double.compare(score2, score1);
                })
                .limit(limit)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<BookResponseDTO> getSimilarBooks(Long bookId, int limit) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found"));

        Set<Category> categories = book.getCategories();
        
        if (categories.isEmpty()) {
            return getTopRated(limit);
        }

        List<Book> similarBooks = new ArrayList<>();
        for (Category category : categories) {
            similarBooks.addAll(bookRepository.findByCategoriesContaining(category));
        }

        return similarBooks.stream()
                .distinct()
                .filter(b -> !b.getId().equals(bookId))
                .sorted((b1, b2) -> {
                    Double avg1 = reviewRepository.getAverageRatingByBookId(b1.getId());
                    Double avg2 = reviewRepository.getAverageRatingByBookId(b2.getId());
                    return Double.compare(avg2 != null ? avg2 : 0, avg1 != null ? avg1 : 0);
                })
                .limit(limit)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<BookResponseDTO> getTopRated(int limit) {
        return bookRepository.findAll().stream()
                .sorted((b1, b2) -> {
                    Double avg1 = reviewRepository.getAverageRatingByBookId(b1.getId());
                    Double avg2 = reviewRepository.getAverageRatingByBookId(b2.getId());
                    Long count1 = reviewRepository.countByBookId(b1.getId());
                    Long count2 = reviewRepository.countByBookId(b2.getId());
                    
                    if (count1 == null || count1 == 0) return 1;
                    if (count2 == null || count2 == 0) return -1;
                    
                    return Double.compare(avg2 != null ? avg2 : 0, avg1 != null ? avg1 : 0);
                })
                .limit(limit)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<BookResponseDTO> getTrending(int limit) {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        
        Map<Long, Long> bookRentalCount = rentalsRepository.findAll().stream()
                .filter(rental -> rental.getStartDate().isAfter(thirtyDaysAgo))
                .collect(Collectors.groupingBy(
                        rental -> rental.getBookItem().getBook().getId(),
                        Collectors.counting()
                ));

        return bookRentalCount.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> bookRepository.findById(entry.getKey()).orElse(null))
                .filter(Objects::nonNull)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private BookResponseDTO convertToDTO(Book book) {
        BookResponseDTO dto = new BookResponseDTO();
        dto.setId(book.getId());
        dto.setTitle(book.getTitle());
        dto.setAuthor(book.getAuthor());
        dto.setCount(book.getCount());
        dto.setCategories(book.getCategories());
        dto.setAverageRating(reviewRepository.getAverageRatingByBookId(book.getId()));
        dto.setReviewCount(reviewRepository.countByBookId(book.getId()));
        return dto;
    }
}
