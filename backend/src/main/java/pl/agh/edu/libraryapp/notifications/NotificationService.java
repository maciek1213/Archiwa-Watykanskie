package pl.agh.edu.libraryapp.notifications;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.Rentals;
import pl.agh.edu.libraryapp.user.User;

import java.util.List;

@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    private void save(User user, String title, String message) {
        Notification notification = new Notification(title, message, user);
        notificationRepository.save(notification);
    }

    @Transactional
    public void addBookAvailableNotification(User user, Book book) {
        String title = "Książka czeka na odbiór";
        String message = String.format("Zarezerwowana pozycja '%s' (autor: %s) jest już dostępna do odbioru.",
                book.getTitle(), book.getAuthor());

        save(user, title, message);
    }
    @Transactional
    public void addBookOverdueNotification(Rentals rental) {
        String title = "Pilne: Przekroczono termin!";
        String message = String.format("Termin zwrotu książki '%s' minął %s. Prosimy o niezwłoczny zwrot, aby uniknąć naliczania dalszych opłat.",
                rental.getBookItem().getBook().getTitle(), rental.getEndDate());

        save(rental.getUser(), title, message);
    }
    @Transactional
    public void addBookReturnedNotification(Rentals rental) {
        String title = "Potwierdzenie zwrotu";
        String message = String.format("Książka '%s' została pomyślnie zwrócona do systemu. Dziękujemy!",
                rental.getBookItem().getBook().getTitle());

        save(rental.getUser(), title, message);
    }
    @Transactional
    public void addUpcomingReturnReminder(Rentals rental) {
        String title = "Zbliżający się termin zwrotu";
        String message = String.format("Przypominamy, że termin zwrotu książki '%s' upływa za 3 dni (%s).",
                rental.getBookItem().getBook().getTitle(), rental.getEndDate());

        save(rental.getUser(), title, message);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElseThrow(
                EntityNotFoundException::new
        );

        notification.setStatus(NotificationStatus.READ);
    }

    public List<Notification> getNotifications() {
        return notificationRepository.findByOrderByCreatedAtDesc();
    }

    public List<Notification> getNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}