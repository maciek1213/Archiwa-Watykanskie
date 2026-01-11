package pl.agh.edu.libraryapp.rentals;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pl.agh.edu.libraryapp.book.Rentals;
import pl.agh.edu.libraryapp.book.repositories.RentalsRepository; // Zakładam, że masz takie repozytorium
import pl.agh.edu.libraryapp.notifications.NotificationService;

import java.time.LocalDate;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class RentalsScheduler {

    private final RentalsRepository rentalRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void checkOverdueRentals() {
        List<Rentals> overdueRentals = rentalRepository.findOverdueRentals(LocalDate.now());

        for (Rentals rental : overdueRentals) {
            notificationService.addBookOverdueNotification(rental);
            rental.setStatus("OVERDUE");
            rentalRepository.save(rental);
        }
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void checkSoonOverdueRentals() {
        LocalDate soon = LocalDate.now().plusDays(3);
        List<Rentals> overdueRentals = rentalRepository.findByStatusAndEndDate("ACTIVE" ,soon);

        for (Rentals rental : overdueRentals) {
            notificationService.addUpcomingReturnReminder(rental);
        }

    }
}