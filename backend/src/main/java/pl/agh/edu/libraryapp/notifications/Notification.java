package pl.agh.edu.libraryapp.notifications;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pl.agh.edu.libraryapp.user.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    private Long id;

    @Column(nullable = false)
    private String title;

    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status;

    private LocalDateTime createdAt;

    public Notification(String title, String message, User user) {
        this.title = title;
        this.message = message;
        this.user = user;
        this.createdAt = LocalDateTime.now();
    }
}
