package pl.agh.edu.libraryapp.book.exceptions;

public class BookItemNotAvailableException extends RuntimeException {
    public BookItemNotAvailableException(String message) {
        super(message);
    }
}