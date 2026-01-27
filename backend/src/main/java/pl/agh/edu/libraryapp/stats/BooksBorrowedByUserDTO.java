package pl.agh.edu.libraryapp.stats;

import pl.agh.edu.libraryapp.user.User;

public record BooksBorrowedByUserDTO(User user, Long booksBorrowed) {
}
