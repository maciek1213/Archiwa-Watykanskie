package pl.agh.edu.libraryapp.stats;

import pl.agh.edu.libraryapp.book.Book;

public record BookRentalsDTO(Book book, Long timesRented) {
}
