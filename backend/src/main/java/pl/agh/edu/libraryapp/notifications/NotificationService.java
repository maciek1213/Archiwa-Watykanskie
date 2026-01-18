package pl.agh.edu.libraryapp.notifications;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Book;
import pl.agh.edu.libraryapp.book.Rentals;
import pl.agh.edu.libraryapp.user.User;
import pl.agh.edu.libraryapp.user.UserService;

import java.util.List;

@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final LibraryMailService mailService;

    public NotificationService(NotificationRepository notificationRepository, UserService userService, LibraryMailService mailService) {
        this.notificationRepository = notificationRepository;
        this.userService = userService;
        this.mailService = mailService;
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

        mailService.sendMail(title, message, user.getEmail());
        save(user, title, message);
    }
    @Transactional
    public void addBookOverdueNotification(Rentals rental) {
        String title = "Pilne: Przekroczono termin!";
        String message = String.format("Termin zwrotu książki '%s' minął %s. Prosimy o niezwłoczny zwrot, aby uniknąć naliczania dalszych opłat.",
                rental.getBookItem().getBook().getTitle(), rental.getEndDate());

        mailService.sendMail(title, message, rental.getUser().getEmail());
        save(rental.getUser(), title, message);
    }
    @Transactional
    public void addBookReturnedNotification(Rentals rental) {
        String title = "Potwierdzenie zwrotu";
        String message = String.format("Książka '%s' została pomyślnie zwrócona do systemu. Dziękujemy!",
                rental.getBookItem().getBook().getTitle());
        mailService.sendMail(title, message, rental.getUser().getEmail());
        save(rental.getUser(), title, message);
    }
    @Transactional
    public void addUpcomingReturnReminder(Rentals rental) {
        String title = "Zbliżający się termin zwrotu";
        String message = String.format("Przypominamy, że termin zwrotu książki '%s' upływa za 3 dni (%s).",
                rental.getBookItem().getBook().getTitle(), rental.getEndDate());

        mailService.sendMail(title, message, rental.getUser().getEmail());
        save(rental.getUser(), title, message);
    }

    @Transactional
    public void addBookRentedNotification(Rentals rental) {
        String title = "Wypożyczono książkę";
        String message = String.format("Książka '%s jest gotowa do odebrania.",
                rental.getBookItem().getBook().getTitle());

        mailService.sendMail(title, message, rental.getUser().getEmail());
        Notification notification = new Notification(title, message, rental.getUser());
        notificationRepository.save(notification);
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

    public List<Notification> getNewNotifications(Long userId) {
        return notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, NotificationStatus.NEW);
    }

    public NotificationDto toDto(Notification notification) {
        return new NotificationDto(notification.getId() ,notification.getTitle(), notification.getMessage());
    }
}