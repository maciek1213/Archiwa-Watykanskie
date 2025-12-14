package pl.agh.edu.libraryapp.book.exceptions;

public class QueueNotFoundException extends RuntimeException {
    public QueueNotFoundException(String message) {
        super(message);
    }
}