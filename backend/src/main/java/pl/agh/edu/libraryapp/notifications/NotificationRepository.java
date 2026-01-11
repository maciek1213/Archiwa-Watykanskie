package pl.agh.edu.libraryapp.notifications;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.agh.edu.libraryapp.book.Rentals;
import pl.agh.edu.libraryapp.user.User;

import java.time.LocalDate;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByOrderByCreatedAtDesc();

    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(Long id, NotificationStatus status);
}
