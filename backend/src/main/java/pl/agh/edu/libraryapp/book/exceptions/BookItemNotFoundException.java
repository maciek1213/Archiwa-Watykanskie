package pl.agh.edu.libraryapp.book.exceptions;

public class BookItemNotFoundException extends RuntimeException {
    public BookItemNotFoundException(String message) {
        super(message);
    }
}