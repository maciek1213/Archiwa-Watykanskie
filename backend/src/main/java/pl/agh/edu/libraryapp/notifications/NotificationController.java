package pl.agh.edu.libraryapp.notifications;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pl.agh.edu.libraryapp.user.User;
import pl.agh.edu.libraryapp.user.UserService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/new")
    public ResponseEntity<List<NotificationDto>> getMyNewNotifications(@AuthenticationPrincipal User user) {
        List<NotificationDto> notifications = notificationService.getNewNotifications(user.getId())
                .stream()
                .map(notificationService::toDto)
                .toList();

        return ResponseEntity.ok(notifications);
    }

    @GetMapping()
    public ResponseEntity<List<NotificationDto>> getUserNotifications(@AuthenticationPrincipal User user) {
        List<NotificationDto> notifications = notificationService.getNotifications(user.getId())
                .stream()
                .map(notificationService::toDto).
                toList();

        return new ResponseEntity<>(notifications, HttpStatus.OK);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setNotificationAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }
}
